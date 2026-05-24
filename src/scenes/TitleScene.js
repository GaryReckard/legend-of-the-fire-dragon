import { Scene } from '../core/Scene.js';
import { hasSave, clearSave } from '../core/Save.js';

export class TitleScene extends Scene {
  constructor(game) {
    super(game);
    this.t = 0;
    this.sel = 0;
    this.confirmNewGame = false;
  }
  enter() {
    this.t = 0;
    this.game.state = 'title';
    this.hasSave = hasSave();
    this.sel = this.hasSave ? 0 : 0; // 0=Continue/New, 1=New (when save exists)
    this.confirmNewGame = false;
  }
  options() {
    return this.hasSave ? ['Continue', 'New Game'] : ['New Game'];
  }
  update(dt) {
    this.t += dt;
    const input = this.game.input;
    const opts = this.options();

    if (this.confirmNewGame) {
      // y/n confirm
      if (input.wasPressed('confirm') || input.wasPressed('attack') || input.wasPressed('action')) {
        clearSave();
        this.confirmNewGame = false;
        this.game.changeScene('charcreate');
      } else if (input.wasPressed('pause')) {
        this.confirmNewGame = false;
      }
      return;
    }

    if (input.wasPressed('up'))   this.sel = (this.sel - 1 + opts.length) % opts.length;
    if (input.wasPressed('down')) this.sel = (this.sel + 1) % opts.length;
    if (input.wasPressed('confirm') || input.wasPressed('attack') || input.wasPressed('action')) {
      const label = opts[this.sel];
      if (label === 'Continue') {
        if (this.game.load()) this.game.changeScene('overworld');
        else this.game.changeScene('charcreate');
      } else if (label === 'New Game') {
        if (this.hasSave) this.confirmNewGame = true;
        else this.game.changeScene('charcreate');
      }
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

    // Menu (Continue / New Game)
    const opts = this.options();
    ctx.font = 'bold 18px "Courier New", monospace';
    opts.forEach((label, i) => {
      const ly = H / 2 + 70 + i * 32;
      if (this.sel === i) {
        ctx.fillStyle = '#ffaa44';
        ctx.fillText('▸ ' + label + ' ◂', W / 2, ly);
      } else {
        ctx.fillStyle = '#888';
        ctx.fillText(label, W / 2, ly);
      }
    });

    ctx.fillStyle = '#666';
    ctx.font = '11px "Courier New", monospace';
    ctx.fillText('↑/↓ select · Enter to confirm', W / 2, H / 2 + 70 + opts.length * 32 + 12);

    ctx.fillStyle = '#888';
    ctx.font = '11px "Courier New", monospace';
    ctx.fillText('WASD/Arrows move · J sword · K bow · L shield · E action · I inv · C craft', W / 2, H - 30);
    ctx.fillText('` or F1 debug overlay · F2 god · 1/2/3/4 teleport · B boss · H heal · M mats · Esc pause', W / 2, H - 14);

    // New-game confirm overlay
    if (this.confirmNewGame) {
      ctx.fillStyle = 'rgba(0,0,0,0.85)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ff3322';
      ctx.font = 'bold 28px "Courier New", monospace';
      ctx.fillText('Overwrite existing save?', W / 2, H / 2 - 20);
      ctx.fillStyle = '#fff';
      ctx.font = '16px "Courier New", monospace';
      ctx.fillText('Press ENTER to confirm, Esc to cancel.', W / 2, H / 2 + 16);
    }
  }
}
