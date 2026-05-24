// Base scene class. Subclasses: TitleScene, OverworldScene, DungeonScene, BossScene.

export class Scene {
  constructor(game) {
    this.game = game;
    this.entities = []; // active entities (player NOT included; player lives on Game)
    this.projectiles = [];
    this.particles = [];
    this.message = null; // {text, t}
  }

  enter(_payload) {}
  exit() {}

  update(_dt) {}
  draw(_ctx) {}

  showMessage(text, duration = 2.5) {
    this.message = { text, t: duration };
  }

  updateBase(dt) {
    if (this.message) {
      this.message.t -= dt;
      if (this.message.t <= 0) this.message = null;
    }
    // Cull dead
    this.entities = this.entities.filter(e => !e.dead);
    this.projectiles = this.projectiles.filter(p => !p.dead);
    this.particles = this.particles.filter(p => !p.dead);
  }

  drawMessage(ctx) {
    if (!this.message) return;
    ctx.save();
    ctx.font = 'bold 18px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const w = ctx.canvas.width;
    const h = 48;
    const y = ctx.canvas.height - h - 60;
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(40, y, w - 80, h);
    ctx.strokeStyle = '#ffaa44';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, y, w - 80, h);
    ctx.fillStyle = '#fff';
    ctx.fillText(this.message.text, w / 2, y + h / 2);
    ctx.restore();
  }
}
