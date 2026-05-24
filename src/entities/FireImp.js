import { Enemy } from './Enemy.js';
import { drawFireImp } from '../assets/sprites.js';
import { Projectile } from './Projectile.js';

export class FireImp extends Enemy {
  constructor(x, y) {
    super(x, y, 16, 16);
    this.maxHp = 3; this.hp = 3;
    this.speed = 55;
    this.touchDmg = 1;
    this.dropTable = ['stone', 'wood'];
    this.lootChance = 0.7;
    this.shootCd = 1.5 + Math.random();
  }
  update(dt, ctx) {
    super.update(dt, ctx);
    if (this.dead) return;
    this.shootCd -= dt;
    if (this.aggro && this.shootCd <= 0) {
      this.shootCd = 1.8 + Math.random() * 0.8;
      const dx = ctx.player.x - this.x;
      const dy = ctx.player.y - this.y;
      const m = Math.hypot(dx, dy) || 1;
      const sp = 180;
      ctx.scene.projectiles.push(
        new Projectile(this.x, this.y, dx/m * sp, dy/m * sp, 'fireball', 'enemy')
      );
    }
  }
  draw(ctx, off) {
    drawFireImp(ctx, this.x - off.x, this.y - off.y, this.t, this.hurtT > 0);
    this.drawHpBar(ctx, off);
    this.drawDebug(ctx, off);
  }
}
