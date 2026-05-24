// Debug overlay singleton. F1 toggles. Other keys handled by Game once enabled.

export const Debug = {
  enabled: false,
  god: false,
  revealMap: false,
  lastFrameMs: 0,
  fps: 0,
  fpsAcc: 0,
  fpsFrames: 0,
  log: [], // ring buffer

  toggle() { this.enabled = !this.enabled; },
  toggleGod() { this.god = !this.god; this.push(`god mode: ${this.god ? 'ON' : 'off'}`); },
  toggleReveal() { this.revealMap = !this.revealMap; this.push(`map reveal: ${this.revealMap ? 'ON' : 'off'}`); },

  push(msg) {
    this.log.unshift(`[${new Date().toLocaleTimeString()}] ${msg}`);
    if (this.log.length > 8) this.log.pop();
  },

  tickFps(dt) {
    this.fpsAcc += dt;
    this.fpsFrames += 1;
    if (this.fpsAcc >= 0.5) {
      this.fps = Math.round(this.fpsFrames / this.fpsAcc);
      this.fpsAcc = 0;
      this.fpsFrames = 0;
    }
  },

  draw(ctx, info) {
    if (!this.enabled) return;
    ctx.save();
    ctx.font = '12px "Courier New", monospace';
    ctx.textBaseline = 'top';

    // Stat panel (top-left)
    const lines = [
      `FPS: ${this.fps}`,
      `Player: ${Math.round(info.px)}, ${Math.round(info.py)}`,
      `Tile: ${info.tx}, ${info.ty}  Biome: ${info.biome}`,
      `Scene: ${info.scene}  Entities: ${info.entityCount}`,
      `God: ${this.god ? 'ON' : 'off'}  Reveal: ${this.revealMap ? 'ON' : 'off'}`,
    ];
    const pad = 6;
    const w = 240, h = lines.length * 14 + pad * 2;
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(4, 4, w, h);
    ctx.strokeStyle = '#0f0';
    ctx.strokeRect(4, 4, w, h);
    ctx.fillStyle = '#0f0';
    lines.forEach((l, i) => ctx.fillText(l, 4 + pad, 4 + pad + i * 14));

    // Log panel (bottom-right)
    if (this.log.length > 0) {
      const lh = 14;
      const lw = 360;
      const ly = ctx.canvas.height - this.log.length * lh - pad * 2 - 4;
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(ctx.canvas.width - lw - 4, ly, lw, this.log.length * lh + pad * 2);
      ctx.fillStyle = '#ff0';
      this.log.forEach((l, i) =>
        ctx.fillText(l, ctx.canvas.width - lw - 4 + pad, ly + pad + i * lh));
    }

    ctx.restore();
  }
};
