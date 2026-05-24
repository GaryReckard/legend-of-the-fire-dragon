import { Scene } from '../core/Scene.js';

export class TitleScene extends Scene {
  constructor(game) {
    super(game);
    this.t = 0;
  }
  enter() {
    this.t = 0;
    this.game.state = 'title';
  }
  update(dt) {
    this.t += dt;
    if (this.game.input.wasPressed('confirm') || this.game.input.wasPressed('attack') || this.game.input.wasPressed('action')) {
      this.game.changeScene('overworld');
    }
  }
  biomeAt() { return '-'; }
  biomeLabel() { return ''; }
  draw(ctx) {
    const W = ctx.canvas.width, H = ctx.canvas.height;
    // Sky gradient
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#1a0a14');
    g.addColorStop(0.5, '#3a1010');
    g.addColorStop(1, '#0a0000');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    // Dragon silhouette
    ctx.save();
    ctx.translate(W * 0.7, H * 0.55);
    const s = 1 + Math.sin(this.t * 1.5) * 0.05;
    ctx.scale(s, s);
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(0, 0, 130, 60, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#ff3322';
    ctx.fillRect(-100, -10, 6, 6); // eye
    ctx.restore();

    // Floating embers
    for (let i = 0; i < 24; i++) {
      const x = ((i * 73 + this.t * 30) % W);
      const y = ((i * 97 + this.t * 50) % H);
      const a = 0.3 + 0.7 * Math.sin(this.t * 2 + i);
      ctx.fillStyle = `rgba(255, 140, 40, ${a})`;
      ctx.fillRect(x, y, 2, 2);
    }

    ctx.fillStyle = '#ffaa33';
    ctx.font = 'bold 40px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('THE LEGEND OF', W / 2, H / 2 - 80);
    ctx.font = 'bold 64px "Courier New", monospace';
    ctx.fillStyle = '#ff3322';
    ctx.fillText('THE DRAGON', W / 2, H / 2 - 24);

    ctx.fillStyle = '#fff';
    ctx.font = '14px "Courier New", monospace';
    ctx.fillText('The world burns. Three lands stand between you and the beast.', W / 2, H / 2 + 28);

    if (Math.floor(this.t * 2) % 2 === 0) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px "Courier New", monospace';
      ctx.fillText('PRESS ENTER · J · or E TO BEGIN', W / 2, H / 2 + 70);
    }

    ctx.fillStyle = '#888';
    ctx.font = '11px "Courier New", monospace';
    ctx.fillText('WASD/Arrows move · J sword · K bow · L shield · E action · I inv · C craft', W / 2, H - 30);
    ctx.fillText('` or F1 debug overlay · F2 god · 1/2/3 teleport · B boss · H heal · M mats', W / 2, H - 14);
  }
}
