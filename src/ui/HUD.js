// HUD: hearts, hunger, stamina, hotbar of materials, current biome label, controls hint.

import { ITEMS } from '../mechanics/Inventory.js';

export class HUD {
  draw(ctx, game) {
    const p = game.player;
    ctx.save();
    ctx.font = '12px "Courier New", monospace';
    ctx.textBaseline = 'top';

    // Hearts (top-left)
    const hearts = p.maxHearts();
    const cur = p.hp;
    for (let i = 0; i < hearts; i++) {
      const hx = 10 + i * 18, hy = 10;
      const remaining = cur - i * 2;
      drawHeart(ctx, hx, hy, remaining);
    }

    // Hunger + stamina bars below hearts
    const barW = 100, barH = 8;
    const bx = 10, by = 34;
    drawBar(ctx, bx, by, barW, barH, p.hunger / p.maxHunger, '#c87a2a', '#3b2310', 'HUNGER');
    drawBar(ctx, bx, by + 14, barW, barH, p.stamina / p.maxStamina, '#3fd06b', '#10331f', 'STAMINA');

    // Biome label (top-right)
    const biome = game.scene?.biomeLabel?.() ?? '';
    if (biome) {
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      const w = ctx.measureText(biome).width + 16;
      ctx.fillRect(ctx.canvas.width - w - 8, 8, w, 20);
      ctx.fillStyle = '#fff';
      ctx.fillText(biome, ctx.canvas.width - 16, 12);
    }

    // Materials hotbar (bottom-left)
    ctx.textAlign = 'left';
    const mats = ['wood', 'stone', 'arrow', 'berry', 'cooked_meat', 'dungeon_key', 'boss_key'];
    let bx2 = 10, by2 = ctx.canvas.height - 28;
    for (const id of mats) {
      const c = game.inventory.count(id);
      if (c <= 0) continue;
      const def = ITEMS[id];
      const label = `${def.icon ?? '?'} ${c}`;
      const tw = ctx.measureText(label).width + 12;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(bx2, by2 - 2, tw, 20);
      ctx.fillStyle = '#fff';
      ctx.fillText(label, bx2 + 6, by2 + 2);
      bx2 += tw + 4;
    }

    // Permanent items (bottom-right)
    let pbx = ctx.canvas.width - 10, pby = ctx.canvas.height - 28;
    ctx.textAlign = 'right';
    const perms = ['sword_up', 'bow', 'shield', 'heat_cloak'];
    for (const id of perms) {
      if (!game.inventory.has(id)) continue;
      const def = ITEMS[id];
      const label = def.icon ?? '?';
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(pbx - 22, pby - 2, 22, 20);
      ctx.fillStyle = '#fff';
      ctx.fillText(label, pbx - 6, pby + 2);
      pbx -= 26;
    }

    ctx.restore();
  }
}

function drawHeart(ctx, x, y, remaining) {
  // remaining: 2 = full, 1 = half, <=0 empty
  ctx.fillStyle = '#222';
  ctx.beginPath();
  drawHeartPath(ctx, x, y, 14);
  ctx.fill();
  ctx.fillStyle = remaining >= 2 ? '#ff3333' : (remaining === 1 ? '#ff3333' : '#444');
  if (remaining > 0) {
    ctx.save();
    if (remaining === 1) {
      ctx.beginPath(); ctx.rect(x, y, 7, 14); ctx.clip();
    }
    ctx.beginPath();
    drawHeartPath(ctx, x, y, 14);
    ctx.fill();
    ctx.restore();
  }
}

function drawHeartPath(ctx, x, y, s) {
  ctx.moveTo(x + s/2, y + s);
  ctx.bezierCurveTo(x - s*0.2, y + s*0.6, x + s*0.1, y - s*0.1, x + s/2, y + s*0.35);
  ctx.bezierCurveTo(x + s*0.9, y - s*0.1, x + s*1.2, y + s*0.6, x + s/2, y + s);
}

function drawBar(ctx, x, y, w, h, frac, color, bg, label) {
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w * Math.max(0, Math.min(1, frac)), h);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  if (label) {
    ctx.fillStyle = '#fff';
    ctx.font = '9px "Courier New", monospace';
    ctx.fillText(label, x + w + 4, y - 1);
  }
}
