// Tile catalog. Every tile id is a number; properties are looked up here.

export const TILE_SIZE = 32;

export const T = {
  // 0-19: forest
  GRASS:        1,
  TREE:         2,
  FLOWER:       3,
  BUSH:         4,
  WATER:        5,
  SAND:         6,
  // 20-39: tundra
  SNOW:        20,
  ICE:         21,
  PINE:        22,
  FROZEN_ROCK: 23,
  // 35-39: swamp
  MUD:         35,
  REEDS:       36,
  SWAMP_TREE:  37,
  BOG_WATER:   38,
  // 40-59: volcano
  ASH:         40,
  LAVA:        41,
  VOLCANIC_ROCK: 42,
  CHARRED_TREE: 43,
  // 60+: structural / dungeon
  ROCK:        60,   // harvestable boulder (drops stone)
  STONE_FLOOR: 61,
  STONE_WALL:  62,
  WOOD_FLOOR:  63,
  WOOD_WALL:   64,
  DOOR_LOCKED: 65,
  DOOR_OPEN:   66,
  STAIRS_DOWN: 67,
  STAIRS_UP:   68,
  PUSH_BLOCK:  69,
  SWITCH_OFF:  70,
  SWITCH_ON:   71,
  TORCH_OFF:   72,
  TORCH_ON:    73,
  GATE_CLOSED: 74,
  GATE_OPEN:   75,
  BOSS_DOOR:   76,
  CAMPFIRE:    77,
  CHEST:       78,
  CHEST_OPEN:  79,
  // ores (require pickaxe)
  IRON_ORE:    80,
  GOLD_ORE:    81,
  // lore book pickup
  LORE_BOOK:   82,
  // power orb pickup (mini-boss reward)
  POWER_ORB:   83,
  // death cache — placed where the player last died; walk over to reclaim
  DEATH_CACHE: 84,
};

// Properties: walkable, attackable (harvest), damage-per-sec, slow factor, biome-tag
export const TILE_PROPS = {
  [T.GRASS]:        { walk: true,  color: '#3a8c3a', accent: '#2d6f2d' },
  [T.TREE]:         { walk: false, attack: true, drops: 'wood', color: '#1f5a1f', accent: '#0e3a0e' },
  [T.FLOWER]:       { walk: true,  color: '#3a8c3a', accent: '#f3b6e3' },
  [T.BUSH]:         { walk: false, attack: true, drops: 'wood', color: '#2a702a', accent: '#1d4d1d' },
  [T.WATER]:        { walk: false, color: '#2566c6', accent: '#3279e0' },
  [T.SAND]:         { walk: true,  color: '#d8c084', accent: '#bfa86d' },

  [T.SNOW]:         { walk: true,  slow: 0.55, color: '#e0eaf3', accent: '#cfd9e2' },
  [T.ICE]:          { walk: true,  slip: true, color: '#9fd5e0', accent: '#bfe3ec' },
  [T.PINE]:         { walk: false, attack: true, drops: 'wood', color: '#1c4a35', accent: '#0d2c1f' },
  [T.FROZEN_ROCK]:  { walk: false, attack: true, drops: 'stone', color: '#6f7c88', accent: '#4d5862' },

  [T.MUD]:          { walk: true,  slow: 0.60, color: '#5a4030', accent: '#3e2b1f' },
  [T.REEDS]:        { walk: false, attack: true, drops: 'wood', color: '#3e5a30', accent: '#2a3e1f' },
  [T.SWAMP_TREE]:   { walk: false, attack: true, drops: 'wood', color: '#324a32', accent: '#1c2c1c' },
  [T.BOG_WATER]:    { walk: false, dmg: 6, color: '#2c4030', accent: '#3a5a44' },

  [T.ASH]:          { walk: true,  color: '#3b302b', accent: '#2c2320' },
  [T.LAVA]:         { walk: false, dmg: 25, color: '#d83b15', accent: '#ff8a2a', glow: true },
  [T.VOLCANIC_ROCK]:{ walk: false, attack: true, drops: 'stone', color: '#4a3030', accent: '#2c1a1a' },
  [T.CHARRED_TREE]: { walk: false, attack: true, drops: 'wood', color: '#1b1410', accent: '#0c0808' },

  [T.ROCK]:         { walk: false, attack: true, drops: 'stone', color: '#7d7d8a', accent: '#525261' },
  [T.STONE_FLOOR]:  { walk: true,  color: '#62626c', accent: '#525258' },
  [T.STONE_WALL]:   { walk: false, color: '#3e3e48', accent: '#2a2a32' },
  [T.WOOD_FLOOR]:   { walk: true,  color: '#7a5230', accent: '#5d3e23' },
  [T.WOOD_WALL]:    { walk: false, color: '#4a2f1c', accent: '#2e1c10' },
  [T.DOOR_LOCKED]:  { walk: false, color: '#a37127', accent: '#5d3e0d', locked: true },
  [T.DOOR_OPEN]:    { walk: true,  color: '#3a2410', accent: '#1f1408' },
  [T.STAIRS_DOWN]:  { walk: true,  color: '#2a2a32', accent: '#000', portal: 'down' },
  [T.STAIRS_UP]:    { walk: true,  color: '#2a2a32', accent: '#888', portal: 'up' },
  [T.PUSH_BLOCK]:   { walk: false, push: true, color: '#9a8c70', accent: '#5e533d' },
  [T.SWITCH_OFF]:   { walk: true,  switch: true, color: '#5a5a64', accent: '#888' },
  [T.SWITCH_ON]:    { walk: true,  switchOn: true, color: '#5a5a64', accent: '#3fd06b' },
  [T.TORCH_OFF]:    { walk: false, torch: true, color: '#3a2a20', accent: '#222' },
  [T.TORCH_ON]:     { walk: false, torchOn: true, color: '#3a2a20', accent: '#ffaa33', glow: true },
  [T.GATE_CLOSED]:  { walk: false, gate: true, color: '#555', accent: '#222' },
  [T.GATE_OPEN]:    { walk: true,  color: '#222', accent: '#111' },
  [T.BOSS_DOOR]:    { walk: false, bossDoor: true, color: '#5b0e0e', accent: '#ffaa33' },
  [T.CAMPFIRE]:     { walk: false, campfire: true, color: '#2a1c10', accent: '#ff7733', glow: true },
  [T.CHEST]:        { walk: false, chest: true, color: '#a37127', accent: '#5d3e0d' },
  [T.CHEST_OPEN]:   { walk: false, color: '#5d3e0d', accent: '#2a1c10' },
  [T.IRON_ORE]:     { walk: false, mine: 'stone',  drops: 'iron_ore', color: '#5a5a6c', accent: '#c8c8d0' },
  [T.GOLD_ORE]:     { walk: false, mine: 'iron',   drops: 'gold_ore', color: '#6a5a3a', accent: '#ffd700' },
  [T.LORE_BOOK]:    { walk: true,  pickup: 'lore', color: '#2a1c10', accent: '#a37127' },
  [T.POWER_ORB]:    { walk: true,  pickup: 'power', color: '#0a0a14', accent: '#9fd5e0' },
  [T.DEATH_CACHE]:  { walk: true,  pickup: 'cache', color: '#2a1c10', accent: '#dcb060' },
};

export function prop(tileId) {
  return TILE_PROPS[tileId] || { walk: true, color: '#000', accent: '#000' };
}

export function isWalkable(tileId) {
  return !!prop(tileId).walk;
}
