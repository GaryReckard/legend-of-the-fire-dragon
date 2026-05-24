// Hand-authored dungeon: 3 rooms connected by gates.
// Room 1: pushable-block-onto-switch puzzle opens gate to Room 2.
// Room 2: locked door — find the key item by lighting both torches.
// Room 3: chest with the Key, then north toward Boss Door.
// Boss door leads to BossScene.
//
// Layout is one big tilemap; rooms are just regions.

import { TileMap } from './TileMap.js';
import { TILE_SIZE, T } from './tiles.js';

const W = 40, H = 40;

export function buildDungeon() {
  const map = new TileMap(W, H, T.STONE_WALL);

  // Helper: rect of stone floor
  const room = (x, y, w, h) => {
    for (let dy = 0; dy < h; dy++)
      for (let dx = 0; dx < w; dx++)
        map.set(x + dx, y + dy, T.STONE_FLOOR);
  };

  // Room 1 (entry) — bottom
  room(8, 28, 14, 10);
  // Room 2 (middle puzzle)
  room(8, 16, 14, 10);
  // Room 3 (boss approach)
  room(8, 4,  14, 10);

  // Corridors connecting rooms (3-wide)
  for (let y = 26; y < 28; y++) for (let x = 14; x <= 16; x++) map.set(x, y, T.STONE_FLOOR);
  for (let y = 14; y < 16; y++) for (let x = 14; x <= 16; x++) map.set(x, y, T.STONE_FLOOR);

  // Entry stairs (bottom-center): where player drops in
  const entryTx = 15, entryTy = 36;
  map.set(entryTx, entryTy, T.STAIRS_UP);

  // === Room 1: pushable block + switch ===
  // Gate north of room 1 (between room 1 and corridor to room 2)
  map.set(14, 27, T.GATE_CLOSED);
  map.set(15, 27, T.GATE_CLOSED);
  map.set(16, 27, T.GATE_CLOSED);
  // Switch on the east side
  map.set(19, 33, T.SWITCH_OFF);
  // Pushable block in middle
  map.set(13, 33, T.PUSH_BLOCK);
  // A few decorative rocks (harvestable)
  map.set(11, 30, T.ROCK);
  map.set(20, 36, T.ROCK);

  // === Room 2: torches + locked door ===
  // Two torches
  map.set(10, 20, T.TORCH_OFF);
  map.set(20, 20, T.TORCH_OFF);
  // Gate north of room 2 — opens when both torches lit
  map.set(14, 15, T.GATE_CLOSED);
  map.set(15, 15, T.GATE_CLOSED);
  map.set(16, 15, T.GATE_CLOSED);
  // Decorative pillars
  map.set(12, 22, T.STONE_WALL);
  map.set(18, 22, T.STONE_WALL);

  // === Room 3: chest with key + boss door ===
  map.set(15, 9, T.CHEST);
  // Locked door to boss to the north
  map.set(15, 4, T.DOOR_LOCKED);
  // Once unlocked, that tile leads to boss scene.

  // Patrol obstacles / harvestables sprinkled in
  map.set(9, 8, T.ROCK);
  map.set(21, 8, T.ROCK);

  return {
    map,
    spawn: { x: (entryTx + 0.5) * TILE_SIZE, y: (entryTy - 0.5) * TILE_SIZE },
    rooms: {
      r1: { x: 8, y: 28, w: 14, h: 10, gate: [{x:14,y:27},{x:15,y:27},{x:16,y:27}] },
      r2: { x: 8, y: 16, w: 14, h: 10, gate: [{x:14,y:15},{x:15,y:15},{x:16,y:15}] },
      r3: { x: 8, y:  4, w: 14, h: 10 },
    },
    switches: [{ x: 19, y: 33, room: 'r1' }],
    torches:  [{ x: 10, y: 20 }, { x: 20, y: 20 }],
    chest:    { x: 15, y: 9 },
    bossDoor: { x: 15, y: 4 },
    enemySpawns: [
      // Room 1
      { x: 10, y: 32, type: 'slime' },
      { x: 20, y: 30, type: 'slime' },
      // Room 2
      { x: 12, y: 19, type: 'iceskeleton' },
      { x: 18, y: 24, type: 'iceskeleton' },
      // Room 3
      { x: 11, y: 7, type: 'fireimp' },
      { x: 19, y: 7, type: 'fireimp' },
    ],
  };
}

export const DUNGEON_DIMS = { w: W, h: H };
