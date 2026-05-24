// Item dictionary + simple count store.

export const ITEMS = {
  wood:        { name: 'Wood',         icon: '🌲', stack: 99 },
  stone:       { name: 'Stone',        icon: '🪨', stack: 99 },
  berry:       { name: 'Berry',        icon: '🍓', stack: 99, eat: 25 },
  cooked_meat: { name: 'Cooked Meat',  icon: '🍖', stack: 99, eat: 50 },
  arrow:       { name: 'Arrow',        icon: '🏹', stack: 99 },
  sword_up:    { name: 'Strong Sword', icon: '⚔', stack: 1, perm: true },
  bow:         { name: 'Bow',          icon: '🏹', stack: 1, perm: true },
  shield:      { name: 'Shield',       icon: '🛡', stack: 1, perm: true },
  heat_cloak:  { name: 'Heat Cloak',   icon: '🔥', stack: 1, perm: true },
  dungeon_key: { name: 'Dungeon Key',  icon: '🔑', stack: 9 },
  boss_key:    { name: 'Boss Key',     icon: '🗝', stack: 1 },
};

export class Inventory {
  constructor() {
    this.counts = {};
    // Starter kit
    this.add('arrow', 5);
    this.add('bow', 1);
    this.add('shield', 1);
  }

  has(id, n = 1) { return (this.counts[id] || 0) >= n; }
  count(id) { return this.counts[id] || 0; }

  add(id, n = 1) {
    if (!ITEMS[id]) return false;
    this.counts[id] = Math.min((ITEMS[id].stack ?? 99), (this.counts[id] || 0) + n);
    return true;
  }

  remove(id, n = 1) {
    if (!this.has(id, n)) return false;
    this.counts[id] -= n;
    if (this.counts[id] <= 0) delete this.counts[id];
    return true;
  }

  list() {
    return Object.keys(this.counts).map(id => ({ id, ...ITEMS[id], count: this.counts[id] }));
  }
}
