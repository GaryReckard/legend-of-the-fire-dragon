// Camera follows a target, clamped to world bounds.

export class Camera {
  constructor(viewW, viewH) {
    this.viewW = viewW;
    this.viewH = viewH;
    this.x = 0;
    this.y = 0;
    this.worldW = 0;
    this.worldH = 0;
    this.shakeT = 0;
    this.shakeAmp = 0;
  }

  setWorld(w, h) { this.worldW = w; this.worldH = h; }

  follow(target, dt) {
    const tx = target.x - this.viewW / 2;
    const ty = target.y - this.viewH / 2;
    // Smooth follow
    const k = Math.min(1, dt * 10);
    this.x += (tx - this.x) * k;
    this.y += (ty - this.y) * k;
    this.x = Math.max(0, Math.min(this.x, this.worldW - this.viewW));
    this.y = Math.max(0, Math.min(this.y, this.worldH - this.viewH));
    if (this.shakeT > 0) this.shakeT -= dt;
  }

  shake(time = 0.25, amp = 4) {
    this.shakeT = time;
    this.shakeAmp = amp;
  }

  // Returns offset to subtract from world coords for rendering.
  offset() {
    let ox = this.x, oy = this.y;
    if (this.shakeT > 0) {
      ox += (Math.random() - 0.5) * 2 * this.shakeAmp;
      oy += (Math.random() - 0.5) * 2 * this.shakeAmp;
    }
    return { x: ox, y: oy };
  }
}
