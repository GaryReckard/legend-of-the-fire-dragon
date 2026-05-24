// TileMap: stores a 2D grid of tile ids, plus a "discovered" grid for fog-of-war.
// Draws only tiles within the camera viewport. Pure data + render — no game logic here.

import { TILE_SIZE, prop } from './tiles.js';
import { drawTile } from '../assets/sprites.js';
import { Debug } from '../core/Debug.js';

export class TileMap {
  constructor(w, h, fill = 0) {
    this.w = w;
    this.h = h;
    this.data = new Uint16Array(w * h);
    if (fill) this.data.fill(fill);
    this.discovered = new Uint8Array(w * h);
  }

  inBounds(tx, ty) {
    return tx >= 0 && ty >= 0 && tx < this.w && ty < this.h;
  }

  get(tx, ty) {
    if (!this.inBounds(tx, ty)) return 0;
    return this.data[ty * this.w + tx];
  }

  set(tx, ty, v) {
    if (!this.inBounds(tx, ty)) return;
    this.data[ty * this.w + tx] = v;
  }

  pixelW() { return this.w * TILE_SIZE; }
  pixelH() { return this.h * TILE_SIZE; }

  // Check whether a rectangle (in pixels) collides with any non-walkable tile.
  rectCollides(x, y, w, h) {
    const x0 = Math.floor(x / TILE_SIZE);
    const y0 = Math.floor(y / TILE_SIZE);
    const x1 = Math.floor((x + w - 1) / TILE_SIZE);
    const y1 = Math.floor((y + h - 1) / TILE_SIZE);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (!this.inBounds(tx, ty)) return true;
        const p = prop(this.get(tx, ty));
        if (!p.walk) return true;
      }
    }
    return false;
  }

  // Returns first non-walkable tile coord overlapping the rect, or null.
  rectFirstSolid(x, y, w, h) {
    const x0 = Math.floor(x / TILE_SIZE);
    const y0 = Math.floor(y / TILE_SIZE);
    const x1 = Math.floor((x + w - 1) / TILE_SIZE);
    const y1 = Math.floor((y + h - 1) / TILE_SIZE);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (!this.inBounds(tx, ty)) return { tx, ty, tile: 0 };
        const tile = this.get(tx, ty);
        if (!prop(tile).walk) return { tx, ty, tile };
      }
    }
    return null;
  }

  // Mark all tiles within a radius as discovered
  discover(cx, cy, r = 7) {
    const tx0 = Math.max(0, cx - r);
    const ty0 = Math.max(0, cy - r);
    const tx1 = Math.min(this.w - 1, cx + r);
    const ty1 = Math.min(this.h - 1, cy + r);
    for (let ty = ty0; ty <= ty1; ty++) {
      for (let tx = tx0; tx <= tx1; tx++) {
        const dx = tx - cx, dy = ty - cy;
        if (dx * dx + dy * dy <= r * r) this.discovered[ty * this.w + tx] = 1;
      }
    }
  }

  draw(ctx, camera, opts = {}) {
    const off = camera.offset();
    const x0 = Math.max(0, Math.floor(off.x / TILE_SIZE));
    const y0 = Math.max(0, Math.floor(off.y / TILE_SIZE));
    const x1 = Math.min(this.w - 1, Math.ceil((off.x + camera.viewW) / TILE_SIZE));
    const y1 = Math.min(this.h - 1, Math.ceil((off.y + camera.viewH) / TILE_SIZE));
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const tile = this.data[ty * this.w + tx];
        const sx = tx * TILE_SIZE - off.x;
        const sy = ty * TILE_SIZE - off.y;
        drawTile(ctx, tile, sx, sy, tx, ty);
      }
    }
    // Fog of war on discovered grid (overworld only — opts.fog)
    if (opts.fog && !Debug.revealMap) {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      for (let ty = y0; ty <= y1; ty++) {
        for (let tx = x0; tx <= x1; tx++) {
          if (!this.discovered[ty * this.w + tx]) {
            const sx = tx * TILE_SIZE - off.x;
            const sy = ty * TILE_SIZE - off.y;
            ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
          }
        }
      }
      ctx.restore();
    }

    // Debug grid + solid overlay
    if (Debug.enabled) {
      ctx.save();
      ctx.strokeStyle = 'rgba(0,255,0,0.15)';
      ctx.lineWidth = 1;
      for (let tx = x0; tx <= x1 + 1; tx++) {
        const sx = tx * TILE_SIZE - off.x;
        ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, ctx.canvas.height); ctx.stroke();
      }
      for (let ty = y0; ty <= y1 + 1; ty++) {
        const sy = ty * TILE_SIZE - off.y;
        ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(ctx.canvas.width, sy); ctx.stroke();
      }
      for (let ty = y0; ty <= y1; ty++) {
        for (let tx = x0; tx <= x1; tx++) {
          if (!prop(this.data[ty * this.w + tx]).walk) {
            const sx = tx * TILE_SIZE - off.x;
            const sy = ty * TILE_SIZE - off.y;
            ctx.fillStyle = 'rgba(255,0,0,0.25)';
            ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
          }
        }
      }
      ctx.restore();
    }
  }
}
