// Equipment slots. Holds an item id per slot; defense is computed on demand
// from the catalog so we don't drift if the catalog changes.

import { itemDef } from './items/catalog.js';

const SLOTS = ['head', 'body', 'feet', 'arm', 'cape'];

export class Equipment {
  constructor() {
    for (const s of SLOTS) this[s] = null;
  }

  equip(id) {
    const def = itemDef(id);
    if (!def || def.kind !== 'armor') return false;
    if (!SLOTS.includes(def.slot)) return false;
    this[def.slot] = id;
    return true;
  }

  unequip(slot) {
    if (!SLOTS.includes(slot)) return false;
    this[slot] = null;
    return true;
  }

  defenseTotal() {
    let d = 0;
    for (const s of SLOTS) {
      const id = this[s];
      if (!id) continue;
      d += itemDef(id)?.defense ?? 0;
    }
    return d;
  }

  toJSON() {
    const o = {};
    for (const s of SLOTS) o[s] = this[s];
    return o;
  }

  static fromJSON(o) {
    const e = new Equipment();
    if (!o) return e;
    for (const s of SLOTS) if (o[s]) e[s] = o[s];
    return e;
  }
}

export { SLOTS };
