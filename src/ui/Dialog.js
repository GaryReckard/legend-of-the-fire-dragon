// Modal dialog box. Pages through an array of lines. Space/Enter/E to advance.
// While open, pauses game time (caller checks dialog.open before scene.update).

export class Dialog {
  constructor() {
    this.open = false;
    this.lines = [];
    this.page = 0;
    this.speakerName = '';
    this.charIdx = 0;       // typewriter effect
    this.charSpeed = 60;    // chars per second
    this.charT = 0;
    this.flash = null;
    this.onClose = null;
  }

  show(speakerName, lines, opts = {}) {
    this.open = true;
    this.lines = lines.slice();
    this.page = 0;
    this.speakerName = speakerName;
    this.charIdx = 0;
    this.charT = 0;
    this.flash = opts.flash || null;
    this.onClose = opts.onClose || null;
  }

  currentLine() { return this.lines[this.page] || ''; }
  displayedText() { return this.currentLine().slice(0, this.charIdx); }
  isLineComplete() { return this.charIdx >= this.currentLine().length; }

  advance() {
    if (!this.isLineComplete()) {
      this.charIdx = this.currentLine().length; // skip typewriter
      return;
    }
    this.page += 1;
    this.charIdx = 0;
    if (this.page >= this.lines.length) {
      this.open = false;
      const cb = this.onClose;
      this.onClose = null;
      cb?.();
    }
  }

  update(dt, input) {
    if (!this.open) return;
    if (!this.isLineComplete()) {
      this.charT += dt * this.charSpeed;
      while (this.charT >= 1 && this.charIdx < this.currentLine().length) {
        this.charT -= 1;
        this.charIdx += 1;
      }
    }
    if (input.wasPressed('action') || input.wasPressed('confirm') || input.wasPressed('attack')) {
      this.advance();
    }
  }

  draw(ctx) {
    if (!this.open) return;
    const W = ctx.canvas.width, H = ctx.canvas.height;
    const h = 130, pad = 16;
    const y = H - h - 10;
    ctx.fillStyle = 'rgba(0,0,0,0.88)';
    ctx.fillRect(10, y, W - 20, h);
    ctx.strokeStyle = '#ffaa44';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, y, W - 20, h);

    // Speaker name plate
    if (this.speakerName) {
      const nw = ctx.measureText(this.speakerName).width + 28;
      ctx.fillStyle = '#ffaa44';
      ctx.fillRect(20, y - 14, nw, 22);
      ctx.fillStyle = '#000';
      ctx.font = 'bold 13px "Courier New", monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.speakerName, 32, y - 3);
    }

    // Line text
    ctx.fillStyle = '#fff';
    ctx.font = '15px "Courier New", monospace';
    ctx.textBaseline = 'top';
    wrapText(ctx, this.displayedText(), 20 + pad, y + pad + 4, W - 40 - pad*2, 20);

    // Flash (e.g., "Mira gave you 5 berries.")
    if (this.flash && this.page === this.lines.length - 1 && this.isLineComplete()) {
      ctx.fillStyle = '#ffd066';
      ctx.font = 'italic 13px "Courier New", monospace';
      ctx.fillText(this.flash, 20 + pad, y + h - 36);
    }

    // Continue prompt
    if (this.isLineComplete()) {
      const blink = Math.floor(Date.now() / 500) % 2 === 0;
      if (blink) {
        ctx.fillStyle = '#ffaa44';
        ctx.font = '12px "Courier New", monospace';
        ctx.textAlign = 'right';
        const last = this.page >= this.lines.length - 1;
        ctx.fillText(last ? '[E] close ▾' : '[E] continue ▾', W - 28, y + h - 22);
      }
    }
  }
}

function wrapText(ctx, text, x, y, maxW, lh) {
  const words = text.split(' ');
  let line = '';
  let yy = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, yy);
      line = word;
      yy += lh;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, yy);
}
