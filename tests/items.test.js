import { describe, it, expect } from 'vitest';
import { ITEMS, itemDef } from '../src/mechanics/items/catalog.js';
import { TIERS, tierMultiplier } from '../src/mechanics/items/tiers.js';

describe('item catalog', () => {
  it('every item has a name + icon + stack size', () => {
    for (const [id, def] of Object.entries(ITEMS)) {
      expect(def.name, `${id}.name`).toBeTypeOf('string');
      expect(def.icon, `${id}.icon`).toBeTypeOf('string');
      expect(def.stack, `${id}.stack`).toBeTypeOf('number');
    }
  });

  it('itemDef returns the right record', () => {
    expect(itemDef('wood').name).toBe('Wood');
    expect(itemDef('not_real')).toBeUndefined();
  });

  it('weapons have damage + tier metadata', () => {
    const sword = itemDef('sword_iron');
    expect(sword).toBeTruthy();
    expect(sword.kind).toBe('weapon');
    expect(sword.tier).toBe('iron');
    expect(sword.damage).toBeGreaterThan(0);
  });

  it('armors have defense + slot metadata', () => {
    const helm = itemDef('helm_iron');
    expect(helm.kind).toBe('armor');
    expect(helm.slot).toBe('head');
    expect(helm.defense).toBeGreaterThan(0);
  });
});

describe('tiers', () => {
  it('damage grows monotonically by tier', () => {
    const tiers = ['wood', 'stone', 'iron', 'gold'];
    let prev = -Infinity;
    for (const t of tiers) {
      const m = tierMultiplier(t);
      expect(m).toBeGreaterThan(prev);
      prev = m;
    }
  });

  it('returns 1 for unknown tier', () => {
    expect(tierMultiplier('nonsense')).toBe(1);
  });
});
