// Soulslike death economy.
//   extractDeathCache(inventory) — removes all consumables and returns a {id:count} map
//   redeemDeathCache(inventory, cache) — merges those counts back into the inventory
//
// "Consumable" = item.kind in CONSUMABLE_KINDS or perm flag is missing.
// Anything weapon/armor/tool/power/lore/key stays — those represent earned progress.

import { itemDef } from './items/catalog.js';

const CONSUMABLE_KINDS = new Set(['material', 'food', 'ammo']);

export function isDropOnDeath(id) {
  const def = itemDef(id);
  if (!def) return false;
  if (def.perm) return false;
  return CONSUMABLE_KINDS.has(def.kind);
}

export function extractDeathCache(inventory) {
  const cache = {};
  for (const id of Object.keys(inventory.counts)) {
    if (!isDropOnDeath(id)) continue;
    cache[id] = inventory.counts[id];
    delete inventory.counts[id];
  }
  if (Object.keys(cache).length === 0) return null;
  return cache;
}

export function redeemDeathCache(inventory, cache) {
  if (!cache) return;
  for (const id of Object.keys(cache)) {
    inventory.add(id, cache[id]);
  }
}
