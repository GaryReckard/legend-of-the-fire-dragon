// Character creation: type a name, pick a skin. Confirms to start the game.

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
  }

  enter() {
    this.t = 0;
    this.game.state = 'menu';
    this.name = this.game.player?.name && this.game.player.name !== 'Hero'
      ? this.game.player.name : '';
    this.skinIdx = SKIN_KEYS.indexOf(this.game.player?.skin || 'blue');
    if (this.skinIdx < 0) this.skinIdx = 0;
    // Listen to raw key events for name typing — we want letters, not action keys.
    this.handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'Backspace') {
        this.name = this.name.slice(0, -1);
        e.preventDefault();
      } else if (e.key === 'Enter') {
        if (this.name.trim().length === 0) this.name = 'Hero';
        this.commit();
        e.preventDefault();
      } else if (e.key === 'ArrowLeft') {
        // Arrow keys only — letters belong to the name field.
        this.skinIdx = (this.skinIdx - 1 + SKIN_KEYS.length) % SKIN_KEYS.length;
      } else if (e.key === 'ArrowRight') {
        this.skinIdx = (this.skinIdx + 1) % SKIN_KEYS.length;
      } else if (/^[a-zA-Z0-9 _-]$/.test(e.key) && this.name.length < 16) {
        this.name += e.key;
      }
    };
    window.addEventListener('keydown', this.handler);
  }

  exit() {
    if (this.handler) window.removeEventListener('keydown', this.handler);
    this.handler = null;
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
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0e1a2e'); g.addColorStop(1, '#0a0a14');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#ffaa33';
    ctx.font = 'bold 32px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('NAME YOUR HERO', W/2, 80);

    // Name input box
    ctx.fillStyle = '#1a1a22';
    ctx.fillRect(W/2 - 180, 110, 360, 44);
    ctx.strokeStyle = '#ffaa33';
    ctx.lineWidth = 2;
    ctx.strokeRect(W/2 - 180, 110, 360, 44);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 22px "Courier New", monospace';
    const blink = Math.floor(this.t * 2) % 2 === 0 ? '_' : ' ';
    ctx.fillText(this.name + blink, W/2, 142);

    ctx.fillStyle = '#888';
    ctx.font = '11px "Courier New", monospace';
    ctx.fillText('type a name (a-z 0-9 - _), max 16 chars', W/2, 172);

    // Skin picker
    ctx.fillStyle = '#ffaa33';
    ctx.font = 'bold 22px "Courier New", monospace';
    ctx.fillText('CHOOSE YOUR LOOK', W/2, 220);

    const skinKey = SKIN_KEYS[this.skinIdx];
    const skinDef = SKINS[skinKey];

    // Render the chosen skin large in the center
    ctx.save();
    ctx.translate(W/2, 320);
    ctx.scale(3, 3);
    drawPlayer(ctx, 0, 0, 'down', false, false, skinKey);
    ctx.restore();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px "Courier New", monospace';
    ctx.fillText(skinDef.name, W/2, 400);

    // Side arrows
    ctx.fillStyle = '#ffaa33';
    ctx.font = 'bold 28px "Courier New", monospace';
    ctx.fillText('◀', W/2 - 120, 330);
    ctx.fillText('▶', W/2 + 120, 330);
    ctx.fillStyle = '#888';
    ctx.font = '11px "Courier New", monospace';
    ctx.fillText('← / → to swap looks', W/2, 428);

    // Confirm prompt
    if (Math.floor(this.t * 2) % 2 === 0) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px "Courier New", monospace';
      ctx.fillText('PRESS ENTER TO BEGIN', W/2, H - 60);
    }
  }
}
