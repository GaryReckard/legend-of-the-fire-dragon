// Boss arena: a fixed-size volcanic room. Walls of stone, lava trim, dragon overhead.

import { Scene } from '../core/Scene.js';
import { TileMap } from '../world/TileMap.js';
import { T, TILE_SIZE } from '../world/tiles.js';
import { FireDragon, BOSS_ARENA } from '../entities/FireDragon.js';
import { Projectile, dirVector } from '../entities/Projectile.js';
import { applySwordHits } from '../mechanics/Combat.js';
import { extractDeathCache } from '../mechanics/Death.js';
import { rectsOverlap } from '../entities/Entity.js';
import { Debug } from '../core/Debug.js';

const ARENA_W_TILES = 25;
const ARENA_H_TILES = 19;

function buildArena() {
  const map = new TileMap(ARENA_W_TILES, ARENA_H_TILES, T.ASH);
  // outer wall ring
  for (let x = 0; x < ARENA_W_TILES; x++) {
    map.set(x, 0, T.VOLCANIC_ROCK);
    map.set(x, ARENA_H_TILES - 1, T.VOLCANIC_ROCK);
  }
  for (let y = 0; y < ARENA_H_TILES; y++) {
    map.set(0, y, T.VOLCANIC_ROCK);
    map.set(ARENA_W_TILES - 1, y, T.VOLCANIC_ROCK);
  }
  // inner stone floor
  for (let y = 2; y < ARENA_H_TILES - 2; y++) {
    for (let x = 2; x < ARENA_W_TILES - 2; x++) {
      map.set(x, y, T.STONE_FLOOR);
    }
  }
  // Lava ring just inside the wall
  for (let x = 1; x < ARENA_W_TILES - 1; x++) {
    map.set(x, 1, T.LAVA);
    map.set(x, ARENA_H_TILES - 2, T.LAVA);
  }
  for (let y = 1; y < ARENA_H_TILES - 1; y++) {
    map.set(1, y, T.LAVA);
    map.set(ARENA_W_TILES - 2, y, T.LAVA);
  }
  return map;
}

export class BossScene extends Scene {
  constructor(game) {
    super(game);
    this.map = null;
    this.dragon = null;
    this.fireZones = [];
  }

  enter() {
    this.map = buildArena();
    this.game.state = 'playing';
    this.game.player.setPos(ARENA_W_TILES * TILE_SIZE / 2, (ARENA_H_TILES - 4) * TILE_SIZE);
    this.entities = [];
    this.projectiles = [];
    this.particles = [];
    this.fireZones = [];
    this.dragon = new FireDragon(ARENA_W_TILES * TILE_SIZE / 2, 110);
    this.entities.push(this.dragon);
    this.game.camera.setWorld(this.map.pixelW(), this.map.pixelH());
    this.showMessage('THE FIRE DRAGON. Strike its head when it descends.', 4);
    this.victoryT = 0;
    this.bossDefeated = false;
  }

  get tilemap() { return this.map; }
  biomeAt() { return 'volcano'; }
  biomeLabel() { return 'Caldera of the Fire Dragon'; }

  spawnProjectile(x, y, dir, kind, owner) {
    const v = dirVector(dir);
    const sp = kind === 'arrow' ? 340 : 200;
    this.projectiles.push(new Projectile(x, y, v.x * sp, v.y * sp, kind, owner));
  }

  spawnHitPuff(x, y, color = '#fff') {
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random()-0.5) * 120,
        vy: (Math.random()-0.5) * 120,
        life: 0.5, maxLife: 0.5, size: 4, color
      });
    }
  }

  cameraShake(t, a) { this.game.camera.shake(t, a); }

  update(dt) {
    const player = this.game.player;
    const input = this.game.input;
    this.updateBase(dt);

    if (input.wasPressed('heal')) {
      player.hp = player.maxHp; player.hunger = player.maxHunger; player.stamina = player.maxStamina;
      this.showMessage('[DEBUG] Fully healed', 1.2);
    }
    if (input.wasPressed('mats')) {
      this.dragon.mode = 'expose';
      this.dragon.damage(99, 0, 0, 0);
      this.showMessage('[DEBUG] Dragon insta-kill', 1.2);
    }

    if (this.bossDefeated) {
      this.victoryT += dt;
      // Let particles play, then go to win
      player.update(dt, { input, tilemap: this.map, inventory: this.game.inventory, scene: this });
      for (const p of this.particles) {
        p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
        if (p.life <= 0) p.dead = true;
      }
      if (this.victoryT > 3.2) this.game.changeScene('win');
      return;
    }

    if (player.dead) {
      if (player.deathT > 1.2) {
        // Bossfight death: same handling as dungeon — drop consumables, respawn at last campfire.
        extractDeathCache(this.game.inventory);
        this.game.changeScene('overworld', { respawned: true });
      }
      player.update(dt, { input, tilemap: this.map, inventory: this.game.inventory, scene: this });
      return;
    }

    const ctx = { input, tilemap: this.map, inventory: this.game.inventory, scene: this, player };
    player.update(dt, ctx);

    if (input.wasPressed('action')) {
      // No interactables in boss room.
    }

    // Update dragon + entities
    for (const e of this.entities) e.update(dt, ctx);

    // Fire zones — damage player while active
    for (const fz of this.fireZones) {
      fz.life -= dt;
      const phb = player.hitbox();
      if (rectsOverlap(phb, fz) && !Debug.god) {
        if (player.invulnT <= 0) {
          player.damage(1, 0, 0.5, 180);
        }
      }
    }
    this.fireZones = this.fireZones.filter(z => z.life > 0);

    // Projectiles
    for (const p of this.projectiles) p.update(dt, ctx);
    // Particles
    for (const p of this.particles) {
      p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
      if (p.life <= 0) p.dead = true;
    }

    // Player attacks vs dragon — but only against weak point AND when exposed
    const sw = player.swordHitbox();
    if (sw && this.dragon && !this.dragon.dead) {
      if (this.dragon.mode === 'expose' && rectsOverlap(sw, this.dragon.weakPointHb())) {
        this.dragon.damage(1, -1, 0, 200);
        this.spawnHitPuff(this.dragon.x - 60, this.dragon.y - 10, '#fff066');
        this.cameraShake(0.15, 4);
      }
    }
    // Arrows vs dragon weak point
    for (const p of this.projectiles) {
      if (p.owner !== 'player' || p.dead) continue;
      if (this.dragon && !this.dragon.dead && this.dragon.mode === 'expose'
          && rectsOverlap(p.hitbox(), this.dragon.weakPointHb())) {
        this.dragon.damage(1, p.vx > 0 ? -1 : 1, 0, 180);
        this.spawnHitPuff(p.x, p.y, '#fff066');
        p.dead = true;
      }
    }

    if (this.dragon?.dead && !this.bossDefeated) {
      this.bossDefeated = true;
      this.cameraShake(0.8, 12);
      for (let i = 0; i < 60; i++) {
        this.particles.push({
          x: this.dragon.x + (Math.random()-0.5)*140,
          y: this.dragon.y + (Math.random()-0.5)*60,
          vx: (Math.random()-0.5)*200,
          vy: (Math.random()-0.5)*200,
          life: 1.5, maxLife: 1.5, size: 4,
          color: ['#ffaa33','#ff5522','#fff066','#fff'][Math.floor(Math.random()*4)],
        });
      }
      this.showMessage('THE DRAGON FALLS.', 4);
    }

    this.game.camera.follow(player, dt);
  }

  draw(ctx) {
    ctx.fillStyle = '#1a0606';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    this.map.draw(ctx, this.game.camera, { fog: false });
    const off = this.game.camera.offset();

    // Fire zones (drawn on the ground)
    for (const fz of this.fireZones) {
      const a = Math.min(1, fz.life);
      ctx.save();
      ctx.fillStyle = `rgba(255,80,0,${0.4 + Math.sin(Date.now()/80)*0.2})`;
      ctx.fillRect(fz.x - off.x, fz.y - off.y, fz.w, fz.h);
      ctx.fillStyle = `rgba(255,200,80,0.5)`;
      ctx.fillRect(fz.x - off.x, fz.y - off.y + 4, fz.w, fz.h - 8);
      ctx.restore();
    }

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

    // Boss HP bar at top
    if (this.dragon && !this.dragon.dead) {
      const bw = 400, bh = 12;
      const bx = (ctx.canvas.width - bw) / 2, by = 18;
      ctx.fillStyle = '#000'; ctx.fillRect(bx - 2, by - 2, bw + 4, bh + 4);
      ctx.fillStyle = '#5b0e0e'; ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = '#ff3322'; ctx.fillRect(bx, by, bw * (this.dragon.hp / this.dragon.maxHp), bh);
      ctx.fillStyle = '#fff'; ctx.font = '12px "Courier New", monospace'; ctx.textAlign = 'center';
      ctx.fillText(`FIRE DRAGON — Phase ${this.dragon.phase}${this.dragon.mode === 'expose' ? ' — VULNERABLE' : ''}`, ctx.canvas.width / 2, by + bh + 14);
    }

    this.drawMessage(ctx);
  }
}
