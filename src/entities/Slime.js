import { Enemy } from './Enemy.js';
import { drawSlime } from '../assets/sprites.js';

export class Slime extends Enemy {
  constructor(x, y) {
    super(x, y, 16, 12);
    this.maxHp = 2; this.hp = 2;
    this.speed = 45;
    this.touchDmg = 1;
    this.dropTable = ['wood'];
    this.lootChance = 0.5;
  }
  draw(ctx, off) {
    drawSlime(ctx, this.x - off.x, this.y - off.y, this.t, this.hurtT > 0);
    this.drawHpBar(ctx, off);
    this.drawDebug(ctx, off);
  }
}
