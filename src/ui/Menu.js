// Modal menu (inventory / crafting). Arrow keys to select, Enter to use/craft, I/C to close.

import { ITEMS } from '../mechanics/Inventory.js';
import { RECIPES, canCraft, craft } from '../mechanics/Crafting.js';
import { eat } from '../mechanics/Survival.js';

export class Menu {
  constructor() {
    this.open = false;
    this.kind = null; // 'inventory' | 'craft'
    this.sel = 0;
    this.flash = null;
    this.flashT = 0;
  }

  toggle(kind, game) {
    if (this.open && this.kind === kind) { this.open = false; this.kind = null; return; }
    this.open = true;
    this.kind = kind;
    this.sel = 0;
  }

  update(dt, game) {
    if (!this.open) return;
    const input = game.input;
    if (input.wasPressed('inventory') && this.kind === 'inventory') { this.open = false; return; }
    if (input.wasPressed('craft') && this.kind === 'craft') { this.open = false; return; }
    if (input.wasPressed('pause')) { this.open = false; return; }

    if (this.flashT > 0) this.flashT = Math.max(0, this.flashT - dt);

    const list = this.kind === 'inventory' ? game.inventory.list() : RECIPES;
    if (list.length === 0) { return; }
    if (input.wasPressed('up')) this.sel = (this.sel - 1 + list.length) % list.length;
    if (input.wasPressed('down')) this.sel = (this.sel + 1) % list.length;

    if (input.wasPressed('confirm') || input.wasPressed('action')) {
      if (this.kind === 'inventory') {
        const it = list[this.sel];
        if (it && it.eat) {
          eat(game.player, it);
          game.inventory.remove(it.id, 1);
          this.flash = `Ate ${it.name}`;
          this.flashT = 1.5;
        } else {
          this.flash = it ? `${it.name} — equipped/passive` : '';
          this.flashT = 1;
        }
      } else {
        const r = list[this.sel];
        if (canCraft(game.inventory, r)) {
          craft(game.inventory, r);
          this.flash = `Crafted ${ITEMS[r.out].name}`;
          this.flashT = 1.5;
        } else {
          this.flash = 'Not enough materials';
          this.flashT = 1.2;
        }
      }
    }
  }

  draw(ctx, game) {
    const W = ctx.canvas.width, H = ctx.canvas.height;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, W, H);
    const w = 460, h = 360;
    const x = (W - w) / 2, y = (H - h) / 2;
    ctx.fillStyle = '#181820';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#ffaa44';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px "Courier New", monospace';
    ctx.textAlign = 'center';
    const title = this.kind === 'inventory' ? 'Inventory' : 'Crafting';
    ctx.fillText(title, x + w / 2, y + 22);

    ctx.font = '13px "Courier New", monospace';
    ctx.textAlign = 'left';

    if (this.kind === 'inventory') {
      const list = game.inventory.list();
      if (list.length === 0) {
        ctx.fillStyle = '#888';
        ctx.fillText('(empty)', x + 20, y + 60);
      }
      list.forEach((it, i) => {
        const ly = y + 60 + i * 22;
        if (i === this.sel) {
          ctx.fillStyle = 'rgba(255,170,68,0.2)';
          ctx.fillRect(x + 10, ly - 4, w - 20, 20);
        }
        ctx.fillStyle = '#fff';
        ctx.fillText(`${it.icon ?? '?'}  ${it.name}  x${it.count}`, x + 20, ly + 10);
      });
      ctx.fillStyle = '#888';
      ctx.font = '11px "Courier New", monospace';
      ctx.fillText('↑/↓ select · Enter/E to use · I to close', x + 16, y + h - 18);
    } else {
      RECIPES.forEach((r, i) => {
        const ly = y + 60 + i * 50;
        if (i === this.sel) {
          ctx.fillStyle = 'rgba(255,170,68,0.2)';
          ctx.fillRect(x + 10, ly - 4, w - 20, 46);
        }
        const ok = canCraft(game.inventory, r);
        ctx.fillStyle = ok ? '#fff' : '#888';
        ctx.fillText(`${ITEMS[r.out].name} x${r.n}`, x + 20, ly + 10);
        ctx.fillStyle = '#aaa';
        const costStr = Object.entries(r.cost).map(([k, v]) =>
          `${ITEMS[k].name} ${game.inventory.count(k)}/${v}`).join('  ');
        ctx.fillText(costStr, x + 20, ly + 26);
        ctx.fillStyle = '#666';
        ctx.fillText(r.desc, x + 20, ly + 40);
      });
      ctx.fillStyle = '#888';
      ctx.font = '11px "Courier New", monospace';
      ctx.fillText('↑/↓ select · Enter to craft · C to close', x + 16, y + h - 18);
    }

    if (this.flashT > 0 && this.flash) {
      ctx.fillStyle = '#ffaa44';
      ctx.font = '13px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(this.flash, x + w / 2, y + h - 36);
    }

    ctx.restore();
  }
}
