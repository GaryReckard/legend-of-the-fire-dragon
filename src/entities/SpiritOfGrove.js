// Spirit of the Grove — first mini-boss. Lives in a clearing in the forest.
// Three phases (HP-gated): Sapling (slow chase), Bough (4 thorn projectiles in a fan),
// Heart (rapid 8-direction spiral).
//
// On defeat: drops a POWER_ORB tile at its position. Walking over it grants Dash.

import { Entity } from './Entity.js';
import { Projectile } from './Projectile.js';
import { Debug } from '../core/Debug.js';
import { T } from '../world/tiles.js';

const ARENA_R = 96; // arena radius around mid-clearing for visual lock

export class SpiritOfGrove extends Entity {
  constructor(x, y) {
    super(x, y, 32, 36);
    this.maxHp = 10;
    this.hp = 10;
    this.phase = 1;
    this.touchDmg = 1;
    this.xpReward = 80;
    this.dropTable = [];
    this.lootChance = 0;
    this.shootT = 0;
    this.t = 0;
    this.dead = false;
    this.deathT = 0;
    this.spawnX = x;
    this.spawnY = y;
  }

  damage(amount, kx, ky, force) {
    const r = super.damage(amount, kx, ky, force);
    if (this.hp <= this.maxHp * 0.33 && this.phase < 3) this.phase = 3;
    else if (this.hp <= this.maxHp * 0.66 && this.phase < 2) this.phase = 2;
    return r;
  }

  update(dt, ctx) {
    this.updateTimers(dt);
    this.t += dt;
    if (this.dead) { this.deathT += dt; return; }

    // Chase the player, but slowly and only within arena radius
    const dx = ctx.player.x - this.x;
    const dy = ctx.player.y - this.y;
    const m = Math.hypot(dx, dy) || 1;
    const sp = 30 + this.phase * 12;
    this.vx = (dx / m) * sp;
    this.vy = (dy / m) * sp;
    this.moveAndCollide(dt, ctx.tilemap);

    // Stay tethered to arena
    const tdx = this.spawnX - this.x;
    const tdy = this.spawnY - this.y;
    const td = Math.hypot(tdx, tdy);
    if (td > ARENA_R) {
      this.x += (tdx / td) * (td - ARENA_R);
      this.y += (tdy / td) * (td - ARENA_R);
    }

    // Projectiles
    this.shootT -= dt;
    const cd = this.phase === 3 ? 1.0 : (this.phase === 2 ? 1.6 : 2.2);
    if (this.shootT <= 0) {
      this.shootT = cd;
      this.shoot(ctx);
    }
  }

  shoot(ctx) {
    if (this.phase === 1) {
      // Single thorn at player
      const dx = ctx.player.x - this.x;
      const dy = ctx.player.y - this.y;
      const m = Math.hypot(dx, dy) || 1;
      const sp = 160;
      ctx.scene.projectiles.push(new Projectile(this.x, this.y, dx/m*sp, dy/m*sp, 'thorn', 'enemy'));
    } else if (this.phase === 2) {
      // Fan of 4 thorns
      const dx = ctx.player.x - this.x;
      const dy = ctx.player.y - this.y;
      const base = Math.atan2(dy, dx);
      for (let i = 0; i < 4; i++) {
        const a = base + (i - 1.5) * 0.25;
        const sp = 170;
        ctx.scene.projectiles.push(new Projectile(this.x, this.y, Math.cos(a)*sp, Math.sin(a)*sp, 'thorn', 'enemy'));
      }
    } else {
      // 8-direction spiral, rotates each cycle
      const off = (this.t * 1.8) % (Math.PI * 2);
      for (let i = 0; i < 8; i++) {
        const a = off + i * (Math.PI * 2 / 8);
        const sp = 160;
        ctx.scene.projectiles.push(new Projectile(this.x, this.y, Math.cos(a)*sp, Math.sin(a)*sp, 'thorn', 'enemy'));
      }
    }
  }

  draw(ctx, off) {
    const sx = this.x - off.x, sy = this.y - off.y;
    if (this.dead) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - this.deathT);
      ctx.fillStyle = '#fff066';
      const r = 20 + this.deathT * 40;
      ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI*2); ctx.fill();
      ctx.restore();
      return;
    }
    // Aura
    ctx.save();
    ctx.fillStyle = `rgba(120, 220, 130, ${0.25 + Math.sin(this.t*3)*0.10})`;
    ctx.beginPath(); ctx.arc(sx, sy, 26 + Math.sin(this.t*4)*3, 0, Math.PI*2); ctx.fill();
    ctx.restore();
    // Body — leafy spirit
    ctx.fillStyle = this.hurtT > 0 ? '#fff' : '#2a6f3a';
    ctx.beginPath();
    ctx.moveTo(sx - 14, sy + 14);
    ctx.lineTo(sx - 8, sy - 14);
    ctx.lineTo(sx + 8, sy - 14);
    ctx.lineTo(sx + 14, sy + 14);
    ctx.closePath();
    ctx.fill();
    // Face — two glowing eyes
    ctx.fillStyle = '#fff066';
    ctx.fillRect(sx - 6, sy - 4, 3, 3);
    ctx.fillRect(sx + 3, sy - 4, 3, 3);
    // Leafy crown
    ctx.fillStyle = '#5db05a';
    for (let i = -2; i <= 2; i++) {
      const lx = sx + i * 5;
      const ly = sy - 18;
      ctx.beginPath(); ctx.arc(lx, ly, 4, 0, Math.PI*2); ctx.fill();
    }
    // HP bar
    const bw = 50, bh = 4;
    const bx = sx - bw/2, by = sy - 36;
    ctx.fillStyle = '#000'; ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
    ctx.fillStyle = '#3a1f1f'; ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = '#2a8a3a'; ctx.fillRect(bx, by, bw * (this.hp / this.maxHp), bh);
    if (Debug.enabled) {
      const hb = this.hitbox();
      ctx.strokeStyle = '#0f0';
      ctx.strokeRect(hb.x - off.x, hb.y - off.y, hb.w, hb.h);
    }
  }
}
