// Touch input + on-screen controls overlay.
//
// Layout (landscape):
//   - Left half of the canvas: virtual joystick. Touch anywhere to spawn a
//     joystick anchored at that point; drag to set direction.
//   - Right side: 4 round action buttons (attack, bow, shield, action/E),
//     plus a Dash button (visible only after the player unlocks the power).
//
// The keyboard Input is the source of truth for action presses; touch buttons
// call input.press()/input.release() so all game code reads the same API.
// Joystick is read separately via touch.joyVec() and merged in Input.moveVector().

export const JOY_MAX_R = 60;       // visual radius of the joystick base in canvas px
const JOY_DEADZONE = 8;            // px from center treated as no input
const BUTTON_R = 38;               // touch button radius in canvas px

// Action layout. (xFrac, yFrac) are positions relative to canvas size,
// from the bottom-right corner. We re-resolve to pixels in layout().
export const BUTTON_LAYOUT = [
  { action: 'attack',  label: 'J',  xFrac: 0.08, yFrac: 0.22, color: '#c84a4a' },
  { action: 'bow',     label: 'K',  xFrac: 0.20, yFrac: 0.34, color: '#7a5230' },
  { action: 'shield',  label: 'L',  xFrac: 0.06, yFrac: 0.40, color: '#3a7ac8' },
  { action: 'action',  label: 'E',  xFrac: 0.20, yFrac: 0.14, color: '#3fa843' },
  { action: 'dash',    label: '»',  xFrac: 0.32, yFrac: 0.24, color: '#9444c8', power: 'dash' },
];

export class Touch {
  constructor(canvas, input) {
    this.canvas = canvas;
    this.input = input;
    this.joystick = null;          // { id, baseX, baseY, x, y }
    this.buttonTouches = new Map(); // touch.identifier -> btn ref
    this.buttons = [];             // resolved {action, x, y, r, color, label, power?}
    this.enabled = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    this.layout(canvas.width, canvas.height);
    this._bind();
  }

  // Compute button positions in canvas pixel space from BUTTON_LAYOUT.
  layout(w, h) {
    this.buttons = BUTTON_LAYOUT.map(b => ({
      action: b.action,
      label: b.label,
      power: b.power,
      color: b.color,
      x: w - b.xFrac * w,      // measured from RIGHT edge
      y: h - b.yFrac * h,      // measured from BOTTOM edge
      r: BUTTON_R,
    }));
  }

  _bind() {
    if (!this.canvas || typeof this.canvas.addEventListener !== 'function') return;
    const opts = { passive: false };
    this.canvas.addEventListener('touchstart', this._onTouchStart, opts);
    this.canvas.addEventListener('touchmove',  this._onTouchMove,  opts);
    this.canvas.addEventListener('touchend',   this._onTouchEnd,   opts);
    this.canvas.addEventListener('touchcancel',this._onTouchEnd,   opts);
  }

  // Convert client coords → canvas-pixel coords (account for CSS scaling).
  _toCanvas(touch) {
    const rect = this.canvas.getBoundingClientRect();
    const sx = this.canvas.width  / rect.width;
    const sy = this.canvas.height / rect.height;
    return {
      x: (touch.clientX - rect.left) * sx,
      y: (touch.clientY - rect.top)  * sy,
    };
  }

  buttonAt(x, y) {
    for (const b of this.buttons) {
      const dx = x - b.x, dy = y - b.y;
      if (dx*dx + dy*dy <= b.r * b.r) return b;
    }
    return null;
  }

  _onTouchStart = (e) => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      const p = this._toCanvas(t);
      const btn = this.buttonAt(p.x, p.y);
      if (btn) {
        this.buttonTouches.set(t.identifier, btn);
        this.input.press?.(btn.action);
        continue;
      }
      // Joystick: only if none is already active
      if (!this.joystick && p.x < this.canvas.width / 2) {
        this.joystick = { id: t.identifier, baseX: p.x, baseY: p.y, x: p.x, y: p.y };
      }
    }
  };

  _onTouchMove = (e) => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      const p = this._toCanvas(t);
      if (this.joystick && t.identifier === this.joystick.id) {
        this.joystick.x = p.x;
        this.joystick.y = p.y;
      }
    }
  };

  _onTouchEnd = (e) => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      const btn = this.buttonTouches.get(t.identifier);
      if (btn) {
        this.input.release?.(btn.action);
        this.buttonTouches.delete(t.identifier);
      }
      if (this.joystick && t.identifier === this.joystick.id) {
        this.joystick = null;
      }
    }
  };

  // Returns the joystick output as a normalized vector in [-1, 1] × [-1, 1].
  joyVec() {
    if (!this.joystick) return { x: 0, y: 0 };
    const dx = this.joystick.x - this.joystick.baseX;
    const dy = this.joystick.y - this.joystick.baseY;
    const m = Math.hypot(dx, dy);
    if (m < JOY_DEADZONE) return { x: 0, y: 0 };
    const k = Math.min(m, JOY_MAX_R) / JOY_MAX_R;
    return { x: (dx / m) * k, y: (dy / m) * k };
  }

  // Draw the joystick + buttons overlay. Caller passes the game so we can
  // check whether the dash power is unlocked.
  draw(ctx, game) {
    if (!this.enabled) return;
    const W = ctx.canvas.width;
    const H = ctx.canvas.height;

    // Joystick (only when active)
    if (this.joystick) {
      const j = this.joystick;
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(j.baseX, j.baseY, JOY_MAX_R, 0, Math.PI * 2);
      ctx.stroke();
      // Thumb
      const v = this.joyVec();
      const tx = j.baseX + v.x * JOY_MAX_R;
      const ty = j.baseY + v.y * JOY_MAX_R;
      ctx.fillStyle = 'rgba(255,170,68,0.55)';
      ctx.beginPath(); ctx.arc(tx, ty, 24, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    } else {
      // Faded hint that the left side is for the joystick
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.beginPath();
      ctx.arc(W * 0.16, H * 0.78, JOY_MAX_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Action buttons
    for (const b of this.buttons) {
      if (b.power && !game?.player?.powers?.[b.power]) continue;
      const held = this.input.isHeld(b.action);
      ctx.save();
      ctx.globalAlpha = held ? 0.85 : 0.55;
      ctx.fillStyle = b.color;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 22px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.label, b.x, b.y);
      ctx.restore();
    }
  }
}
