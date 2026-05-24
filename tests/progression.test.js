import { describe, it, expect } from 'vitest';
import { Stats, xpForLevel, totalXpToReach } from '../src/mechanics/progression/Stats.js';

describe('xp curve', () => {
  it('grows quadratically: level N requires N*50 XP', () => {
    expect(xpForLevel(1)).toBe(50);
    expect(xpForLevel(2)).toBe(100);
    expect(xpForLevel(5)).toBe(250);
  });
  it('totalXpToReach is cumulative', () => {
    expect(totalXpToReach(1)).toBe(0);
    expect(totalXpToReach(2)).toBe(50);
    expect(totalXpToReach(3)).toBe(150);
    expect(totalXpToReach(4)).toBe(300);
  });
});

describe('Stats', () => {
  it('starts at level 1 with 0 XP and 0 stat points', () => {
    const s = new Stats();
    expect(s.level).toBe(1);
    expect(s.xp).toBe(0);
    expect(s.unspent).toBe(0);
  });

  it('grants 3 stat points per level up', () => {
    const s = new Stats();
    s.gainXp(50);
    expect(s.level).toBe(2);
    expect(s.unspent).toBe(3);
  });

  it('handles multi-level XP gains in one shot', () => {
    const s = new Stats();
    s.gainXp(150); // levels 1→2 (50) + 2→3 (100) = exactly 150
    expect(s.level).toBe(3);
    expect(s.xp).toBe(0);
    expect(s.unspent).toBe(6);
  });

  it('spendPoint allocates and reduces unspent', () => {
    const s = new Stats();
    s.gainXp(50);
    expect(s.unspent).toBe(3);
    s.spendPoint('str');
    expect(s.str).toBe(1);
    expect(s.unspent).toBe(2);
  });

  it('rejects spending when no points available', () => {
    const s = new Stats();
    expect(s.spendPoint('str')).toBe(false);
    expect(s.str).toBe(0);
  });

  it('serializes to JSON and restores exactly', () => {
    const s = new Stats();
    s.gainXp(60);
    s.spendPoint('vit');
    const json = s.toJSON();
    const s2 = Stats.fromJSON(json);
    expect(s2.level).toBe(s.level);
    expect(s2.xp).toBe(s.xp);
    expect(s2.vit).toBe(1);
    expect(s2.unspent).toBe(2);
  });
});
