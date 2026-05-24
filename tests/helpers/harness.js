// Headless test harness.
//
// Lets a test stand up the smallest viable subset of the game without ever rendering:
//   - a stubbed canvas (no real 2D context needed for logic tests)
//   - a Player + Inventory + Stats
//   - an OverworldScene with a tiny throwaway tilemap
//   - synthetic input you can drive frame-by-frame
//
// Use this when a unit-level mock would be more painful than just standing up the system.
// For pure-logic tests (damage formulas, XP curves, recipes), import the module directly
// instead — those don't need this harness.

import { Player } from '../../src/entities/Player.js';
import { Inventory } from '../../src/mechanics/Inventory.js';
import { TileMap } from '../../src/world/TileMap.js';
import { T } from '../../src/world/tiles.js';

class FakeInput {
  constructor() { this.held = new Set(); this.pressed = new Set(); }
  isHeld(a) { return this.held.has(a); }
  wasPressed(a) { return this.pressed.has(a); }
  moveVector() {
    let x = 0, y = 0;
    if (this.held.has('left'))  x -= 1;
    if (this.held.has('right')) x += 1;
    if (this.held.has('up'))    y -= 1;
    if (this.held.has('down'))  y += 1;
    if (x && y) { x *= Math.SQRT1_2; y *= Math.SQRT1_2; }
    return { x, y };
  }
  press(a) { this.pressed.add(a); this.held.add(a); }
  release(a) { this.held.delete(a); }
  endFrame() { this.pressed.clear(); }
}

class FakeScene {
  constructor() {
    this.entities = [];
    this.projectiles = [];
    this.particles = [];
  }
  spawnProjectile() {}
  spawnHitPuff() {}
  showMessage() {}
}

// Build a blank flat tilemap of the given size.
export function makeTilemap(w = 20, h = 20, fill = T.GRASS) {
  const tm = new TileMap(w, h, fill);
  return tm;
}

// Create a minimal context object that scenes/entities expect.
export function makeWorld({ w = 20, h = 20, fill = T.GRASS } = {}) {
  const input = new FakeInput();
  const inventory = new Inventory();
  const tilemap = makeTilemap(w, h, fill);
  const scene = new FakeScene();
  const player = new Player(w * 16, h * 16); // center-ish
  scene.player = player;
  const ctx = { input, tilemap, inventory, scene, player };
  return { input, inventory, tilemap, scene, player, ctx };
}

// Tick the player forward by dt seconds; useful for cooldown/iframe tests.
export function tick(player, ctx, dt = 1 / 60, n = 1) {
  for (let i = 0; i < n; i++) {
    player.update(dt, ctx);
    ctx.input.endFrame();
  }
}
