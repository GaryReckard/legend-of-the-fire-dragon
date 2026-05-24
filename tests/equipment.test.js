import { describe, it, expect } from 'vitest';
import { Equipment } from '../src/mechanics/Equipment.js';
import { Inventory } from '../src/mechanics/Inventory.js';
import { applyDefense } from '../src/mechanics/Damage.js';

describe('Equipment', () => {
  it('starts with empty slots', () => {
    const e = new Equipment();
    expect(e.head).toBeNull();
    expect(e.body).toBeNull();
    expect(e.feet).toBeNull();
    expect(e.defenseTotal()).toBe(0);
  });

  it('equips armor by id and sums defense', () => {
    const inv = new Inventory();
    inv.add('helm_iron', 1);
    inv.add('body_iron', 1);
    const e = new Equipment();
    expect(e.equip('helm_iron')).toBe(true);
    expect(e.equip('body_iron')).toBe(true);
    expect(e.defenseTotal()).toBe(2);
  });

  it('refuses to equip non-armor', () => {
    const e = new Equipment();
    expect(e.equip('wood')).toBe(false);
    expect(e.equip('arrow')).toBe(false);
  });

  it('applyDefense reduces incoming damage but never below 1', () => {
    expect(applyDefense(5, { defense: 2 })).toBe(3);
    expect(applyDefense(2, { defense: 10 })).toBe(1);  // floored at 1
    expect(applyDefense(1, { defense: 0 })).toBe(1);
  });

  it('serializes + restores', () => {
    const e = new Equipment();
    e.equip('helm_iron');
    const json = e.toJSON();
    const e2 = Equipment.fromJSON(json);
    expect(e2.head).toBe('helm_iron');
    expect(e2.defenseTotal()).toBe(1);
  });
});
