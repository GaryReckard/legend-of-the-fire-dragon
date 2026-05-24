// Keyboard input. Tracks held keys + just-pressed keys (single-frame edge).

const KEY_MAP = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right',
  KeyJ: 'attack', Space: 'attack',
  KeyK: 'bow',
  KeyL: 'shield',
  KeyE: 'action',
  KeyI: 'inventory',
  KeyC: 'craft',
  Escape: 'pause',
  F1: 'debug',
  Backquote: 'debug',
  F2: 'god',
  F3: 'reveal',
  Digit1: 'tp1', Digit2: 'tp2', Digit3: 'tp3', Digit4: 'tp4',
  KeyB: 'boss',
  KeyH: 'heal',
  KeyM: 'mats',
  KeyN: 'spawn',
  Enter: 'confirm',
  ShiftLeft: 'dash',
  ShiftRight: 'dash',
};

export class Input {
  constructor() {
    this.held = new Set();
    this.pressed = new Set();
    this._listenersBound = false;
    this.bind();
  }

  bind() {
    if (this._listenersBound) return;
    this._listenersBound = true;
    window.addEventListener('keydown', (e) => {
      const a = KEY_MAP[e.code];
      if (!a) return;
      // Prevent browser scroll/refresh on common gameplay keys
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','F1','F2','F3'].includes(e.code)) {
        e.preventDefault();
      }
      if (!this.held.has(a)) this.pressed.add(a);
      this.held.add(a);
    });
    window.addEventListener('keyup', (e) => {
      const a = KEY_MAP[e.code];
      if (!a) return;
      this.held.delete(a);
    });
    window.addEventListener('blur', () => this.held.clear());
  }

  isHeld(a) { return this.held.has(a); }
  wasPressed(a) { return this.pressed.has(a); }

  // Programmatic press/release — used by Touch.js to feed action presses
  // through the same pipeline as the keyboard handlers.
  press(a) {
    if (!this.held.has(a)) this.pressed.add(a);
    this.held.add(a);
  }
  release(a) { this.held.delete(a); }

  // Optional touch source. Joystick is summed into keyboard movement so both
  // can drive the player simultaneously (handy if you ever wanted that, and
  // also makes tests deterministic — keyboard always wins on conflict).
  attachTouch(touch) { this.touch = touch; }

  // 8-directional unit-ish vector from held movement keys, blended with joystick
  moveVector() {
    let x = 0, y = 0;
    if (this.held.has('left'))  x -= 1;
    if (this.held.has('right')) x += 1;
    if (this.held.has('up'))    y -= 1;
    if (this.held.has('down'))  y += 1;
    if (x !== 0 && y !== 0) {
      const inv = 1 / Math.SQRT2;
      x *= inv; y *= inv;
    }
    // No keyboard? Use joystick.
    if (x === 0 && y === 0 && this.touch) {
      const j = this.touch.joyVec();
      x = j.x; y = j.y;
    }
    return { x, y };
  }

  // Call at end of frame to clear per-frame pressed set
  endFrame() {
    this.pressed.clear();
  }
}
