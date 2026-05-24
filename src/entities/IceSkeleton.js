import { Enemy } from './Enemy.js';
import { drawIceSkeleton } from '../assets/sprites.js';

export class IceSkeleton extends Enemy {
  constructor(x, y) {
    super(x, y, 16, 22);
    this.maxHp = 3; this.hp = 3;
    this.speed = 65;
    this.touchDmg = 1;
    this.dropTable = ['stone'];
    this.lootChance = 0.6;
    this.facing = 'right';
  }
  think(dt, player) {
    super.think(dt, player);
    if (this.vx < 0) this.facing = 'left';
    else if (this.vx > 0) this.facing = 'right';
  }
  draw(ctx, off) {
    drawIceSkeleton(ctx, this.x - off.x, this.y - off.y, this.t, this.hurtT > 0, this.facing);
    this.drawHpBar(ctx, off);
    this.drawDebug(ctx, off);
  }
}
