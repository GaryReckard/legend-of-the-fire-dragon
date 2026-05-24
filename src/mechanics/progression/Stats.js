// Player progression. Linear curve, predictable: XP to reach level N from N-1 is N*50.
//
//   Level 1 → 2: 50 xp
//   Level 2 → 3: 100 xp
//   Level 3 → 4: 150 xp
//
// Each level-up grants 3 stat points the player can spend on STR, DEX, VIT, WIS, LCK.
// Stats are read by Damage.js + Survival.js — additive everywhere.

export function xpForLevel(level) { return level * 50; }

export function totalXpToReach(level) {
  // Sum of xpForLevel(1..level-1)
  let acc = 0;
  for (let i = 1; i < level; i++) acc += xpForLevel(i);
  return acc;
}

const POINTS_PER_LEVEL = 3;

export class Stats {
  constructor() {
    this.level = 1;
    this.xp = 0;             // XP toward NEXT level
    this.unspent = 0;        // stat points awaiting allocation
    this.str = 0;
    this.dex = 0;
    this.vit = 0;
    this.wis = 0;
    this.lck = 0;
  }

  // Derived: each VIT adds +1 to max HP (consumed by Player on level up).
  // Each STR/DEX adds +10% damage to sword/bow (read by Damage.js).
  // Each VIT adds +2 to max HP.
  // Defense is summed from equipped armor at runtime, not stored here.
  get defense() { return this._defense ?? 0; }
  set defense(v) { this._defense = v; }

  gainXp(amount) {
    if (amount <= 0) return { leveledUp: 0 };
    this.xp += amount;
    let levels = 0;
    while (this.xp >= xpForLevel(this.level)) {
      this.xp -= xpForLevel(this.level);
      this.level += 1;
      this.unspent += POINTS_PER_LEVEL;
      levels += 1;
    }
    return { leveledUp: levels };
  }

  spendPoint(stat) {
    if (this.unspent <= 0) return false;
    if (!['str', 'dex', 'vit', 'wis', 'lck'].includes(stat)) return false;
    this[stat] += 1;
    this.unspent -= 1;
    return true;
  }

  toJSON() {
    return {
      level: this.level, xp: this.xp, unspent: this.unspent,
      str: this.str, dex: this.dex, vit: this.vit, wis: this.wis, lck: this.lck,
    };
  }

  static fromJSON(o) {
    const s = new Stats();
    if (!o) return s;
    Object.assign(s, o);
    return s;
  }
}
