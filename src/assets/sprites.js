// All sprites drawn procedurally with canvas primitives. No external images.
// Each function takes ctx + screen-space x,y and draws a TILE_SIZE-pixel sprite.

import { TILE_SIZE, T, prop } from '../world/tiles.js';

const TS = TILE_SIZE;

// Cheap deterministic pseudo-random per tile so trees aren't all identical.
function tileHash(tx, ty) {
  let h = (tx * 73856093) ^ (ty * 19349663);
  h = (h ^ (h >>> 13)) >>> 0;
  return (h % 100) / 100;
}

export function drawTile(ctx, tileId, x, y, tx = 0, ty = 0) {
  const p = prop(tileId);
  ctx.fillStyle = p.color;
  ctx.fillRect(x, y, TS, TS);

  switch (tileId) {
    case T.GRASS: {
      ctx.fillStyle = p.accent;
      const r = tileHash(tx, ty);
      const n = 2 + Math.floor(r * 3);
      for (let i = 0; i < n; i++) {
        const rx = ((r * 13 + i * 7) % 1) * (TS - 4);
        const ry = ((r * 29 + i * 11) % 1) * (TS - 4);
        ctx.fillRect(x + rx, y + ry, 2, 2);
      }
      break;
    }
    case T.FLOWER: {
      ctx.fillStyle = '#3a8c3a';
      ctx.fillRect(x, y, TS, TS);
      ctx.fillStyle = '#f3b6e3';
      ctx.fillRect(x + 10, y + 10, 4, 4);
      ctx.fillRect(x + 22, y + 18, 4, 4);
      ctx.fillStyle = '#ffe066';
      ctx.fillRect(x + 11, y + 11, 2, 2);
      ctx.fillRect(x + 23, y + 19, 2, 2);
      break;
    }
    case T.TREE:
    case T.PINE:
    case T.CHARRED_TREE: {
      const base = tileId === T.TREE ? '#3a8c3a' : tileId === T.PINE ? '#e0eaf3' : '#3b302b';
      ctx.fillStyle = base; ctx.fillRect(x, y, TS, TS);
      // trunk
      ctx.fillStyle = '#5d3e1d'; ctx.fillRect(x + TS/2 - 3, y + TS - 10, 6, 10);
      // canopy
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(x + TS/2, y + 12, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = p.accent;
      ctx.beginPath();
      ctx.arc(x + TS/2 - 3, y + 10, 5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case T.BUSH: {
      ctx.fillStyle = '#3a8c3a'; ctx.fillRect(x, y, TS, TS);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(x + TS/2, y + TS/2 + 2, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = p.accent;
      ctx.fillRect(x + 12, y + 12, 3, 3);
      break;
    }
    case T.WATER: {
      ctx.fillStyle = p.color; ctx.fillRect(x, y, TS, TS);
      ctx.fillStyle = p.accent;
      const t = (Date.now() / 600 + tx * 0.4 + ty * 0.3) % 1;
      ctx.fillRect(x + Math.floor(t * TS), y + 6, 6, 2);
      ctx.fillRect(x + Math.floor((t + 0.4) % 1 * TS), y + 18, 4, 2);
      break;
    }
    case T.SAND: {
      ctx.fillStyle = p.color; ctx.fillRect(x, y, TS, TS);
      ctx.fillStyle = p.accent;
      ctx.fillRect(x + 5, y + 12, 2, 2);
      ctx.fillRect(x + 22, y + 6, 2, 2);
      break;
    }
    case T.SNOW: {
      ctx.fillStyle = p.color; ctx.fillRect(x, y, TS, TS);
      ctx.fillStyle = '#fff';
      ctx.fillRect(x + 6, y + 8, 2, 2);
      ctx.fillRect(x + 20, y + 22, 2, 2);
      break;
    }
    case T.ICE: {
      ctx.fillStyle = p.color; ctx.fillRect(x, y, TS, TS);
      ctx.fillStyle = p.accent;
      ctx.fillRect(x + 2, y + 2, TS - 4, 2);
      ctx.fillRect(x + 2, y + TS - 4, TS - 4, 2);
      break;
    }
    case T.FROZEN_ROCK:
    case T.VOLCANIC_ROCK:
    case T.ROCK: {
      ctx.fillStyle = p.accent; ctx.fillRect(x + 2, y + 4, TS - 4, TS - 6);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(x + TS/2, y + TS/2 + 2, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(x + 10, y + 10, 4, 2);
      break;
    }
    case T.ASH: {
      ctx.fillStyle = p.color; ctx.fillRect(x, y, TS, TS);
      ctx.fillStyle = p.accent;
      ctx.fillRect(x + 5, y + 4, 2, 1);
      ctx.fillRect(x + 22, y + 20, 2, 1);
      break;
    }
    case T.LAVA: {
      ctx.fillStyle = p.color; ctx.fillRect(x, y, TS, TS);
      const t = (Date.now() / 200) % (Math.PI * 2);
      ctx.fillStyle = p.accent;
      const r = 4 + Math.sin(t + tx + ty) * 2;
      ctx.beginPath(); ctx.arc(x + 10, y + 10, r, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 22, y + 22, r * 0.7, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case T.STONE_FLOOR: {
      ctx.fillStyle = p.color; ctx.fillRect(x, y, TS, TS);
      ctx.fillStyle = p.accent;
      ctx.fillRect(x, y, TS, 1);
      ctx.fillRect(x, y, 1, TS);
      break;
    }
    case T.STONE_WALL: {
      ctx.fillStyle = p.color; ctx.fillRect(x, y, TS, TS);
      ctx.fillStyle = p.accent;
      ctx.fillRect(x, y, TS, 2);
      ctx.fillRect(x, y + TS - 2, TS, 2);
      ctx.fillRect(x, y + TS/2 - 1, TS, 2);
      ctx.fillRect(x + TS/2 - 1, y, 2, TS/2);
      ctx.fillRect(x + TS/4 - 1, y + TS/2, 2, TS/2);
      ctx.fillRect(x + 3*TS/4 - 1, y + TS/2, 2, TS/2);
      break;
    }
    case T.WOOD_FLOOR:
    case T.WOOD_WALL: {
      ctx.fillStyle = p.color; ctx.fillRect(x, y, TS, TS);
      ctx.fillStyle = p.accent;
      ctx.fillRect(x, y + 10, TS, 1);
      ctx.fillRect(x, y + 22, TS, 1);
      break;
    }
    case T.DOOR_LOCKED: {
      ctx.fillStyle = p.color; ctx.fillRect(x + 4, y, TS - 8, TS);
      ctx.fillStyle = p.accent;
      ctx.fillRect(x + 4, y, TS - 8, 2);
      ctx.fillRect(x + 4, y + TS - 2, TS - 8, 2);
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(x + TS/2 - 2, y + TS/2 - 2, 4, 4);
      break;
    }
    case T.DOOR_OPEN: {
      ctx.fillStyle = '#000'; ctx.fillRect(x + 4, y, TS - 8, TS);
      break;
    }
    case T.STAIRS_DOWN: {
      ctx.fillStyle = '#1a1a22'; ctx.fillRect(x, y, TS, TS);
      ctx.fillStyle = '#444';
      for (let i = 0; i < 4; i++) ctx.fillRect(x + 4 + i*2, y + 6 + i*5, TS - 8 - i*4, 3);
      break;
    }
    case T.STAIRS_UP: {
      ctx.fillStyle = '#2a2a32'; ctx.fillRect(x, y, TS, TS);
      ctx.fillStyle = '#bbb';
      for (let i = 0; i < 4; i++) ctx.fillRect(x + 4 + (3-i)*2, y + 6 + i*5, TS - 8 - (3-i)*4, 3);
      break;
    }
    case T.PUSH_BLOCK: {
      ctx.fillStyle = p.accent; ctx.fillRect(x + 1, y + 1, TS - 2, TS - 2);
      ctx.fillStyle = p.color; ctx.fillRect(x + 4, y + 4, TS - 8, TS - 8);
      ctx.strokeStyle = '#3d3422'; ctx.lineWidth = 1;
      ctx.strokeRect(x + 4.5, y + 4.5, TS - 9, TS - 9);
      break;
    }
    case T.SWITCH_OFF:
    case T.SWITCH_ON: {
      ctx.fillStyle = '#62626c'; ctx.fillRect(x, y, TS, TS);
      ctx.fillStyle = '#3a3a44';
      ctx.beginPath(); ctx.arc(x + TS/2, y + TS/2, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = tileId === T.SWITCH_ON ? '#3fd06b' : '#888';
      ctx.beginPath(); ctx.arc(x + TS/2, y + TS/2, 6, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case T.TORCH_OFF:
    case T.TORCH_ON: {
      ctx.fillStyle = '#62626c'; ctx.fillRect(x, y, TS, TS);
      ctx.fillStyle = '#3a2a20'; ctx.fillRect(x + TS/2 - 2, y + TS/2, 4, TS/2 - 2);
      if (tileId === T.TORCH_ON) {
        const f = 1 + Math.sin(Date.now() / 90) * 0.2;
        ctx.fillStyle = '#ffaa33';
        ctx.beginPath(); ctx.arc(x + TS/2, y + 10, 5 * f, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff066';
        ctx.beginPath(); ctx.arc(x + TS/2, y + 10, 2 * f, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillStyle = '#222';
        ctx.beginPath(); ctx.arc(x + TS/2, y + 10, 3, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case T.GATE_CLOSED: {
      ctx.fillStyle = '#222'; ctx.fillRect(x, y, TS, TS);
      ctx.fillStyle = '#888';
      for (let i = 0; i < 4; i++) ctx.fillRect(x + 2 + i*8, y, 4, TS);
      ctx.fillRect(x, y + 4, TS, 2);
      ctx.fillRect(x, y + TS - 6, TS, 2);
      break;
    }
    case T.GATE_OPEN: {
      ctx.fillStyle = '#111'; ctx.fillRect(x, y, TS, TS);
      break;
    }
    case T.BOSS_DOOR: {
      ctx.fillStyle = p.color; ctx.fillRect(x, y, TS, TS);
      ctx.fillStyle = p.accent;
      ctx.fillRect(x + 4, y + 4, TS - 8, 4);
      ctx.fillRect(x + 4, y + TS - 8, TS - 8, 4);
      // skull
      ctx.fillStyle = '#fff';
      ctx.fillRect(x + TS/2 - 4, y + TS/2 - 4, 8, 6);
      ctx.fillStyle = '#000';
      ctx.fillRect(x + TS/2 - 3, y + TS/2 - 2, 2, 2);
      ctx.fillRect(x + TS/2 + 1, y + TS/2 - 2, 2, 2);
      break;
    }
    case T.CAMPFIRE: {
      ctx.fillStyle = '#3a8c3a'; ctx.fillRect(x, y, TS, TS);
      ctx.fillStyle = '#2a1c10';
      ctx.fillRect(x + 6, y + TS - 10, TS - 12, 4);
      const f = 1 + Math.sin(Date.now() / 120) * 0.3;
      ctx.fillStyle = '#ff7733';
      ctx.beginPath(); ctx.arc(x + TS/2, y + TS - 14, 6 * f, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd066';
      ctx.beginPath(); ctx.arc(x + TS/2, y + TS - 14, 3 * f, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case T.CHEST:
    case T.CHEST_OPEN: {
      ctx.fillStyle = '#62626c'; ctx.fillRect(x, y, TS, TS);
      ctx.fillStyle = '#5d3e0d'; ctx.fillRect(x + 4, y + 10, TS - 8, TS - 14);
      ctx.fillStyle = '#a37127'; ctx.fillRect(x + 4, y + 10, TS - 8, 4);
      if (tileId === T.CHEST_OPEN) {
        ctx.fillStyle = '#000'; ctx.fillRect(x + 6, y + 14, TS - 12, TS - 18);
      } else {
        ctx.fillStyle = '#ffd700'; ctx.fillRect(x + TS/2 - 2, y + 16, 4, 4);
      }
      break;
    }
    default: {
      // fallback: solid color already drawn
      break;
    }
  }
}

// ----- Entity sprites -----

export function drawPlayer(ctx, x, y, dir, attacking, hurt) {
  // dir: 'up'|'down'|'left'|'right'|'upleft' etc. — we render base + facing accents
  const w = 20, h = 22;
  const px = x - w/2, py = y - h/2;

  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(x, py + h + 1, 8, 3, 0, 0, Math.PI*2); ctx.fill();

  const body = hurt ? '#ff6464' : '#3a7ac8';
  ctx.fillStyle = body; ctx.fillRect(px, py + 8, w, h - 10);
  // tunic trim
  ctx.fillStyle = '#1f4a80'; ctx.fillRect(px, py + h - 4, w, 2);
  // head
  ctx.fillStyle = '#f0c898'; ctx.fillRect(px + 4, py, w - 8, 9);
  // hair
  ctx.fillStyle = '#5a3a1a'; ctx.fillRect(px + 4, py, w - 8, 3);
  // eyes (facing)
  ctx.fillStyle = '#000';
  if (dir.includes('left')) {
    ctx.fillRect(px + 5, py + 4, 2, 2);
  } else if (dir.includes('right')) {
    ctx.fillRect(px + w - 7, py + 4, 2, 2);
  } else if (dir.includes('up')) {
    // back of head; no eyes
  } else {
    ctx.fillRect(px + 6, py + 4, 2, 2);
    ctx.fillRect(px + w - 8, py + 4, 2, 2);
  }
  // boots
  ctx.fillStyle = '#3a2410';
  ctx.fillRect(px + 2, py + h - 2, 6, 2);
  ctx.fillRect(px + w - 8, py + h - 2, 6, 2);

  // sword swing
  if (attacking) {
    ctx.save();
    ctx.translate(x, y);
    const angles = { up:-Math.PI/2, down:Math.PI/2, left:Math.PI, right:0,
      upleft:-3*Math.PI/4, upright:-Math.PI/4, downleft:3*Math.PI/4, downright:Math.PI/4 };
    ctx.rotate(angles[dir] ?? 0);
    ctx.fillStyle = '#ddd';
    ctx.fillRect(8, -2, 16, 4);
    ctx.fillStyle = '#888';
    ctx.fillRect(22, -3, 4, 6);
    ctx.fillStyle = '#7a5230';
    ctx.fillRect(4, -3, 4, 6);
    ctx.restore();
  }
}

export function drawSlime(ctx, x, y, t, hurt) {
  const w = 18, h = 12;
  const bob = Math.sin(t * 6) * 2;
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(x, y + h/2 + 2, 8, 2, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = hurt ? '#fff' : '#3fa843';
  ctx.beginPath(); ctx.ellipse(x, y + bob, w/2, h/2, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#1f6f2a';
  ctx.fillRect(x - 4, y + bob, 2, 2);
  ctx.fillRect(x + 2, y + bob, 2, 2);
}

export function drawIceSkeleton(ctx, x, y, t, hurt, facing) {
  const w = 16, h = 22;
  const px = x - w/2, py = y - h/2;
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(x, py + h, 8, 2, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = hurt ? '#fff' : '#bfe3ec';
  ctx.fillRect(px, py + 8, w, h - 10);
  ctx.fillRect(px + 3, py, w - 6, 8);
  ctx.fillStyle = '#1a3848';
  ctx.fillRect(px + 5, py + 3, 2, 2);
  ctx.fillRect(px + w - 7, py + 3, 2, 2);
  // sword
  ctx.fillStyle = '#9fd5e0';
  if (facing === 'left') ctx.fillRect(px - 6, py + 10, 6, 2);
  else ctx.fillRect(px + w, py + 10, 6, 2);
}

export function drawFireImp(ctx, x, y, t, hurt) {
  const w = 16, h = 16;
  const px = x - w/2, py = y - h/2;
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(x, py + h, 7, 2, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = hurt ? '#fff' : '#d83b15';
  ctx.fillRect(px, py + 4, w, h - 4);
  // horns
  ctx.fillStyle = '#5b0e0e';
  ctx.fillRect(px + 2, py, 3, 4);
  ctx.fillRect(px + w - 5, py, 3, 4);
  // eyes
  ctx.fillStyle = '#fff066';
  ctx.fillRect(px + 4, py + 8, 2, 2);
  ctx.fillRect(px + w - 6, py + 8, 2, 2);
  // flame flicker
  const f = Math.sin(t * 14) * 2;
  ctx.fillStyle = '#ff7733';
  ctx.fillRect(px + 6, py + h - 2 + f, 4, 2);
}

export function drawProjectile(ctx, x, y, kind) {
  if (kind === 'arrow') {
    ctx.fillStyle = '#dcb060'; ctx.fillRect(x - 4, y - 1, 8, 2);
    ctx.fillStyle = '#666'; ctx.fillRect(x + 3, y - 2, 2, 4);
  } else if (kind === 'fireball') {
    ctx.fillStyle = '#ff7733';
    ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff066';
    ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI*2); ctx.fill();
  }
}

export function drawParticle(ctx, p) {
  ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
  ctx.fillStyle = p.color;
  ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
  ctx.globalAlpha = 1;
}

// Massive multi-tile Fire Dragon boss. Drawn at its current x,y as a centered sprite.
export function drawFireDragon(ctx, x, y, t, phase, hurt) {
  const W = 160, H = 100;
  const px = x - W/2, py = y - H/2;
  // body
  ctx.fillStyle = hurt ? '#fff' : (phase === 3 ? '#ff5522' : '#8a1d1d');
  ctx.beginPath();
  ctx.ellipse(x, y + 10, W/2, H/3, 0, 0, Math.PI*2);
  ctx.fill();
  // belly
  ctx.fillStyle = '#d8c084';
  ctx.beginPath();
  ctx.ellipse(x, y + 24, W/2 - 16, H/6, 0, 0, Math.PI*2);
  ctx.fill();
  // head
  const headX = x - W/2 + 20;
  const headY = y - 10 + Math.sin(t * 2) * 2;
  ctx.fillStyle = hurt ? '#fff' : '#a32525';
  ctx.beginPath();
  ctx.ellipse(headX, headY, 30, 22, 0, 0, Math.PI*2);
  ctx.fill();
  // jaw
  ctx.fillStyle = '#5b0e0e';
  ctx.fillRect(headX - 28, headY + 4, 24, 6);
  // teeth
  ctx.fillStyle = '#fff';
  for (let i = 0; i < 4; i++) ctx.fillRect(headX - 24 + i*6, headY + 4, 2, 4);
  // eye
  ctx.fillStyle = '#fff066';
  ctx.fillRect(headX - 8, headY - 8, 6, 6);
  ctx.fillStyle = '#000';
  ctx.fillRect(headX - 6, headY - 6, 2, 4);
  // horns
  ctx.fillStyle = '#3a1010';
  ctx.fillRect(headX - 4, headY - 22, 4, 12);
  ctx.fillRect(headX + 6, headY - 22, 4, 12);
  // wings (animated)
  const wf = Math.sin(t * 3) * 0.6;
  ctx.fillStyle = '#5b0e0e';
  ctx.beginPath();
  ctx.moveTo(x + 10, y - 4);
  ctx.lineTo(x + 60, y - 40 - wf*12);
  ctx.lineTo(x + 70, y - 6);
  ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + 30, y - 4);
  ctx.lineTo(x + 80, y - 24 - wf*8);
  ctx.lineTo(x + 70, y + 2);
  ctx.closePath(); ctx.fill();
  // tail
  ctx.fillStyle = '#8a1d1d';
  ctx.beginPath();
  ctx.moveTo(x + W/2 - 8, y + 12);
  ctx.lineTo(x + W/2 + 24, y + 6 + Math.sin(t*4)*4);
  ctx.lineTo(x + W/2 + 22, y + 16 + Math.sin(t*4)*4);
  ctx.lineTo(x + W/2 - 8, y + 22);
  ctx.closePath(); ctx.fill();

  // weak point glow when vulnerable (phase indicator passed in as 'expose')
  if (phase === 'expose') {
    const glow = 1 + Math.sin(t * 8) * 0.3;
    ctx.fillStyle = `rgba(255, 240, 100, ${0.6 + Math.sin(t*8)*0.3})`;
    ctx.beginPath();
    ctx.arc(headX - 6, headY - 6, 10 * glow, 0, Math.PI*2);
    ctx.fill();
  }
}

export function drawShadowMarker(ctx, x, y, r) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#ffaa33';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}
