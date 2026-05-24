# The Legend of the Dragon

A 2D top-down action-adventure built from scratch — Zelda: ALttP-inspired with survival
mechanics and a multi-phase Fire Dragon boss.

## Run

```bash
npm install
npm run dev
```

Opens at http://localhost:5173

## Controls

| Action | Key |
|---|---|
| Move (8-directional) | WASD or Arrow keys |
| Sword slash | J or Space |
| Bow (uses arrows) | K |
| Shield (hold) | L |
| Interact / push | E |
| Inventory | I |
| Crafting menu | C |
| Pause | Esc |

## Debug keys

| Action | Key |
|---|---|
| Toggle debug overlay | F1 or ` (backtick) |
| God mode | F2 |
| Reveal full map | F3 |
| Teleport to Forest | 1 |
| Teleport to Tundra | 2 |
| Teleport to Volcano | 3 |
| Skip to Boss arena | B |
| Heal to full | H |
| Give crafting mats | M |
| Spawn enemy at cursor | N |

## Architecture

- `src/core` — game loop, input, camera, scene state, debug
- `src/world` — tiles, biomes, world generation, dungeons
- `src/entities` — player, enemies, boss, projectiles
- `src/mechanics` — combat, survival, inventory, crafting, puzzles
- `src/ui` — HUD and menus
- `src/assets/sprites.js` — procedural pixel-art draw functions (no image files)

## The Story

The world burns. Three biomes — Greenwood, the Frozen Reach, and the Ashen Wastes —
each hide a piece of the puzzle. The Fire Dragon waits in the volcanic caldera. Slay it.
