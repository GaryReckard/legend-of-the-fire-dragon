// Persist player + inventory + world flags to localStorage.
// Schema versioned so we can migrate later.

import { Stats } from '../mechanics/progression/Stats.js';
import { Equipment } from '../mechanics/Equipment.js';

export const SAVE_KEY = 'legend-of-the-dragon:save:v1';
const SCHEMA = 1;

export function saveGame(game) {
  const payload = {
    v: SCHEMA,
    ts: Date.now(),
    player: {
      name: game.player.name,
      skin: game.player.skin,
      hp: game.player.hp,
      maxHp: game.player.maxHp,
      hunger: game.player.hunger,
      stamina: game.player.stamina,
      stats: game.player.stats.toJSON(),
      equipment: game.player.equipment.toJSON(),
      powers: { ...game.player.powers },
    },
    inventory: { ...game.inventory.counts },
    flags: { ...(game.flags || {}) },
  };
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

export function loadGame(game) {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return false;
  let data;
  try { data = JSON.parse(raw); } catch { return false; }
  if (!data || data.v !== SCHEMA) return false;

  const p = data.player ?? {};
  game.player.name = p.name ?? 'Hero';
  game.player.skin = p.skin ?? 'blue';
  game.player.maxHp = p.maxHp ?? game.player.maxHp;
  game.player.hp = Math.min(game.player.maxHp, p.hp ?? game.player.hp);
  game.player.hunger = p.hunger ?? game.player.hunger;
  game.player.stamina = p.stamina ?? game.player.stamina;
  game.player.stats = Stats.fromJSON(p.stats);
  game.player.equipment = Equipment.fromJSON(p.equipment);
  // Re-bind the stats.defense getter to the new equipment object.
  Object.defineProperty(game.player.stats, 'defense', {
    get: () => game.player.equipment.defenseTotal(),
    configurable: true,
  });
  game.player.powers = Object.assign({ dash: false, flame: false, shield: false }, p.powers || {});

  // Inventory: reset then restore
  game.inventory.counts = { ...(data.inventory || {}) };
  game.flags = { ...(data.flags || {}) };
  return true;
}

export function hasSave() {
  return !!localStorage.getItem(SAVE_KEY);
}

export function clearSave() {
  localStorage.removeItem(SAVE_KEY);
}
