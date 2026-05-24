// BogWraith — swamp biome enemy. Phases in/out of solidity periodically,
// can't be hit while phased. Floats over water.

import { Enemy } from './Enemy.js';
import { Debug } from '../core/Debug.js';

export class BogWraith extends Enemy {
  constructor(x, y) {
    super(x, y, 18, 22);
    this.maxHp = 4; this.hp = 4;
    this.touchDmg = 1;
    this.speed = 60;
    this.aggroR = 200;
    this.dropTable = ['stone', 'wood'];
    this.lootChance = 0.7;
    this.xpReward = 22;
    this.phaseT = 0;
    this.phased = false;        // true → can't be damaged
  }

  damage(amount, kx, ky, force) {
    if (this.phased) return false;
    return super.damage(amount, kx, ky, force);
  }

  update(dt, ctx) {
    this.updateTimers(dt);
    this.t += dt;
    this.phaseT += dt;
    if (this.phaseT >= 2.0) {
      this.phaseT = 0;
      this.phased = !this.phased;
    }
    if (this.dead) return;
    this.think(dt, ctx.player);
    // Phased: walk through walls + can't damage player
    if (this.phased) {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
    } else {
      this.moveAndCollide(dt, ctx.tilemap);
    }
  }

  draw(ctx, off) {
    const sx = this.x - off.x;
    const sy = this.y - off.y;
    const a = this.phased ? 0.35 : 1.0;
    ctx.save();
    ctx.globalAlpha = a;
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(sx, sy + 10, 8, 2, 0, 0, Math.PI*2); ctx.fill();
    // body — tall hooded specter
    ctx.fillStyle = this.hurtT > 0 ? '#fff' : '#3e5a4a';
    ctx.beginPath();
    ctx.moveTo(sx - 8, sy + 10);
    ctx.lineTo(sx - 6, sy - 12);
    ctx.lineTo(sx,     sy - 16);
    ctx.lineTo(sx + 6, sy - 12);
    ctx.lineTo(sx + 8, sy + 10);
    ctx.closePath();
    ctx.fill();
    // glowing eyes
    ctx.fillStyle = '#9fd5e0';
    ctx.fillRect(sx - 3, sy - 6, 2, 2);
    ctx.fillRect(sx + 1, sy - 6, 2, 2);
    ctx.restore();
    this.drawHpBar(ctx, off);
    if (Debug.enabled) this.drawDebug(ctx, off);
  }
}
