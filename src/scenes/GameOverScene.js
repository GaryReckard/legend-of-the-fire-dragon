import { Scene } from '../core/Scene.js';

export class GameOverScene extends Scene {
  constructor(game) { super(game); this.t = 0; }
  enter() { this.t = 0; this.game.state = 'gameover'; }
  biomeAt() { return '-'; }
  biomeLabel() { return ''; }
  update(dt) {
    this.t += dt;
    if (this.t > 1 && (this.game.input.wasPressed('confirm') || this.game.input.wasPressed('attack'))) {
      this.game.scenes = {};
      this.game.player.hp = this.game.player.maxHp;
      this.game.player.dead = false;
      this.game.player.deathT = 0;
      this.game.changeScene('overworld');
    }
  }
  draw(ctx) {
    const W = ctx.canvas.width, H = ctx.canvas.height;
    ctx.fillStyle = '#0a0000'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#5b0e0e';
    for (let i = 0; i < 30; i++) {
      const a = (i * 137 + this.t * 30) % W;
      const b = (i * 173 + this.t * 50) % H;
      ctx.fillRect(a, b, 2, 2);
    }
    ctx.fillStyle = '#ff3322';
    ctx.textAlign = 'center';
    ctx.font = 'bold 56px "Courier New", monospace';
    ctx.fillText('YOU DIED', W/2, H/2);
    ctx.fillStyle = '#aaa';
    ctx.font = '16px "Courier New", monospace';
    ctx.fillText('The Dragon\'s flames consumed all.', W/2, H/2 + 32);
    if (Math.floor(this.t * 2) % 2 === 0 && this.t > 1) {
      ctx.fillStyle = '#fff';
      ctx.font = '16px "Courier New", monospace';
      ctx.fillText('PRESS ENTER TO TRY AGAIN', W/2, H/2 + 80);
    }
  }
}
