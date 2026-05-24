import { drawProjectile } from '../assets/sprites.js';
import { rectsOverlap } from './Entity.js';

export class Projectile {
  constructor(x, y, vx, vy, kind, owner) {
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.kind = kind;        // 'arrow' | 'fireball'
    this.owner = owner;      // 'player' | 'enemy'
    this.w = 8; this.h = 8;
    this.life = 1.5;
    this.dead = false;
    this.dmg = kind === 'fireball' ? 1 : 1;
  }

  hitbox() { return { x: this.x - this.w/2, y: this.y - this.h/2, w: this.w, h: this.h }; }

  update(dt, ctx) {
    this.life -= dt;
    if (this.life <= 0) { this.dead = true; return; }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (ctx.tilemap.rectCollides(this.x - 2, this.y - 2, 4, 4)) {
      this.dead = true;
      ctx.scene.spawnHitPuff?.(this.x, this.y, '#ddd');
      return;
    }
    // Hit detection
    if (this.owner === 'player') {
      for (const e of ctx.scene.entities) {
        if (e.dead) continue;
        if (rectsOverlap(this.hitbox(), e.hitbox())) {
          const dx = this.vx, dy = this.vy, m = Math.hypot(dx, dy) || 1;
          e.damage(this.dmg, dx/m, dy/m, 240);
          this.dead = true;
          return;
        }
      }
    } else if (this.owner === 'enemy') {
      const p = ctx.player;
      if (!p.dead && rectsOverlap(this.hitbox(), p.hitbox())) {
        const dx = this.vx, dy = this.vy, m = Math.hypot(dx, dy) || 1;
        p.damage(this.dmg, dx/m, dy/m, 220);
        this.dead = true;
      }
    }
  }

  draw(ctx, off) {
    drawProjectile(ctx, this.x - off.x, this.y - off.y, this.kind);
  }
}

export function dirVector(dir) {
  let x = 0, y = 0;
  if (dir.includes('left')) x = -1;
  if (dir.includes('right')) x = 1;
  if (dir.includes('up')) y = -1;
  if (dir.includes('down')) y = 1;
  if (x !== 0 && y !== 0) { x *= Math.SQRT1_2; y *= Math.SQRT1_2; }
  if (x === 0 && y === 0) y = 1;
  return { x, y };
}
