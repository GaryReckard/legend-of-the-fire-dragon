import { Input } from './Input.js';
import { Touch } from './Touch.js';
import { Camera } from './Camera.js';
import { Debug } from './Debug.js';
import { Player } from '../entities/Player.js';
import { Inventory } from '../mechanics/Inventory.js';
import { HUD } from '../ui/HUD.js';
import { Menu } from '../ui/Menu.js';
import { Dialog } from '../ui/Dialog.js';
import { saveGame, loadGame, hasSave } from './Save.js';
import { TitleScene } from '../scenes/TitleScene.js';
import { CharacterCreateScene } from '../scenes/CharacterCreateScene.js';
import { OverworldScene } from '../scenes/OverworldScene.js';
import { DungeonScene } from '../scenes/DungeonScene.js';
import { BossScene } from '../scenes/BossScene.js';
import { WinScene } from '../scenes/WinScene.js';
import { GameOverScene } from '../scenes/GameOverScene.js';
import { TILE_SIZE } from '../world/tiles.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;

    this.input = new Input();
    this.touch = new Touch(canvas, this.input);
    this.input.attachTouch(this.touch);
    this.camera = new Camera(canvas.width, canvas.height);
    this.inventory = new Inventory();
    this.hud = new HUD();
    this.menu = new Menu();
    this.dialog = new Dialog();

    this.player = new Player(0, 0);
    this.scene = null;
    this.lastTime = 0;
    this.running = false;

    this.paused = false;
    this.pauseSel = 0;   // 0 = Resume, 1 = Save & Quit
    this.state = 'title'; // title|playing|menu|win|gameover

    // World flags for save/load (defeated boss, opened chests, etc.)
    this.flags = {};

    // Autosave throttle
    this._saveCd = 0;

    // Scenes are constructed lazily and cached
    this.scenes = {};
  }

  save() { saveGame(this); }
  load() { return loadGame(this); }
  hasSave() { return hasSave(); }

  start() {
    this.changeScene('title');
    this.running = true;
    requestAnimationFrame(this.loop);
  }

  changeScene(name, payload) {
    if (this.scene) this.scene.exit();
    if (!this.scenes[name]) {
      const map = {
        title: TitleScene,
        charcreate: CharacterCreateScene,
        overworld: OverworldScene,
        dungeon: DungeonScene,
        boss: BossScene,
        win: WinScene,
        gameover: GameOverScene,
      };
      this.scenes[name] = new map[name](this);
    }
    this.scene = this.scenes[name];
    this.sceneName = name;
    this.scene.enter(payload);
  }

  // Drawn last so it overrides anything underneath. Touch-device + portrait only.
  _drawOrientationPrompt(ctx) {
    if (!this.touch.enabled) return;
    const portrait = window.innerHeight > window.innerWidth;
    if (!portrait) return;
    const W = ctx.canvas.width, H = ctx.canvas.height;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.92)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ffaa44';
    ctx.font = 'bold 32px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ROTATE YOUR PHONE', W/2, H/2 - 20);
    ctx.fillStyle = '#fff';
    ctx.font = '18px "Courier New", monospace';
    ctx.fillText('This game is meant to be played in landscape.', W/2, H/2 + 16);
    // Little rotation icon
    ctx.save();
    ctx.translate(W/2, H/2 + 70);
    ctx.strokeStyle = '#ffaa44';
    ctx.lineWidth = 4;
    ctx.strokeRect(-30, -45, 60, 90);
    const t = Date.now() / 700;
    ctx.rotate(Math.sin(t) * 0.3);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(-45, -30, 90, 60);
    ctx.restore();
    ctx.restore();
  }

  loop = (now) => {
    if (!this.running) return;
    const dt = Math.min(0.05, (now - this.lastTime) / 1000 || 0);
    this.lastTime = now;
    Debug.tickFps(dt);
    this.update(dt);
    this.draw();
    this.input.endFrame();
    requestAnimationFrame(this.loop);
  };

  update(dt) {
    // Global keys
    if (this.input.wasPressed('debug')) Debug.toggle();
    if (this.input.wasPressed('god')) Debug.toggleGod();
    if (this.input.wasPressed('reveal')) Debug.toggleReveal();

    if (this.input.wasPressed('pause') && this.state === 'playing') {
      this.paused = !this.paused;
      this.pauseSel = 0;
    }

    // Pause-menu navigation
    if (this.paused) {
      if (this.input.wasPressed('up'))   this.pauseSel = (this.pauseSel - 1 + 2) % 2;
      if (this.input.wasPressed('down')) this.pauseSel = (this.pauseSel + 1) % 2;
      if (this.input.wasPressed('confirm') || this.input.wasPressed('action')) {
        if (this.pauseSel === 0) {
          this.paused = false;
        } else {
          this.save();
          this.paused = false;
          this.changeScene('title');
        }
      }
      return;
    }

    // Dialog takes priority over everything else when open.
    if (this.dialog.open) {
      this.dialog.update(dt, this.input);
      return;
    }

    // Menu handling: open menu gets first crack at input. If a key both closes the menu
    // AND would re-open it (same `wasPressed` true on this frame), we'd flicker — so we
    // return immediately whenever the menu state changed this frame.
    if (this.menu.open) {
      const wasOpen = true;
      this.menu.update(dt, this);
      if (this.menu.open) return;  // still open — skip scene update
      if (wasOpen) return;          // menu was just closed this frame — don't immediately re-open
    }

    // Open the menu via I or C. Return so the same press doesn't get consumed again below.
    if (this.state === 'playing' && !this.paused) {
      if (this.input.wasPressed('inventory')) { this.menu.toggle('inventory', this); return; }
      else if (this.input.wasPressed('craft')) { this.menu.toggle('craft', this); return; }
    }

    if (this.paused) return;
    if (this.scene) this.scene.update(dt);

    // Autosave every 20 seconds while playing.
    if (this.state === 'playing') {
      this._saveCd -= dt;
      if (this._saveCd <= 0) {
        this._saveCd = 20;
        this.save();
      }
    }
  }

  draw() {
    const { ctx, canvas } = this;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (this.scene) this.scene.draw(ctx);

    if (this.state === 'playing') {
      this.hud.draw(ctx, this);
    }

    if (this.paused) {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // Frame
      const w = 360, h = 220;
      const x = (canvas.width - w) / 2, y = (canvas.height - h) / 2;
      ctx.fillStyle = '#181820'; ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = '#ffaa44'; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 28px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', x + w / 2, y + 50);
      // Options
      const opts = ['Resume', 'Save & Quit'];
      ctx.font = 'bold 18px "Courier New", monospace';
      opts.forEach((label, i) => {
        const oy = y + 100 + i * 36;
        if (this.pauseSel === i) {
          ctx.fillStyle = 'rgba(255,170,68,0.25)';
          ctx.fillRect(x + 32, oy - 22, w - 64, 30);
          ctx.fillStyle = '#ffaa44';
          ctx.fillText('▸ ' + label, x + w / 2, oy);
        } else {
          ctx.fillStyle = '#ccc';
          ctx.fillText(label, x + w / 2, oy);
        }
      });
      ctx.fillStyle = '#888';
      ctx.font = '11px "Courier New", monospace';
      ctx.fillText('↑/↓ select · Enter to confirm · Esc to close', x + w / 2, y + h - 18);
      ctx.restore();
    }

    if (this.menu.open) this.menu.draw(ctx, this);
    if (this.dialog.open) this.dialog.draw(ctx);

    // Mobile controls overlay (only renders on touch devices)
    if (this.state === 'playing' && !this.paused && !this.menu.open && !this.dialog.open) {
      this.touch.draw(ctx, this);
    }

    // Landscape-mandatory overlay on touch devices held in portrait
    this._drawOrientationPrompt(ctx);

    // Debug overlay last
    const px = this.player.x, py = this.player.y;
    Debug.draw(ctx, {
      px, py,
      tx: Math.floor(px / TILE_SIZE),
      ty: Math.floor(py / TILE_SIZE),
      biome: this.scene?.biomeAt?.(px, py) ?? '-',
      scene: this.sceneName,
      entityCount: (this.scene?.entities?.length) ?? 0,
    });
  }
}
