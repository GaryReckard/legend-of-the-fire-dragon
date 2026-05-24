import { describe, it, expect } from 'vitest';
import { Inventory } from '../src/mechanics/Inventory.js';

describe('smoke', () => {
  it('vitest is wired up', () => {
    expect(1 + 1).toBe(2);
  });

  it('can import game modules', () => {
    const inv = new Inventory();
    expect(inv.has('arrow')).toBe(true);   // starter kit
    expect(inv.count('arrow')).toBe(5);
  });
});
