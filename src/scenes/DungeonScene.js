// Dungeon: a separate tilemap with hand-authored rooms, puzzles, and locked door to boss.

import { Scene } from '../core/Scene.js';
import { buildDungeon } from '../world/Dungeon.js';
import { TILE_SIZE, T, prop } from '../world/tiles.js';
import { Slime } from '../entities/Slime.js';
import { IceSkeleton } from '../entities/IceSkeleton.js';
import { FireImp } from '../entities/FireImp.js';
import { Projectile, dirVector } from '../entities/Projectile.js';
import { applySwordHits, applyEnemyTouch } from '../mechanics/Combat.js';
import { tryInteract, evaluateSwitches, setGates, facingInteractable, drawInteractHint } from '../mechanics/Puzzle.js';
import { Debug } from '../core/Debug.js';

export class DungeonScene extends Scene {
  constructor(game) {
    super(game);
    this.layout = null;
  }

  enter() {
    this.layout = buildDungeon();
    this.game.state = 'playing';
    this.game.player.setPos(this.layout.spawn.x, this.layout.spawn.y);
    this.entities = [];
    this.projectiles = [];
    this.particles = [];
    for (const s of this.layout.enemySpawns) {
      const wx = (s.x + 0.5) * TILE_SIZE;
      const wy = (s.y + 0.5) * TILE_SIZE;
      if (s.type === 'slime') this.entities.push(new Slime(wx, wy));
      else if (s.type === 'iceskeleton') this.entities.push(new IceSkeleton(wx, wy));
      else if (s.type === 'fireimp') this.entities.push(new FireImp(wx, wy));
    }
    this.game.camera.setWorld(this.layout.map.pixelW(), this.layout.map.pixelH());
    this.showMessage('Ancient ruins. Push, switch, and burn your way through.', 3.5);
    this.bothTorchesLit = false;
    this.chestOpened = false;
  }

  get tilemap() { return this.layout.map; }
  biomeAt() { return 'dungeon'; }
  biomeLabel() { return 'Ancient Ruins'; }

  spawnProjectile(x, y, dir, kind, owner) {
    const v = dirVector(dir);
    const sp = kind === 'arrow' ? 320 : 200;
    this.projectiles.push(new Projectile(x, y, v.x * sp, v.y * sp, kind, owner));
  }

  spawnHitPuff(x, y, color = '#fff') {
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random()-0.5) * 80,
        vy: (Math.random()-0.5) * 80,
        life: 0.4, maxLife: 0.4, size: 3, color
      });
    }
  }

  update(dt) {
    const input = this.game.input;
    const player = this.game.player;
    this.updateBase(dt);

    if (input.wasPressed('boss')) {
      this.game.changeScene('boss');
      return;
    }
    if (input.wasPressed('heal')) {
      player.hp = player.maxHp; player.hunger = player.maxHunger; player.stamina = player.maxStamina;
      this.showMessage('[DEBUG] Fully healed', 1.2);
    }
    if (input.wasPressed('mats')) {
      this.game.inventory.add('wood', 20);
      this.game.inventory.add('stone', 20);
      this.game.inventory.add('berry', 10);
      this.game.inventory.add('arrow', 20);
      this.showMessage('[DEBUG] +20 wood, +20 stone, +10 berry, +20 arrow', 1.5);
    }

    if (player.dead) {
      if (player.deathT > 1.2) this.game.changeScene('gameover');
      player.update(dt, { input, tilemap: this.tilemap, inventory: this.game.inventory, scene: this });
      return;
    }

    const ctx = { input, tilemap: this.tilemap, inventory: this.game.inventory, scene: this, player };
    player.update(dt, ctx);

    // Interact
    if (input.wasPressed('action')) {
      const r = tryInteract(this.tilemap, player, this.game.inventory);
      if (r?.action === 'torch') this.spawnHitPuff(r.tx * TILE_SIZE + 16, r.ty * TILE_SIZE + 16, '#ffaa33');
      if (r?.action === 'unlock') this.showMessage('The door swings open with a heavy clang.', 2);
      if (r?.action === 'locked') this.showMessage('Locked. You need a key.');
      if (r?.action === 'cant_push') this.showMessage("It won't budge that way.");
      if (r?.action === 'chest' && !this.chestOpened) {
        this.chestOpened = true;
        this.game.inventory.add('boss_key', 1);
        this.showMessage('A skull-marked key. The Boss Door awaits.', 3);
      }
    }

    // Stairs up returns to overworld
    {
      const tx = Math.floor(player.x / TILE_SIZE);
      const ty = Math.floor(player.y / TILE_SIZE);
      const t = this.tilemap.get(tx, ty);
      if (t === T.STAIRS_UP) {
        this.game.changeScene('overworld');
        return;
      }
      // Stepping through the boss door triggers boss
      if (t === T.DOOR_OPEN && ty === this.layout.bossDoor.y) {
        this.game.changeScene('boss');
        return;
      }
    }

    // Switch evaluation (room 1)
    const allSw = evaluateSwitches(this.tilemap, this.layout.switches);
    setGates(this.tilemap, this.layout.rooms.r1.gate, allSw);

    // Torches evaluation (room 2): both lit opens gate
    const t1 = this.tilemap.get(this.layout.torches[0].x, this.layout.torches[0].y);
    const t2 = this.tilemap.get(this.layout.torches[1].x, this.layout.torches[1].y);
    const bothLit = t1 === T.TORCH_ON && t2 === T.TORCH_ON;
    if (bothLit && !this.bothTorchesLit) {
      this.bothTorchesLit = true;
      this.showMessage('The braziers blaze — the gate ahead opens.', 2.5);
    }
    setGates(this.tilemap, this.layout.rooms.r2.gate, bothLit);

    // Enemies
    for (const e of this.entities) e.update(dt, ctx);
    for (const p of this.projectiles) p.update(dt, ctx);
    for (const p of this.particles) {
      p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
      if (p.life <= 0) p.dead = true;
    }

    // Combat
    const sw = player.swordHitbox();
    if (sw) {
      const hits = applySwordHits(sw, player, this.entities);
      for (const e of hits) this.spawnHitPuff(e.x, e.y, '#fff');
      const killed = hits.filter(e => e.dead);
      for (const e of killed) {
        if (Math.random() < e.lootChance && e.dropTable.length) {
          const id = e.dropTable[Math.floor(Math.random() * e.dropTable.length)];
          this.game.inventory.add(id, 1);
          this.spawnHitPuff(e.x, e.y, '#ffd700');
        }
      }
    }
    applyEnemyTouch(player, this.entities);

    this.game.camera.follow(player, dt);
  }

  draw(ctx) {
    ctx.fillStyle = '#0a0810';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    this.tilemap.draw(ctx, this.game.camera, { fog: false });
    const off = this.game.camera.offset();
    const drawList = [...this.entities, this.game.player];
    drawList.sort((a, b) => a.y - b.y);
    for (const e of drawList) e.draw(ctx, off);
    for (const p of this.projectiles) p.draw(ctx, off);
    for (const part of this.particles) {
      ctx.globalAlpha = Math.max(0, part.life / part.maxLife);
      ctx.fillStyle = part.color;
      ctx.fillRect(part.x - off.x - part.size/2, part.y - off.y - part.size/2, part.size, part.size);
      ctx.globalAlpha = 1;
    }
    const hint = facingInteractable(this.tilemap, this.game.player);
    if (hint) drawInteractHint(ctx, hint, off);

    this.drawMessage(ctx);
  }
}
