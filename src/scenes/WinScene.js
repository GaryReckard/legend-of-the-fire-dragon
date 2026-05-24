import { Scene } from '../core/Scene.js';

export class WinScene extends Scene {
  constructor(game) { super(game); this.t = 0; }
  enter() { this.t = 0; this.game.state = 'win'; }
  biomeAt() { return '-'; }
  biomeLabel() { return ''; }
  update(dt) {
    this.t += dt;
    if (this.t > 1 && (this.game.input.wasPressed('confirm') || this.game.input.wasPressed('attack'))) {
      // Reset everything for a new run
      this.game.scenes = {};
      this.game.player.hp = this.game.player.maxHp;
      this.game.player.dead = false;
      this.game.player.deathT = 0;
      this.game.changeScene('title');
    }
  }
  draw(ctx) {
    const W = ctx.canvas.width, H = ctx.canvas.height;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0a1830'); g.addColorStop(1, '#1a3060');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    // Sun
    ctx.fillStyle = '#fff066';
    ctx.beginPath(); ctx.arc(W/2, H/2 - 80, 40 + Math.sin(this.t)*4, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(255, 240, 100, 0.3)';
    ctx.beginPath(); ctx.arc(W/2, H/2 - 80, 80 + Math.sin(this.t)*8, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 48px "Courier New", monospace';
    ctx.fillText('THE WORLD IS SAVED', W/2, H/2);
    ctx.font = '16px "Courier New", monospace';
    ctx.fillText('The Fire Dragon is no more. Dawn breaks over Greenwood.', W/2, H/2 + 36);

    if (Math.floor(this.t * 2) % 2 === 0 && this.t > 1) {
      ctx.fillStyle = '#ffaa33';
      ctx.font = '16px "Courier New", monospace';
      ctx.fillText('PRESS ENTER FOR NEW GAME+', W/2, H/2 + 90);
    }
  }
}
