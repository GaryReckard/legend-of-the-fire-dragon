// Item count store. The item *definitions* live in mechanics/items/catalog.js;
// we re-export here so legacy imports `import { ITEMS } from '../mechanics/Inventory.js'`
// keep working.

import { ITEMS as CATALOG_ITEMS } from './items/catalog.js';
export const ITEMS = CATALOG_ITEMS;

export class Inventory {
  constructor() {
    this.counts = {};
    // Starter kit
    this.add('arrow', 5);
    this.add('bow', 1);
    this.add('shield', 1);
  }

  has(id, n = 1) { return (this.counts[id] || 0) >= n; }
  count(id) { return this.counts[id] || 0; }

  add(id, n = 1) {
    if (!ITEMS[id]) return false;
    this.counts[id] = Math.min((ITEMS[id].stack ?? 99), (this.counts[id] || 0) + n);
    return true;
  }

  remove(id, n = 1) {
    if (!this.has(id, n)) return false;
    this.counts[id] -= n;
    if (this.counts[id] <= 0) delete this.counts[id];
    return true;
  }

  list() {
    return Object.keys(this.counts).map(id => ({ id, ...ITEMS[id], count: this.counts[id] }));
  }
}
