import { Scene } from '../core/Scene.js';
import { generateOverworld, WORLD_DIMS } from '../world/WorldGen.js';
import { TILE_SIZE, T, prop } from '../world/tiles.js';
import { BIOMES, biomeOf } from '../world/Biome.js';
import { Slime } from '../entities/Slime.js';
import { IceSkeleton } from '../entities/IceSkeleton.js';
import { FireImp } from '../entities/FireImp.js';
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

  enter() {
    if (!this.gen) {
      this.gen = generateOverworld();
    }
    this.game.state = 'playing';
    this.game.player.setPos(this.gen.spawn.x, this.gen.spawn.y);
    this.game.player.hp = this.game.player.maxHp;
    this.game.player.hunger = this.game.player.maxHunger;
    this.game.player.stamina = this.game.player.maxStamina;
    this.entities = [];
    this.projectiles = [];
    this.particles = [];
    this.game.camera.setWorld(this.gen.map.pixelW(), this.gen.map.pixelH());
    this.showMessage('Greenwood. Survive. Reach the Ashen Wastes to the south.', 4);
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
    else if (biomeKey === 'tundra') this.entities.push(new IceSkeleton(x, y));
    else if (biomeKey === 'volcano') this.entities.push(new FireImp(x, y));
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

  handleDrops(killed) {
    for (const e of killed) {
      if (Math.random() < e.lootChance && e.dropTable.length > 0) {
        const id = e.dropTable[Math.floor(Math.random() * e.dropTable.length)];
        this.game.inventory.add(id, 1);
        this.spawnHitPuff(e.x, e.y, '#ffd700');
      }
      this.spawnHitPuff(e.x, e.y, '#888');
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
      Debug.push('teleport: Greenwood');
      this.showMessage('[DEBUG] Teleport → Greenwood', 1.2);
    } else if (input.wasPressed('tp2')) {
      const w = this.gen.waypoints.tundra;
      this.game.player.setPos(w.x, w.y);
      Debug.push('teleport: Frozen Reach');
      this.showMessage('[DEBUG] Teleport → Frozen Reach', 1.2);
    } else if (input.wasPressed('tp3')) {
      const w = this.gen.waypoints.volcano;
      this.game.player.setPos(w.x, w.y);
      Debug.push('teleport: Ashen Wastes');
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

    // Death
    if (player.dead) {
      if (player.deathT > 1.2) this.game.changeScene('gameover');
      player.update(dt, { input, tilemap: this.tilemap, inventory: this.game.inventory, scene: this });
      return;
    }

    // Update player
    const ctx = { input, tilemap: this.tilemap, inventory: this.game.inventory, scene: this, player };
    player.update(dt, ctx);

    // Interact
    if (input.wasPressed('action')) {
      const r = tryInteract(this.tilemap, player, this.game.inventory);
      if (r?.action === 'rest') {
        player.hp = player.maxHp;
        player.hunger = player.maxHunger;
        player.stamina = player.maxStamina;
        this.showMessage('Rested by the campfire. HP, hunger, stamina restored.', 2.5);
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
    }

    // Enemies
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
      const killedHits = applySwordHits(sw, player, this.entities);
      const killed = killedHits.filter(e => e.dead);
      if (killed.length > 0) this.handleDrops(killed);
      for (const e of killedHits) this.spawnHitPuff(e.x, e.y, '#fff');
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
