# Legend of the Dragon — Roadmap

What's shipped, what's next, and exactly where to add each new piece.

---

## ✅ v0.2 — shipped this iteration

### Architecture
- **Vitest + happy-dom** unit-test infra (`npm test` / `npm run test:watch`)
- Headless harness (`tests/helpers/harness.js`)
- Data-driven item catalog (`src/mechanics/items/catalog.js`) — every item lives in one place
- Tier system (`src/mechanics/items/tiers.js`): wood < stone < iron < gold < dragon
- Centralized damage math (`src/mechanics/Damage.js`): sword/bow + defense formulas
- `Stats` module: 5 stats, XP curve, level-up rewards (tests in `tests/progression.test.js`)
- `Equipment` module: head/body/feet/arm/cape slots, summed defense (tests in `tests/equipment.test.js`)
- Save/load to localStorage (`src/core/Save.js`), schema-versioned, autosave every 20s (tests in `tests/save.test.js`)

### Gameplay
- **Strong Sword now actually does 2× damage** (verified with test red→green)
- Character creator: name + 4 skins (`src/scenes/CharacterCreateScene.js`)
- XP from kills (scales with enemy max HP), level-up flash, stat-point bank in HUD
- Ores: iron + gold tiles in tundra/volcano, gated by pickaxe tier
- New biome: **Mistmarsh** (swamp), between forest and tundra
- Enemy: **BogWraith** — phases in/out of solidity, can't be hit while phased
- NPCs in **Greenhaven** village: Mira (herbalist), Oren (smith), Lila (scribe), each with backstory and dialog
- Dialog system with typewriter effect (`src/ui/Dialog.js`)
- 3 hidden **lore books** scattered across the world (volcano, dungeon approach, swamp)
- Mini-boss: **Spirit of the Grove** in a 7-tree circular clearing in Greenwood
- **Spirit Dash** superpower (Shift key) — burst forward, 25 stamina, brief i-frames

---

## 🔜 Phase 3 — to ship next

Each item lists the file(s) to touch and (where useful) a test to write first.

### Combat & enemies

- [ ] **Behavior-tree base class for AI**
  *Where:* new `src/entities/ai/BehaviorTree.js`. Migrate `Enemy.think()` to declare its tree.
  *Test:* `tests/ai.test.js` — given a stub world, slime's selector picks chase when player in range.

- [ ] **3 more enemy types**
  *Where:* `src/entities/{Wolf,SwampGator,LavaBat}.js`, register in `OverworldScene.spawnEnemyForBiome`.

- [ ] **2 more mini-bosses** with superpower drops
  - **Frost Sentinel** (tundra) → drops `power_shield` (Aegis: hold to nullify next 1 hit, cooldown).
  - **Ash Phoenix** (volcano) → drops `power_flame` (cast a forward fireball, costs 30 stamina).
  *Where:* `src/entities/{FrostSentinel,AshPhoenix}.js`, spawn arenas in `WorldGen.js`.

- [ ] **Better animations** — walk-cycle frame stepping in `drawPlayer`/enemy draws. Right now everything is single-frame. Easiest path: add a `frame` int that ticks on `vx*vy != 0`, render alternate leg offset.

### World
- [ ] **3 more biomes**: Desert (Sunblight), Sky Islands (alt-dimension), Coast (port for an NPC quest).
- [ ] **Alternate dimension**: a "Mirror Realm" entered via a portal tile at the Grove. Same map but inverted palette + harder enemies + unique loot.
  *Where:* `src/world/Dimension.js` (new), update `Game` to track `currentDimension`, `WorldGen` to generate Mirror variant.
- [ ] **Towns + castles**: structured buildings as multi-tile prefabs (`src/world/Prefab.js`). Drop one castle in the tundra with an interior scene.

### Story & systems
- [ ] **Quest system**: `src/mechanics/Quest.js` — a list of quests, each with `id`, `description`, `trigger`, `complete(check)`. Track completion in `game.flags`. NPCs can reference quest state in dialog.
- [ ] **Emotes**: hotkey 7/8/9 cycles emote bubbles (wave, sleep, laugh). Pure cosmetic.
- [ ] **Stat allocation UI**: when `stats.unspent > 0`, pressing `P` opens a panel. Currently we display the count but no UI.

### Polish
- [ ] **Sound** — Web Audio API in `src/core/Audio.js`. Procedural tones for sword/hit/level-up at minimum.
- [ ] **Day/night cycle** — `Game.tod` (0–24), tints biome ambient by time.
- [ ] **Particle pool** — recycle particles instead of GC churn.

---

## 🧪 How to add a new feature, the testable way

```bash
# 1. Write a failing test first
$ vim tests/foo.test.js

# 2. Run the watcher — red
$ npm run test:watch

# 3. Make it pass with minimal code
$ vim src/mechanics/Foo.js

# 4. Refactor — confidence is the green bar.
```

Pure logic (damage, recipes, XP) is the most testable. For UI/scene tests, use `tests/helpers/harness.js` for a stub world.

---

## File index of the new architecture

```
src/
├── core/
│   ├── Save.js              ⭐ NEW — localStorage save/load
│   ├── Game.js              UPDATED — owns dialog, autosaves
│   └── Input.js             UPDATED — Backquote, Shift, Digit4
├── mechanics/
│   ├── Damage.js            ⭐ NEW — single source of truth for combat math
│   ├── Equipment.js         ⭐ NEW — armor slots
│   ├── items/
│   │   ├── catalog.js       ⭐ NEW — every item record
│   │   └── tiers.js         ⭐ NEW — tier multiplier
│   └── progression/
│       └── Stats.js         ⭐ NEW — XP, leveling, stat points
├── entities/
│   ├── BogWraith.js         ⭐ NEW — swamp enemy
│   ├── SpiritOfGrove.js     ⭐ NEW — first mini-boss
│   └── Npc.js               ⭐ NEW — NPC + Greenhaven roster
├── scenes/
│   └── CharacterCreateScene.js ⭐ NEW — name + skin picker
├── ui/
│   └── Dialog.js            ⭐ NEW — typewriter dialog
└── world/
    └── Lore.js              ⭐ NEW — hidden book content

tests/
├── helpers/harness.js       ⭐ NEW — stub world for integration tests
├── smoke.test.js
├── combat.test.js
├── items.test.js
├── progression.test.js
├── equipment.test.js
└── save.test.js
```

30 tests, all green. Run with `npm test`.
