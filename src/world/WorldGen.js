// Procedurally generate the overworld: three biome bands stacked vertically.
// Forest (top) → Tundra (middle) → Volcano (bottom). Smooth boundaries via noise.
// Adds a clearing for the player spawn and a boss-dungeon entrance in the volcano.

import { TileMap } from './TileMap.js';
import { TILE_SIZE, T, prop } from './tiles.js';
import { BIOMES, biomeOf } from './Biome.js';
import { placeLoreBooks } from './Lore.js';

const WORLD_W = 80;   // tiles
const WORLD_H = 110;  // tiles (taller now that we have 4 biomes)
const SEED = 1337;

// Simple seeded RNG (Mulberry32)
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickWeighted(rand, items) {
  const r = rand();
  let acc = 0;
  for (const it of items) { acc += it.w; if (r < acc) return it; }
  return null;
}

export function generateOverworld() {
  const map = new TileMap(WORLD_W, WORLD_H, T.GRASS);
  const rand = rng(SEED);

  // Four biome bands stacked: forest → swamp → tundra → volcano
  const forestEnd = Math.floor(WORLD_H * 0.25);
  const swampEnd  = Math.floor(WORLD_H * 0.45);
  const tundraEnd = Math.floor(WORLD_H * 0.70);

  for (let x = 0; x < WORLD_W; x++) {
    const wob1 = Math.round(Math.sin(x * 0.18) * 2 + (rand() - 0.5) * 2);
    const wob2 = Math.round(Math.cos(x * 0.14) * 2 + (rand() - 0.5) * 2);
    const wob3 = Math.round(Math.sin(x * 0.21 + 1) * 2 + (rand() - 0.5) * 2);
    const fb = forestEnd + wob1;
    const sb = swampEnd  + wob2;
    const tb = tundraEnd + wob3;
    for (let y = 0; y < WORLD_H; y++) {
      let biome;
      if (y < fb)      biome = 'forest';
      else if (y < sb) biome = 'swamp';
      else if (y < tb) biome = 'tundra';
      else             biome = 'volcano';
      const bd = BIOMES[biome];
      let tile = bd.base;
      const pick = pickWeighted(rand, bd.decor);
      if (pick && rand() < pick.w * 10) tile = pick.tile;
      map.set(x, y, tile);
    }
  }

  // Carve a 3-tile-wide vertical road from spawn to volcano dungeon
  const roadX = Math.floor(WORLD_W / 2);
  for (let y = 2; y < WORLD_H - 4; y++) {
    for (let dx = -1; dx <= 1; dx++) {
      const cur = map.get(roadX + dx, y);
      if (!prop(cur).walk) {
        // Replace with biome's walkable base
        const b = biomeOf(cur);
        map.set(roadX + dx, y, BIOMES[b].base);
      }
    }
  }

  // Spawn clearing (top of forest)
  const spawnX = roadX;
  const spawnY = 4;
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -3; dx <= 3; dx++) {
      map.set(spawnX + dx, spawnY + dy, T.GRASS);
    }
  }
  // Campfire just south of spawn so the player isn't standing in it
  map.set(spawnX, spawnY + 2, T.CAMPFIRE);

  // Pond in forest
  for (let dy = 0; dy < 4; dy++) {
    for (let dx = 0; dx < 5; dx++) {
      map.set(spawnX - 8 + dx, spawnY + 4 + dy, T.WATER);
    }
  }

  // Dungeon entrance (in volcano, near bottom of road)
  const dungeonX = roadX;
  const dungeonY = WORLD_H - 6;
  // Clear pad of stone floor
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      map.set(dungeonX + dx, dungeonY + dy, T.STONE_FLOOR);
    }
  }
  // Wall ring with a doorway
  for (let dx = -2; dx <= 2; dx++) {
    map.set(dungeonX + dx, dungeonY - 2, T.STONE_WALL);
    map.set(dungeonX + dx, dungeonY + 2, T.STONE_WALL);
  }
  for (let dy = -2; dy <= 2; dy++) {
    map.set(dungeonX - 2, dungeonY + dy, T.STONE_WALL);
    map.set(dungeonX + 2, dungeonY + dy, T.STONE_WALL);
  }
  // Stairs down at center
  map.set(dungeonX, dungeonY, T.STAIRS_DOWN);
  // Doorway opening on the north wall
  map.set(dungeonX, dungeonY - 2, T.STONE_FLOOR);

  // Carve the Grove — a circular clearing for the Spirit of the Grove mini-boss
  // Placed in the forest, off the main road
  const groveX = Math.floor(WORLD_W * 0.20);
  const groveY = Math.floor(forestEnd * 0.55);
  for (let dy = -6; dy <= 6; dy++) {
    for (let dx = -6; dx <= 6; dx++) {
      const d = Math.hypot(dx, dy);
      if (d > 6) continue;
      const tx = groveX + dx, ty = groveY + dy;
      if (!map.inBounds(tx, ty)) continue;
      map.set(tx, ty, T.GRASS);
    }
  }
  // Ring of 7 trees around the clearing
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const tx = groveX + Math.round(Math.cos(a) * 6);
    const ty = groveY + Math.round(Math.sin(a) * 6);
    if (map.inBounds(tx, ty)) map.set(tx, ty, T.TREE);
  }

  // Sprinkle iron + gold ore deposits. Iron in tundra+volcano, gold only in volcano.
  for (let i = 0; i < 22; i++) {
    const x = 4 + Math.floor(rand() * (WORLD_W - 8));
    const y = forestEnd + 2 + Math.floor(rand() * (WORLD_H - forestEnd - 6));
    const t = map.get(x, y);
    if (prop(t).walk) map.set(x, y, T.IRON_ORE);
  }
  for (let i = 0; i < 10; i++) {
    const x = 4 + Math.floor(rand() * (WORLD_W - 8));
    const y = tundraEnd + 2 + Math.floor(rand() * (WORLD_H - tundraEnd - 8));
    const t = map.get(x, y);
    if (prop(t).walk) map.set(x, y, T.GOLD_ORE);
  }

  // Lava moat south of dungeon
  for (let dx = -4; dx <= 4; dx++) {
    for (let dy = 0; dy < 3; dy++) {
      map.set(dungeonX + dx, dungeonY + 3 + dy, T.LAVA);
    }
  }

  const result = {
    map,
    spawn: { x: (spawnX + 0.5) * TILE_SIZE, y: (spawnY + 0.5) * TILE_SIZE },
    dungeonEntrance: { tx: dungeonX, ty: dungeonY },
    grove: { x: (groveX + 0.5) * TILE_SIZE, y: (groveY + 0.5) * TILE_SIZE, tx: groveX, ty: groveY },
    biomeYs: { forestEnd, swampEnd, tundraEnd },
    waypoints: {
      forest:  { x: (roadX + 0.5) * TILE_SIZE, y: (Math.floor(forestEnd / 2) + 0.5) * TILE_SIZE },
      swamp:   { x: (roadX + 0.5) * TILE_SIZE, y: (Math.floor((forestEnd + swampEnd) / 2) + 0.5) * TILE_SIZE },
      tundra:  { x: (roadX + 0.5) * TILE_SIZE, y: (Math.floor((swampEnd + tundraEnd) / 2) + 0.5) * TILE_SIZE },
      volcano: { x: (roadX + 0.5) * TILE_SIZE, y: (Math.floor((tundraEnd + WORLD_H) / 2) + 0.5) * TILE_SIZE },
    },
  };
  placeLoreBooks(map, result, TILE_SIZE, T);
  return result;
}

export const WORLD_DIMS = { w: WORLD_W, h: WORLD_H };
