// Puzzle logic: pushing blocks, switches, torches, gates, locked doors.

import { TILE_SIZE, T, prop } from '../world/tiles.js';

// Try to push the block at (tx,ty) one tile in direction (dx,dy).
// Returns true if pushed.
export function pushBlock(tilemap, tx, ty, dx, dy) {
  const nx = tx + dx, ny = ty + dy;
  if (!tilemap.inBounds(nx, ny)) return false;
  const dest = tilemap.get(nx, ny);
  const destP = prop(dest);
  // Push only onto walkable, non-special tiles (allow switches)
  if (!destP.walk) return false;

  // If destination is a switch, activate it
  const onSwitch = dest === T.SWITCH_OFF;
  tilemap.set(tx, ty, T.STONE_FLOOR);
  tilemap.set(nx, ny, onSwitch ? T.SWITCH_ON_BLOCK_OVERLAY ?? T.PUSH_BLOCK : T.PUSH_BLOCK);
  if (onSwitch) {
    // We keep the visual as PUSH_BLOCK but record that a switch is pressed.
    // To remember, we mark the original switch coord. Caller scans for blocks on switch tiles.
    tilemap._blockOnSwitch = tilemap._blockOnSwitch || new Set();
    tilemap._blockOnSwitch.add(`${nx},${ny}`);
  } else {
    tilemap._blockOnSwitch?.delete(`${tx},${ty}`);
  }
  return true;
}

// Check switches: if any switch tile has a block on it, treat it as "pressed".
// Caller passes a switch list + gate list; returns whether all switches pressed.
export function evaluateSwitches(tilemap, switches) {
  let all = true;
  for (const s of switches) {
    const key = `${s.x},${s.y}`;
    const pressed = tilemap._blockOnSwitch?.has(key) ?? false;
    if (pressed) tilemap.set(s.x, s.y, T.SWITCH_ON); // visual (covered by block, but still)
    else tilemap.set(s.x, s.y, T.SWITCH_OFF);
    if (!pressed) all = false;
  }
  return all;
}

// Open or close gate tiles.
export function setGates(tilemap, gates, open) {
  for (const g of gates) {
    tilemap.set(g.x, g.y, open ? T.GATE_OPEN : T.GATE_CLOSED);
  }
}

// Try to interact with adjacent tile in player's facing direction.
// Handles: torches (light), chests (open), locked doors (unlock with key).
// Returns a result object { action, payload } or null.
export function tryInteract(tilemap, player, inventory) {
  const dir = player.dir;
  let dx = 0, dy = 0;
  if (dir.includes('up')) dy = -1;
  else if (dir.includes('down')) dy = 1;
  if (dir.includes('left')) dx = -1;
  else if (dir.includes('right')) dx = 1;
  if (dx === 0 && dy === 0) dy = 1;
  const tx = Math.floor(player.x / TILE_SIZE) + dx;
  const ty = Math.floor(player.y / TILE_SIZE) + dy;
  const tile = tilemap.get(tx, ty);

  if (tile === T.TORCH_OFF) {
    tilemap.set(tx, ty, T.TORCH_ON);
    return { action: 'torch', tx, ty };
  }
  if (tile === T.CHEST) {
    tilemap.set(tx, ty, T.CHEST_OPEN);
    return { action: 'chest', tx, ty };
  }
  if (tile === T.DOOR_LOCKED) {
    if (inventory.has('dungeon_key') || inventory.has('boss_key')) {
      const key = inventory.has('boss_key') ? 'boss_key' : 'dungeon_key';
      inventory.remove(key, 1);
      tilemap.set(tx, ty, T.DOOR_OPEN);
      return { action: 'unlock', tx, ty, key };
    }
    return { action: 'locked' };
  }
  if (tile === T.PUSH_BLOCK) {
    const pushed = pushBlock(tilemap, tx, ty, dx, dy);
    return { action: pushed ? 'push' : 'cant_push', tx, ty };
  }
  if (tile === T.CAMPFIRE) {
    return { action: 'rest' };
  }
  return null;
}

// Renders a small "[E] verb" floating prompt above an interactable tile.
export function drawInteractHint(ctx, hint, off) {
  const cx = (hint.tx + 0.5) * TILE_SIZE - off.x;
  const cy = hint.ty * TILE_SIZE - off.y - 4;
  const text = `[E] ${hint.label}`;
  ctx.save();
  ctx.font = 'bold 11px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  const w = ctx.measureText(text).width + 10;
  ctx.fillStyle = 'rgba(0,0,0,0.78)';
  ctx.fillRect(cx - w/2, cy - 14, w, 14);
  ctx.strokeStyle = '#ffaa44';
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - w/2 + 0.5, cy - 14 + 0.5, w - 1, 14 - 1);
  ctx.fillStyle = '#fff';
  ctx.fillText(text, cx, cy - 2);
  ctx.restore();
}

// Returns the tile the player is facing IF it is interactable, else null.
// Used to render an "[E]" hint above interactables in front of the player.
export function facingInteractable(tilemap, player) {
  const dir = player.dir;
  let dx = 0, dy = 0;
  if (dir.includes('up')) dy = -1;
  else if (dir.includes('down')) dy = 1;
  if (dir.includes('left')) dx = -1;
  else if (dir.includes('right')) dx = 1;
  if (dx === 0 && dy === 0) dy = 1;
  const tx = Math.floor(player.x / TILE_SIZE) + dx;
  const ty = Math.floor(player.y / TILE_SIZE) + dy;
  const tile = tilemap.get(tx, ty);
  const interactable = new Set([
    T.TORCH_OFF, T.CHEST, T.DOOR_LOCKED, T.PUSH_BLOCK, T.CAMPFIRE,
  ]);
  if (interactable.has(tile)) {
    let label = 'action';
    if (tile === T.TORCH_OFF) label = 'light';
    else if (tile === T.CHEST) label = 'open';
    else if (tile === T.DOOR_LOCKED) label = 'unlock';
    else if (tile === T.PUSH_BLOCK) label = 'push';
    else if (tile === T.CAMPFIRE) label = 'rest';
    return { tx, ty, tile, label };
  }
  return null;
}
