// Hunger ticks down; below 0 it eats HP. Biome modifiers.
// Volcano without heat_cloak burns the player gradually.

import { Debug } from '../core/Debug.js';

const HUNGER_DRAIN = 0.7; // per second baseline

export function tickSurvival(dt, player, inventory, biome) {
  if (player.dead || Debug.god) return;

  let drain = HUNGER_DRAIN;
  if (biome === 'tundra') drain *= 1.4;
  if (biome === 'volcano') drain *= 1.6;

  player.hunger = Math.max(0, player.hunger - drain * dt);

  if (player.hunger <= 0) {
    player.damage(0.4 * dt, 0, 0, 0);
  }

  // Volcano without heat cloak slowly drains hunger AND hp
  if (biome === 'volcano' && !inventory.has('heat_cloak')) {
    player.damage(0.25 * dt, 0, 0, 0);
  }
}

export function eat(player, itemDef) {
  if (!itemDef.eat) return false;
  player.hunger = Math.min(player.maxHunger, player.hunger + itemDef.eat);
  // small heal
  player.hp = Math.min(player.maxHp, player.hp + 1);
  return true;
}
