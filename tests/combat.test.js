// TDD: write failing tests describing the *intended* combat behavior, then make them pass.
//
// Spec we want to lock in:
//   - swordDamage(inventory, stats?) returns 1 for a bare hand / default kit
//   - returns 2 when the player owns 'sword_up'
//   - is multiplied by stats.strBonus (1 + STR*0.10) once stats exist
//   - is doubled again if 'sword_legendary' is owned (future tier)

import { describe, it, expect } from 'vitest';
import { Inventory } from '../src/mechanics/Inventory.js';
import { swordDamage, bowDamage } from '../src/mechanics/Damage.js';

describe('swordDamage', () => {
  it('returns 1 when player has only the starter sword (no upgrades)', () => {
    const inv = new Inventory();
    expect(swordDamage(inv, null)).toBe(1);
  });

  it('returns 2 when player owns Strong Sword', () => {
    const inv = new Inventory();
    inv.add('sword_up', 1);
    expect(swordDamage(inv, null)).toBe(2);
  });

  it('respects STR stat bonus (+10% per point, rounded down)', () => {
    const inv = new Inventory();
    inv.add('sword_up', 1); // base 2
    // STR 5 → 2 * (1 + 0.5) = 3
    expect(swordDamage(inv, { str: 5 })).toBe(3);
    // STR 10 → 2 * 2 = 4
    expect(swordDamage(inv, { str: 10 })).toBe(4);
  });

  it('handles missing stats gracefully', () => {
    const inv = new Inventory();
    expect(swordDamage(inv, undefined)).toBe(1);
    expect(swordDamage(inv, {})).toBe(1);
  });
});

describe('bowDamage', () => {
  it('returns 1 by default', () => {
    expect(bowDamage(new Inventory(), null)).toBe(1);
  });
});
