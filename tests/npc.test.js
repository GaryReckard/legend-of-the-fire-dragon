// Bug repro: walking into an NPC was dealing 1 damage because applyEnemyTouch()
// scanned every entity, including NPCs, and Entity.touchDmg ?? 1 defaulted to 1.
//
// Spec: NPCs are non-combatants. Their .friendly flag must mark them out of combat.

import { describe, it, expect } from 'vitest';
import { applyEnemyTouch } from '../src/mechanics/Combat.js';
import { Npc, GREENHAVEN_NPCS } from '../src/entities/Npc.js';
import { Player } from '../src/entities/Player.js';

describe('NPC contact', () => {
  it('NPCs are flagged friendly', () => {
    const npc = new Npc(0, 0, GREENHAVEN_NPCS[0]);
    expect(npc.friendly).toBe(true);
  });

  it('walking into an NPC does NOT damage the player', () => {
    const player = new Player(100, 100);
    const startHp = player.hp;
    const npc = new Npc(100, 100, GREENHAVEN_NPCS[0]);   // overlapping the player
    applyEnemyTouch(player, [npc]);
    expect(player.hp).toBe(startHp);
  });

  it('actual enemies (not friendly) still damage the player', () => {
    const player = new Player(100, 100);
    const fakeEnemy = {
      x: 100, y: 100,
      dead: false,
      friendly: false,
      touchDmg: 1,
      hitbox() { return { x: 90, y: 90, w: 20, h: 20 }; }
    };
    const before = player.hp;
    applyEnemyTouch(player, [fakeEnemy]);
    expect(player.hp).toBeLessThan(before);
  });
});
