// The item catalog. Single source of truth for every item in the game.
// Each entry is a data record — no behavior here. Behavior lives in modules
// like Damage, Crafting, Inventory.
//
// Add new items by appending to this object. Tests in tests/items.test.js
// will assert the catalog stays well-formed.

export const ITEMS = {
  // ----- materials -----
  wood:        { name: 'Wood',         icon: '🌲', stack: 99, kind: 'material' },
  stone:       { name: 'Stone',        icon: '🪨', stack: 99, kind: 'material' },
  iron_ore:    { name: 'Iron Ore',     icon: '⛓', stack: 99, kind: 'material' },
  gold_ore:    { name: 'Gold Ore',     icon: '✨', stack: 99, kind: 'material' },
  iron_ingot:  { name: 'Iron Ingot',   icon: '🔩', stack: 99, kind: 'material' },
  gold_ingot:  { name: 'Gold Ingot',   icon: '🏵', stack: 99, kind: 'material' },
  dragon_scale:{ name: 'Dragon Scale', icon: '🐲', stack: 99, kind: 'material' },

  // ----- food -----
  berry:       { name: 'Berry',        icon: '🍓', stack: 99, kind: 'food', eat: 25, heal: 1 },
  cooked_meat: { name: 'Cooked Meat',  icon: '🍖', stack: 99, kind: 'food', eat: 50, heal: 2 },
  fish:        { name: 'Fish',         icon: '🐟', stack: 99, kind: 'food', eat: 35, heal: 1 },

  // ----- consumables -----
  arrow:       { name: 'Arrow',        icon: '🏹', stack: 99, kind: 'ammo' },

  // ----- weapons (kind:'weapon', damage = base before STR/tier multiplier) -----
  sword_up:    { name: 'Strong Sword',    icon: '⚔', stack: 1, kind: 'weapon', tier: 'stone', damage: 2, perm: true },
  sword_iron:  { name: 'Iron Sword',      icon: '⚔', stack: 1, kind: 'weapon', tier: 'iron',  damage: 3, perm: true },
  sword_gold:  { name: 'Gold Sword',      icon: '⚔', stack: 1, kind: 'weapon', tier: 'gold',  damage: 4, perm: true },
  sword_legendary: { name: 'Dragon Sword',icon: '⚔', stack: 1, kind: 'weapon', tier: 'dragon',damage: 6, perm: true },
  bow:         { name: 'Bow',          icon: '🏹', stack: 1, kind: 'weapon', tier: 'wood',  damage: 1, perm: true },
  bow_up:      { name: 'Composite Bow', icon: '🏹', stack: 1, kind: 'weapon', tier: 'iron',  damage: 2, perm: true },

  // ----- tools -----
  pickaxe_stone: { name: 'Stone Pickaxe', icon: '⛏', stack: 1, kind: 'tool', tier: 'stone',  perm: true, mines: ['iron_ore'] },
  pickaxe_iron:  { name: 'Iron Pickaxe',  icon: '⛏', stack: 1, kind: 'tool', tier: 'iron',   perm: true, mines: ['iron_ore', 'gold_ore'] },

  // ----- armor (slot: head|body|feet, defense: flat damage reduction) -----
  shield:      { name: 'Shield',       icon: '🛡', stack: 1, kind: 'armor', slot: 'arm',  defense: 0, perm: true },
  helm_iron:   { name: 'Iron Helm',    icon: '⛑', stack: 1, kind: 'armor', slot: 'head', defense: 1, tier: 'iron', perm: true },
  body_iron:   { name: 'Iron Tunic',   icon: '🥋', stack: 1, kind: 'armor', slot: 'body', defense: 1, tier: 'iron', perm: true },
  boots_iron:  { name: 'Iron Boots',   icon: '🥾', stack: 1, kind: 'armor', slot: 'feet', defense: 1, tier: 'iron', perm: true },
  heat_cloak:  { name: 'Heat Cloak',   icon: '🔥', stack: 1, kind: 'armor', slot: 'cape', defense: 0, perm: true },

  // ----- keys -----
  dungeon_key: { name: 'Dungeon Key',  icon: '🔑', stack: 9, kind: 'key' },
  boss_key:    { name: 'Boss Key',     icon: '🗝', stack: 1, kind: 'key' },

  // ----- powers (superpower unlock tokens) -----
  power_dash:  { name: 'Spirit Dash',  icon: '💨', stack: 1, kind: 'power', perm: true },
  power_flame: { name: 'Flame Hand',   icon: '☄', stack: 1, kind: 'power', perm: true },
  power_shield:{ name: 'Aegis',        icon: '✨', stack: 1, kind: 'power', perm: true },

  // ----- lore -----
  book_genesis:{ name: 'On the Burning', icon: '📖', stack: 1, kind: 'lore' },
  book_dragons:{ name: 'A Hunter\'s Log', icon: '📖', stack: 1, kind: 'lore' },
  book_spirits:{ name: 'The Grove Spirit', icon: '📖', stack: 1, kind: 'lore' },
};

export function itemDef(id) { return ITEMS[id]; }

export function isPermanent(id) { return !!ITEMS[id]?.perm; }
export function isEquippable(id) { return ITEMS[id]?.kind === 'armor' || ITEMS[id]?.kind === 'weapon'; }
