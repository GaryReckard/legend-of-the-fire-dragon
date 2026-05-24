// Character creation: type a name, pick a skin. Confirms to start the game.
//
// On touch devices we overlay a native HTML <input> so the mobile keyboard
// pops up. We also expose tap targets for the skin arrows and the BEGIN button.

import { Scene } from '../core/Scene.js';
import { drawPlayer, SKINS } from '../assets/sprites.js';

const SKIN_KEYS = Object.keys(SKINS);

export class CharacterCreateScene extends Scene {
  constructor(game) {
    super(game);
    this.name = '';
    this.skinIdx = 0;
    this.t = 0;
    this.handler = null;
    this.touchHandler = null;
    this.input = null;
    this.hitRects = {};  // { leftArrow, rightArrow, begin }
  }

  enter() {
    this.t = 0;
    this.game.state = 'menu';
    this.name = this.game.player?.name && this.game.player.name !== 'Hero'
      ? this.game.player.name : '';
    this.skinIdx = SKIN_KEYS.indexOf(this.game.player?.skin || 'blue');
    if (this.skinIdx < 0) this.skinIdx = 0;

    // Native HTML input — pops the mobile keyboard.
    this._createInput();

    // Keyboard fallback for desktop
    this.handler = (e) => {
      if (e.target === this.input) return;  // input handles its own keys
      if (e.key === 'Enter') {
        if (this.name.trim().length === 0) this.name = 'Hero';
        this.commit();
        e.preventDefault();
      } else if (e.key === 'ArrowLeft') {
        this.skinIdx = (this.skinIdx - 1 + SKIN_KEYS.length) % SKIN_KEYS.length;
      } else if (e.key === 'ArrowRight') {
        this.skinIdx = (this.skinIdx + 1) % SKIN_KEYS.length;
      }
    };
    window.addEventListener('keydown', this.handler);

    // Touch-tap handler on the canvas (arrows + BEGIN button)
    this.touchHandler = (e) => {
      if (e.changedTouches.length === 0) return;
      const t = e.changedTouches[0];
      const rect = this.game.canvas.getBoundingClientRect();
      const sx = this.game.canvas.width  / rect.width;
      const sy = this.game.canvas.height / rect.height;
      const x = (t.clientX - rect.left) * sx;
      const y = (t.clientY - rect.top)  * sy;
      const inRect = (r) => r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
      if (inRect(this.hitRects.leftArrow)) {
        this.skinIdx = (this.skinIdx - 1 + SKIN_KEYS.length) % SKIN_KEYS.length;
        e.preventDefault();
      } else if (inRect(this.hitRects.rightArrow)) {
        this.skinIdx = (this.skinIdx + 1) % SKIN_KEYS.length;
        e.preventDefault();
      } else if (inRect(this.hitRects.begin)) {
        if (this.name.trim().length === 0) this.name = 'Hero';
        this.commit();
        e.preventDefault();
      }
    };
    this.game.canvas.addEventListener('touchstart', this.touchHandler, { passive: false });
  }

  // Mount a positioned <input> over the canvas. The input's `value` IS the
  // authoritative name — we read it on commit. The drawn name on canvas mirrors
  // the input's current value each frame.
  _createInput() {
    if (this.input) return;
    const el = document.createElement('input');
    el.type = 'text';
    el.maxLength = 16;
    el.value = this.name;
    el.placeholder = 'Hero';
    el.autocapitalize = 'words';
    el.autocomplete = 'off';
    el.style.cssText = `
      position: fixed; left: 50%; top: 18%; transform: translateX(-50%);
      width: min(80vw, 360px); height: 44px;
      font: bold 22px "Courier New", monospace;
      text-align: center; background: #181820; color: #fff;
      border: 2px solid #ffaa44; border-radius: 4px;
      z-index: 100;
    `;
    el.addEventListener('input', () => { this.name = el.value; });
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        if (el.value.trim().length === 0) el.value = 'Hero';
        this.name = el.value;
        this.commit();
        e.preventDefault();
      }
    });
    document.body.appendChild(el);
    this.input = el;
    // Auto-focus on desktop; on mobile we don't want to spam-open the keyboard
    if (!this.game.touch?.enabled) setTimeout(() => el.focus(), 50);
  }

  exit() {
    if (this.handler) {
      window.removeEventListener('keydown', this.handler);
      this.handler = null;
    }
    if (this.touchHandler) {
      this.game.canvas.removeEventListener('touchstart', this.touchHandler);
      this.touchHandler = null;
    }
    if (this.input) {
      this.input.remove();
      this.input = null;
    }
  }

  commit() {
    this.game.player.name = this.name;
    this.game.player.skin = SKIN_KEYS[this.skinIdx];
    // Persist immediately so a refresh keeps the same character.
    this.game.save?.();
    this.game.changeScene('overworld');
  }

  update(dt) { this.t += dt; }

  biomeAt() { return '-'; }
  biomeLabel() { return ''; }

  draw(ctx) {
    const W = ctx.canvas.width, H = ctx.canvas.height;
    const isTouch = this.game.touch?.enabled;

    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0e1a2e'); g.addColorStop(1, '#0a0a14');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#ffaa33';
    ctx.font = `bold ${isTouch ? 40 : 32}px "Courier New", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('NAME YOUR HERO', W/2, H * 0.10);

    // The actual name field is a native <input> rendered above the canvas via DOM —
    // we leave a labeled empty area below the title so it doesn't overlap.
    ctx.fillStyle = '#888';
    ctx.font = `${isTouch ? 14 : 11}px "Courier New", monospace`;
    ctx.fillText('(tap the box above to type)', W/2, H * 0.10 + (isTouch ? 100 : 80));

    // Skin picker
    ctx.fillStyle = '#ffaa33';
    ctx.font = `bold ${isTouch ? 28 : 22}px "Courier New", monospace`;
    ctx.fillText('CHOOSE YOUR LOOK', W/2, H * 0.42);

    const skinKey = SKIN_KEYS[this.skinIdx];
    const skinDef = SKINS[skinKey];

    // Render the chosen skin large in the center
    const charY = H * 0.62;
    const charScale = isTouch ? 4 : 3;
    ctx.save();
    ctx.translate(W/2, charY);
    ctx.scale(charScale, charScale);
    drawPlayer(ctx, 0, 0, 'down', false, false, skinKey);
    ctx.restore();

    ctx.fillStyle = '#fff';
    ctx.font = `bold ${isTouch ? 24 : 18}px "Courier New", monospace`;
    ctx.fillText(skinDef.name, W/2, charY + (isTouch ? 90 : 70));

    // Side arrows — big tap targets
    const arrowR = isTouch ? 38 : 28;
    const arrowOffset = isTouch ? 160 : 120;
    const lx = W/2 - arrowOffset, rx = W/2 + arrowOffset;
    [{x: lx, label: '◀', key: 'leftArrow'}, {x: rx, label: '▶', key: 'rightArrow'}].forEach(({x, label, key}) => {
      ctx.beginPath();
      ctx.fillStyle = 'rgba(255,170,68,0.18)';
      ctx.arc(x, charY, arrowR, 0, Math.PI*2);
      ctx.fill();
      ctx.strokeStyle = '#ffaa33';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#ffaa33';
      ctx.font = `bold ${isTouch ? 36 : 28}px "Courier New", monospace`;
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x, charY);
      ctx.textBaseline = 'alphabetic';
      this.hitRects[key] = { x: x - arrowR, y: charY - arrowR, w: arrowR * 2, h: arrowR * 2 };
    });

    // BEGIN button — big tap target at the bottom
    const btnW = isTouch ? 280 : 220;
    const btnH = isTouch ? 64 : 44;
    const bx = W/2 - btnW/2;
    const by = H - btnH - (isTouch ? 40 : 60);
    const blink = Math.floor(this.t * 2) % 2 === 0;
    ctx.fillStyle = blink ? 'rgba(255,170,68,0.3)' : 'rgba(255,170,68,0.15)';
    ctx.fillRect(bx, by, btnW, btnH);
    ctx.strokeStyle = '#ffaa44';
    ctx.lineWidth = 2;
    ctx.strokeRect(bx + 1, by + 1, btnW - 2, btnH - 2);
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${isTouch ? 24 : 18}px "Courier New", monospace`;
    ctx.textBaseline = 'middle';
    ctx.fillText(isTouch ? 'BEGIN' : 'BEGIN  (Enter)', W/2, by + btnH / 2);
    ctx.textBaseline = 'alphabetic';
    this.hitRects.begin = { x: bx, y: by, w: btnW, h: btnH };
  }
}
