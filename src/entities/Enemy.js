// Base enemy with wander + chase AI. Subclasses tweak stats + draw.

import { Entity } from './Entity.js';
import { Debug } from '../core/Debug.js';

export class Enemy extends Entity {
  constructor(x, y, w = 18, h = 18) {
    super(x, y, w, h);
    this.maxHp = 2;
    this.hp = 2;
    this.touchDmg = 1;
    this.speed = 50;
    this.aggroR = 160;
    this.deAggroR = 260;
    this.aggro = false;
    this.wanderT = 0;
    this.wanderDir = { x: 0, y: 0 };
    this.t = 0;
    this.dropTable = ['wood']; // override per type
    this.lootChance = 0.5;
  }

  think(dt, player) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (!this.aggro && dist < this.aggroR) this.aggro = true;
    if (this.aggro && dist > this.deAggroR) this.aggro = false;

    if (this.aggro) {
      const m = dist || 1;
      this.vx = (dx / m) * this.speed;
      this.vy = (dy / m) * this.speed;
      this.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
    } else {
      this.wanderT -= dt;
      if (this.wanderT <= 0) {
        this.wanderT = 1 + Math.random() * 2;
        if (Math.random() < 0.4) {
          this.wanderDir = { x: 0, y: 0 };
        } else {
          const a = Math.random() * Math.PI * 2;
          this.wanderDir = { x: Math.cos(a), y: Math.sin(a) };
        }
      }
      this.vx = this.wanderDir.x * this.speed * 0.45;
      this.vy = this.wanderDir.y * this.speed * 0.45;
    }
  }

  update(dt, ctx) {
    this.updateTimers(dt);
    this.t += dt;
    if (this.dead) return;
    this.think(dt, ctx.player);
    this.moveAndCollide(dt, ctx.tilemap);
  }

  draw(_ctx, _off) { /* override */ }

  drawDebug(ctx, off) {
    if (!Debug.enabled) return;
    const hb = this.hitbox();
    ctx.strokeStyle = '#f00'; ctx.lineWidth = 1;
    ctx.strokeRect(hb.x - off.x, hb.y - off.y, hb.w, hb.h);
    ctx.fillStyle = '#f00'; ctx.font = '10px monospace';
    ctx.fillText(`${this.hp}/${this.maxHp}`, hb.x - off.x, hb.y - off.y - 2);
  }

  drawHpBar(ctx, off) {
    if (this.hp >= this.maxHp || this.dead) return;
    const sx = this.x - off.x - 10;
    const sy = this.y - off.y - this.h/2 - 8;
    ctx.fillStyle = '#000'; ctx.fillRect(sx - 1, sy - 1, 22, 4);
    ctx.fillStyle = '#f00'; ctx.fillRect(sx, sy, 20, 2);
    ctx.fillStyle = '#0f0'; ctx.fillRect(sx, sy, 20 * (this.hp / this.maxHp), 2);
  }
}
