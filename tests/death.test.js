// Spec for soulslike-style death:
//   - On death: every NON-permanent item leaves the inventory and goes into a "cache" object
//   - Permanent items (weapons, armor, powers, lore books, boss_key) stay
//   - The cache is meant to be placed at the death-spot tile so the player can reclaim it
//   - Picking up the cache merges its contents back into the inventory

import { describe, it, expect } from 'vitest';
import { Inventory } from '../src/mechanics/Inventory.js';
import { extractDeathCache, redeemDeathCache } from '../src/mechanics/Death.js';

function inv(initial) {
  const i = new Inventory();
  i.counts = {};
  Object.assign(i.counts, initial);
  return i;
}

describe('extractDeathCache', () => {
  it('moves all non-permanent items into the cache', () => {
    const i = inv({ wood: 5, stone: 8, berry: 3, arrow: 12, iron_ore: 2 });
    const cache = extractDeathCache(i);
    expect(cache).toEqual({ wood: 5, stone: 8, berry: 3, arrow: 12, iron_ore: 2 });
    expect(Object.keys(i.counts).length).toBe(0);
  });

  it('keeps permanent items in the inventory', () => {
    const i = inv({ sword_up: 1, helm_iron: 1, power_dash: 1, wood: 5, boss_key: 1 });
    const cache = extractDeathCache(i);
    // perms stay
    expect(i.has('sword_up')).toBe(true);
    expect(i.has('helm_iron')).toBe(true);
    expect(i.has('power_dash')).toBe(true);
    expect(i.has('boss_key')).toBe(true);
    // consumables dropped
    expect(cache).toEqual({ wood: 5 });
    expect(i.has('wood')).toBe(false);
  });

  it('returns null if nothing to drop', () => {
    const i = inv({ sword_up: 1, power_dash: 1 });
    const cache = extractDeathCache(i);
    expect(cache).toBeNull();
  });
});

describe('redeemDeathCache', () => {
  it('merges cache back into inventory', () => {
    const i = inv({ wood: 2 });
    redeemDeathCache(i, { wood: 5, stone: 3, arrow: 7 });
    expect(i.count('wood')).toBe(7);
    expect(i.count('stone')).toBe(3);
    expect(i.count('arrow')).toBe(7);
  });

  it('handles null/empty cache gracefully', () => {
    const i = inv({ wood: 1 });
    expect(() => redeemDeathCache(i, null)).not.toThrow();
    expect(() => redeemDeathCache(i, {})).not.toThrow();
    expect(i.count('wood')).toBe(1);
  });
});
