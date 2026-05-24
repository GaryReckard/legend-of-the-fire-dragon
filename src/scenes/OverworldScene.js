import { Scene } from '../core/Scene.js';
import { generateOverworld, WORLD_DIMS } from '../world/WorldGen.js';
import { TILE_SIZE, T, prop } from '../world/tiles.js';
import { BIOMES, biomeOf } from '../world/Biome.js';
import { Slime } from '../entities/Slime.js';
import { BogWraith } from '../entities/BogWraith.js';
import { IceSkeleton } from '../entities/IceSkeleton.js';
import { FireImp } from '../entities/FireImp.js';
import { Npc, GREENHAVEN_NPCS } from '../entities/Npc.js';
import { SpiritOfGrove } from '../entities/SpiritOfGrove.js';
import { rectsOverlap } from '../entities/Entity.js';
import { LORE_BOOKS, BOOK_ORDER } from '../world/Lore.js';
import { extractDeathCache, redeemDeathCache } from '../mechanics/Death.js';
import { Haptics } from '../core/Haptics.js';
import { Projectile, dirVector } from '../entities/Projectile.js';
import { applySwordHits, applyEnemyTouch } from '../mechanics/Combat.js';
import { tryInteract, facingInteractable, drawInteractHint } from '../mechanics/Puzzle.js';
import { tickSurvival } from '../mechanics/Survival.js';
import { Debug } from '../core/Debug.js';

const ENEMY_CAP = 14;

export class OverworldScene extends Scene {
  constructor(game) {
    super(game);
    this.gen = null;
    this.spawnT = 1.5;
  }

  enter(payload) {
    if (!this.gen) {
      this.gen = generateOverworld();
    }
    this.game.state = 'playing';
    // Determine spawn position:
    //   - respawn after death → last campfire (or world spawn if none)
    //   - otherwise → world spawn
    let sp;
    if (payload?.respawned && this.game.flags.lastCampfire) {
      sp = this.game.flags.lastCampfire;
    } else {
      sp = this.gen.spawn;
    }
    this.game.player.setPos(sp.x, sp.y);
    this.game.player.dead = false;
    this.game.player.deathT = 0;
    this.game.player.hp = this.game.player.maxHp;
    this.game.player.hunger = this.game.player.maxHunger;
    this.game.player.stamina = this.game.player.maxStamina;
    this.game.player.invulnT = payload?.respawned ? 1.0 : 0;
    this.entities = [];
    this.npcs = [];
    this.projectiles = [];
    this.particles = [];
    this.game.camera.setWorld(this.gen.map.pixelW(), this.gen.map.pixelH());
    this.showMessage(`Welcome, ${this.game.player.name}. Greenhaven is east of spawn. Talk to the villagers.`, 4);

    // Spawn Greenhaven village further east so it feels like a journey
    this.buildGreenhaven();
  }

  // Lay out the village of Greenhaven: clearing, three cabins, a fountain.
  // Each NPC stands in front of their own cabin.
  buildGreenhaven() {
    const tm = this.tilemap;
    const spawnTx = Math.floor(this.gen.spawn.x / TILE_SIZE);
    const spawnTy = Math.floor(this.gen.spawn.y / TILE_SIZE);
    // Village center 12 tiles east of spawn
    const vx = spawnTx + 12;
    const vy = spawnTy + 1;

    // Carve a 16x14 clearing of grass
    for (let dy = -7; dy <= 6; dy++) {
      for (let dx = -8; dx <= 8; dx++) {
        const tx = vx + dx, ty = vy + dy;
        if (!tm.inBounds(tx, ty)) continue;
        const t = tm.get(tx, ty);
        if (t === T.WATER) continue;  // don't fill the pond
        tm.set(tx, ty, T.GRASS);
      }
    }
    // Dirt path from spawn to village center
    for (let i = 0; i < 12; i++) {
      tm.set(spawnTx + i + 1, spawnTy, T.SAND);
      tm.set(spawnTx + i + 1, spawnTy + 1, T.SAND);
    }

    // Three 4x4 cabins arranged around a central square
    //   Cabin layout (4 wide, 4 tall): walls on border, wood floor inside, doorway at bottom-center
    const cabins = [
      { ox: -6, oy: -4, npcOx: 1, npcOy: 4 },  // Mira NW
      { ox:  3, oy: -4, npcOx: 1, npcOy: 4 },  // Oren NE
      { ox: -1, oy:  2, npcOx: 1, npcOy: -2 }, // Lila S (faces north toward fountain)
    ];

    cabins.forEach((c, i) => {
      const bx = vx + c.ox;
      const by = vy + c.oy;
      for (let dy = 0; dy < 4; dy++) {
        for (let dx = 0; dx < 4; dx++) {
          const tx = bx + dx, ty = by + dy;
          const onBorder = dx === 0 || dx === 3 || dy === 0 || dy === 3;
          if (onBorder) tm.set(tx, ty, T.WOOD_WALL);
          else tm.set(tx, ty, T.WOOD_FLOOR);
        }
      }
      // Doorway in the front (south) wall
      tm.set(bx + 1, by + 3, T.WOOD_FLOOR);
      tm.set(bx + 2, by + 3, T.WOOD_FLOOR);
      // Place the NPC just south of their door
      const def = GREENHAVEN_NPCS[i];
      const nx = (bx + c.npcOx + 0.5) * TILE_SIZE;
      const ny = (by + c.npcOy + 0.5) * TILE_SIZE;
      const npc = new Npc(nx, ny, def);
      this.npcs.push(npc);
      this.entities.push(npc);
    });

    // A campfire in the village square as a "fountain" / rest point
    tm.set(vx, vy, T.CAMPFIRE);

    // Decorative flower borders along the path
    tm.set(spawnTx + 4, spawnTy - 1, T.FLOWER);
    tm.set(spawnTx + 6, spawnTy + 2, T.FLOWER);
    tm.set(spawnTx + 9, spawnTy - 1, T.FLOWER);
  }

  get tilemap() { return this.gen.map; }

  biomeAt(px, py) {
    const tx = Math.floor(px / TILE_SIZE);
    const ty = Math.floor(py / TILE_SIZE);
    const t = this.tilemap.get(tx, ty);
    return biomeOf(t);
  }

  biomeLabel() {
    const k = this.biomeAt(this.game.player.x, this.game.player.y);
    return BIOMES[k]?.name ?? '';
  }

  spawnProjectile(x, y, dir, kind, owner) {
    const v = dirVector(dir);
    const sp = kind === 'arrow' ? 320 : 200;
    this.projectiles.push(new Projectile(x, y, v.x * sp, v.y * sp, kind, owner));
  }

  spawnHitPuff(x, y, color = '#fff') {
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 80,
        vy: (Math.random() - 0.5) * 80,
        life: 0.4, maxLife: 0.4, size: 3, color
      });
    }
  }

  spawnEnemyForBiome(biomeKey, x, y) {
    if (biomeKey === 'forest') this.entities.push(new Slime(x, y));
    else if (biomeKey === 'swamp') this.entities.push(new BogWraith(x, y));
    else if (biomeKey === 'tundra') this.entities.push(new IceSkeleton(x, y));
    else if (biomeKey === 'volcano') this.entities.push(new FireImp(x, y));
  }

  // Check whether to spawn the Spirit of the Grove mini-boss
  trySpawnSpirit() {
    if (this.game.flags.groveDefeated) return;
    if (this.groveSpiritSpawned) return;
    const g = this.gen.grove;
    const dx = this.game.player.x - g.x;
    const dy = this.game.player.y - g.y;
    if (dx*dx + dy*dy < 200*200) {
      const spirit = new SpiritOfGrove(g.x, g.y);
      this.entities.push(spirit);
      this.groveSpiritSpawned = true;
      this.spirit = spirit;
      this.showMessage('The grove hums. A Spirit appears.', 3);
    }
  }

  trySpawn(dt) {
    this.spawnT -= dt;
    if (this.spawnT > 0) return;
    this.spawnT = 1.5 + Math.random();
    if (this.entities.length >= ENEMY_CAP) return;

    // Spawn off-screen but within ~12 tiles of player
    const p = this.game.player;
    for (let attempt = 0; attempt < 6; attempt++) {
      const a = Math.random() * Math.PI * 2;
      const r = 200 + Math.random() * 220;
      const sx = p.x + Math.cos(a) * r;
      const sy = p.y + Math.sin(a) * r;
      const tx = Math.floor(sx / TILE_SIZE);
      const ty = Math.floor(sy / TILE_SIZE);
      if (!this.tilemap.inBounds(tx, ty)) continue;
      const tile = this.tilemap.get(tx, ty);
      if (!prop(tile).walk) continue;
      const biomeKey = biomeOf(tile);
      this.spawnEnemyForBiome(biomeKey, sx, sy);
      return;
    }
  }

  // Soulslike respawn flow.
  // 1. Drop a death cache (consumables) at the death position if there was one already, clear the OLD cache first.
  // 2. Place a DEATH_CACHE tile at death position (overworld only — dungeon/boss have their own).
  // 3. Teleport player to last campfire (or world spawn), restore HP/hunger/stamina.
  respawnAfterDeath() {
    const player = this.game.player;
    // Save the death spot
    const deathX = Math.floor(player.x / TILE_SIZE);
    const deathY = Math.floor(player.y / TILE_SIZE);

    // Clear any previous cache (only one outstanding at a time)
    const prev = this.game.flags.deathCache;
    if (prev && this.tilemap.get(prev.tx, prev.ty) === T.DEATH_CACHE) {
      this.tilemap.set(prev.tx, prev.ty, T.GRASS);
    }

    const items = extractDeathCache(this.game.inventory);
    if (items) {
      // Find nearest walkable tile to drop the cache (death spot might be on lava etc.)
      let dx = deathX, dy = deathY;
      if (!prop(this.tilemap.get(dx, dy)).walk || this.tilemap.get(dx, dy) === T.DEATH_CACHE) {
        // search a small ring
        outer: for (let r = 1; r < 6; r++) {
          for (let yy = -r; yy <= r; yy++) {
            for (let xx = -r; xx <= r; xx++) {
              const tx = deathX + xx, ty = deathY + yy;
              if (!this.tilemap.inBounds(tx, ty)) continue;
              const t = this.tilemap.get(tx, ty);
              if (prop(t).walk && t !== T.DEATH_CACHE && t !== T.STAIRS_DOWN) {
                dx = tx; dy = ty; break outer;
              }
            }
          }
        }
      }
      this.tilemap.set(dx, dy, T.DEATH_CACHE);
      this.game.flags.deathCache = { tx: dx, ty: dy, items };
    }

    // Respawn at last campfire (or world spawn if none yet set)
    const cf = this.game.flags.lastCampfire;
    const sp = cf || this.gen.spawn;
    player.dead = false;
    player.deathT = 0;
    player.hp = player.maxHp;
    player.hunger = player.maxHunger;
    player.stamina = player.maxStamina;
    player.invulnT = 1.0;  // brief safety on respawn
    player.setPos(sp.x, sp.y);
    this.game.camera.x = sp.x - this.game.camera.viewW/2;
    this.game.camera.y = sp.y - this.game.camera.viewH/2;
    this.game.save();
    const where = cf ? 'last campfire' : 'spawn';
    if (items) this.showMessage(`You died. Your stash awaits where you fell. Respawned at ${where}.`, 4);
    else       this.showMessage(`You died. Respawned at ${where}.`, 3);
  }

  pickUpLoreBook() {
    // Find the first unread book in BOOK_ORDER and show it in the dialog box.
    const inv = this.game.inventory;
    const id = BOOK_ORDER.find(b => !inv.has(b));
    if (!id) {
      this.showMessage("You've already read this one.", 1.5);
      return;
    }
    inv.add(id, 1);
    const book = LORE_BOOKS[id];
    this.game.dialog.show(book.title, book.body, { flash: 'Lore added to your library.' });
  }

  pickUpDeathCache() {
    const cache = this.game.flags.deathCache?.items;
    if (!cache) return;
    redeemDeathCache(this.game.inventory, cache);
    delete this.game.flags.deathCache;
    this.game.save();
    const summary = Object.entries(cache).map(([id, n]) => `${id} x${n}`).join(', ');
    this.showMessage(`Recovered your stash: ${summary}`, 4);
  }

  pickUpPowerOrb() {
    // Default: grant Dash. Could be data-driven if we ever place multiple orbs.
    if (!this.game.player.powers.dash) {
      this.game.player.powers.dash = true;
      this.game.inventory.add('power_dash', 1);
      this.game.dialog.show('Spirit Dash', [
        'A rush of wind fills your lungs.',
        'You feel light enough to outrun the moon.',
        'You learned SPIRIT DASH. Press SHIFT to dash in your facing direction (costs 25 stamina).',
      ]);
    }
  }

  handleDrops(killed) {
    for (const e of killed) {
      if (Math.random() < e.lootChance && e.dropTable.length > 0) {
        const id = e.dropTable[Math.floor(Math.random() * e.dropTable.length)];
        this.game.inventory.add(id, 1);
        this.spawnHitPuff(e.x, e.y, '#ffd700');
      }
      this.spawnHitPuff(e.x, e.y, '#888');
      // XP grant: scales with enemy max HP (roughly difficulty)
      const xp = (e.xpReward ?? e.maxHp * 8);
      const r = this.game.player.gainXp(xp, this.game.hud);
      if (r.leveledUp > 0) {
        Haptics.level();
        this.showMessage(`LEVEL UP! Now level ${this.game.player.stats.level} — ${this.game.player.stats.unspent} stat points to spend`, 3);
      }
    }
  }

  handleSwordHarvest() {
    const sw = this.game.player.swordHitbox();
    if (!sw) return;
    // For each tile covered by the swing, if attackable, harvest it.
    const x0 = Math.floor(sw.x / TILE_SIZE);
    const y0 = Math.floor(sw.y / TILE_SIZE);
    const x1 = Math.floor((sw.x + sw.w - 1) / TILE_SIZE);
    const y1 = Math.floor((sw.y + sw.h - 1) / TILE_SIZE);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const tile = this.tilemap.get(tx, ty);
        const pp = prop(tile);
        // Ores: require a pickaxe of the right tier or better
        if (pp.mine) {
          const hasStonePick = this.game.inventory.has('pickaxe_stone') || this.game.inventory.has('pickaxe_iron');
          const hasIronPick = this.game.inventory.has('pickaxe_iron');
          if (pp.mine === 'stone' && !hasStonePick) {
            this.showMessage('You need at least a Stone Pickaxe to mine this.', 1.5);
            continue;
          }
          if (pp.mine === 'iron' && !hasIronPick) {
            this.showMessage('You need an Iron Pickaxe to mine this.', 1.5);
            continue;
          }
          const base = BIOMES[biomeOf(tile)]?.base ?? T.STONE_FLOOR;
          this.tilemap.set(tx, ty, base);
          this.game.inventory.add(pp.drops, 1);
          this.spawnHitPuff(tx * TILE_SIZE + TILE_SIZE/2, ty * TILE_SIZE + TILE_SIZE/2, '#ffd066');
          continue;
        }
        if (!pp.attack) continue;
        // Replace with biome's walkable base
        const base = BIOMES[biomeOf(tile)]?.base ?? T.GRASS;
        this.tilemap.set(tx, ty, base);
        this.game.inventory.add(pp.drops, 1);
        this.spawnHitPuff(tx * TILE_SIZE + TILE_SIZE/2, ty * TILE_SIZE + TILE_SIZE/2, '#c8a060');
      }
    }
  }

  handleDebugKeys() {
    const input = this.game.input;
    // NOTE: these intentionally do NOT require Debug.enabled (F1) — they each show their
    // own one-shot toast so the player gets feedback even with the overlay hidden.
    if (input.wasPressed('tp1')) {
      const w = this.gen.waypoints.forest;
      this.game.player.setPos(w.x, w.y);
      this.showMessage('[DEBUG] Teleport → Greenwood', 1.2);
    } else if (input.wasPressed('tp2')) {
      const w = this.gen.waypoints.swamp;
      this.game.player.setPos(w.x, w.y);
      this.showMessage('[DEBUG] Teleport → Mistmarsh', 1.2);
    } else if (input.wasPressed('tp3')) {
      const w = this.gen.waypoints.tundra;
      this.game.player.setPos(w.x, w.y);
      this.showMessage('[DEBUG] Teleport → Frozen Reach', 1.2);
    } else if (input.wasPressed('tp4')) {
      const w = this.gen.waypoints.volcano;
      this.game.player.setPos(w.x, w.y);
      this.showMessage('[DEBUG] Teleport → Ashen Wastes', 1.2);
    }
    if (input.wasPressed('boss')) {
      this.game.changeScene('boss');
    }
    if (input.wasPressed('heal')) {
      this.game.player.hp = this.game.player.maxHp;
      this.game.player.hunger = this.game.player.maxHunger;
      this.game.player.stamina = this.game.player.maxStamina;
      Debug.push('healed');
      this.showMessage('[DEBUG] Fully healed', 1.2);
    }
    if (input.wasPressed('mats')) {
      this.game.inventory.add('wood', 20);
      this.game.inventory.add('stone', 20);
      this.game.inventory.add('berry', 10);
      this.game.inventory.add('arrow', 20);
      Debug.push('mats granted');
      this.showMessage('[DEBUG] +20 wood, +20 stone, +10 berry, +20 arrow', 1.5);
    }
  }

  update(dt) {
    const input = this.game.input;
    const player = this.game.player;
    this.updateBase(dt);
    this.handleDebugKeys();

    // Death — soulslike: drop a cache, respawn at last campfire
    if (player.dead) {
      if (player.deathT > 1.2) {
        this.respawnAfterDeath();
      }
      player.update(dt, { input, tilemap: this.tilemap, inventory: this.game.inventory, scene: this });
      return;
    }

    // Update player
    const ctx = { input, tilemap: this.tilemap, inventory: this.game.inventory, scene: this, player };
    player.update(dt, ctx);

    // Interact
    if (input.wasPressed('action')) {
      // Check NPCs first — talk if facing one within range
      const talkR = 36;
      let talkedTo = null;
      for (const npc of this.npcs) {
        const dx = npc.x - player.x;
        const dy = npc.y - player.y;
        if (dx*dx + dy*dy < talkR*talkR) { talkedTo = npc; break; }
      }
      if (talkedTo) {
        const flash = talkedTo.def.onTalk?.(this.game);
        this.game.dialog.show(talkedTo.def.name, talkedTo.def.dialog, { flash });
        return;
      }

      const r = tryInteract(this.tilemap, player, this.game.inventory);
      if (r?.action === 'rest') {
        player.hp = player.maxHp;
        player.hunger = player.maxHunger;
        player.stamina = player.maxStamina;
        // Mark this as the respawn point
        this.game.flags.lastCampfire = { x: (r.tx + 0.5) * TILE_SIZE, y: (r.ty + 0.5) * TILE_SIZE };
        this.game.save();
        this.showMessage('Rested. HP/hunger/stamina restored — respawn point set here.', 3);
      } else if (r?.action === 'locked') {
        this.showMessage('Locked. You need a key.');
      }
      // Step into stairs after interact intentionally not handled — see auto-portal below.
    }

    // Sword harvesting (chopping trees/rocks)
    this.handleSwordHarvest();

    // Auto-portal: stepping on stairs-down enters dungeon
    {
      const tx = Math.floor(player.x / TILE_SIZE);
      const ty = Math.floor(player.y / TILE_SIZE);
      const t = this.tilemap.get(tx, ty);
      if (t === T.STAIRS_DOWN) {
        this.game.changeScene('dungeon');
        return;
      }
      // Walk-over pickups: lore books, power orbs
      if (t === T.LORE_BOOK) {
        this.tilemap.set(tx, ty, T.GRASS);
        this.pickUpLoreBook();
      }
      if (t === T.POWER_ORB) {
        this.tilemap.set(tx, ty, T.GRASS);
        this.pickUpPowerOrb();
      }
      if (t === T.DEATH_CACHE) {
        this.tilemap.set(tx, ty, T.GRASS);
        this.pickUpDeathCache();
      }
    }

    // Enemies + mini-boss check
    this.trySpawnSpirit();
    this.trySpawn(dt);
    for (const e of this.entities) e.update(dt, ctx);

    // Projectiles
    for (const p of this.projectiles) p.update(dt, ctx);

    // Particles
    for (const p of this.particles) {
      p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
      if (p.life <= 0) p.dead = true;
    }

    // Combat: player sword vs enemies
    const sw = player.swordHitbox();
    if (sw) {
      const killedHits = applySwordHits(sw, player, this.entities, this.game.inventory);
      if (killedHits.length > 0) Haptics.hit();
      const killed = killedHits.filter(e => e.dead);
      if (killed.length > 0) this.handleDrops(killed);
      for (const e of killedHits) this.spawnHitPuff(e.x, e.y, '#fff');

      // Special: Spirit of the Grove drops a POWER_ORB tile on death
      for (const e of killed) {
        if (e instanceof SpiritOfGrove) {
          const tx = Math.floor(e.x / TILE_SIZE);
          const ty = Math.floor(e.y / TILE_SIZE);
          this.tilemap.set(tx, ty, T.POWER_ORB);
          this.game.flags.groveDefeated = true;
          this.game.camera.shake(0.5, 6);
          this.showMessage('The Spirit fades. An orb remains.', 3);
        }
      }
    }
    // Enemy contact damage
    applyEnemyTouch(player, this.entities);

    // Survival
    const biomeKey = this.biomeAt(player.x, player.y);
    tickSurvival(dt, player, this.game.inventory, biomeKey);

    // Fog reveal
    const ptx = Math.floor(player.x / TILE_SIZE);
    const pty = Math.floor(player.y / TILE_SIZE);
    this.tilemap.discover(ptx, pty, 8);

    // Camera follow
    this.game.camera.follow(player, dt);
  }

  draw(ctx) {
    const cam = this.game.camera;
    // Tint the canvas with biome ambient
    const biomeKey = this.biomeAt(this.game.player.x, this.game.player.y);
    const ambient = BIOMES[biomeKey]?.ambient ?? '#000';
    ctx.fillStyle = ambient;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    this.tilemap.draw(ctx, cam, { fog: true });

    const off = cam.offset();
    // Entities (back-to-front by y)
    const drawList = [...this.entities, this.game.player];
    drawList.sort((a, b) => a.y - b.y);
    for (const e of drawList) e.draw(ctx, off);

    for (const p of this.projectiles) p.draw(ctx, off);

    // Particles
    for (const part of this.particles) {
      ctx.globalAlpha = Math.max(0, part.life / part.maxLife);
      ctx.fillStyle = part.color;
      ctx.fillRect(part.x - off.x - part.size/2, part.y - off.y - part.size/2, part.size, part.size);
      ctx.globalAlpha = 1;
    }

    // Interact hint above whatever interactable the player is facing
    const hint = facingInteractable(this.tilemap, this.game.player);
    if (hint) drawInteractHint(ctx, hint, off);

    // Volcano heat overlay if no cloak
    if (biomeKey === 'volcano' && !this.game.inventory.has('heat_cloak')) {
      ctx.fillStyle = `rgba(255, 80, 0, ${0.10 + Math.sin(Date.now()/200)*0.05})`;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    this.drawMessage(ctx);
  }
}
