// Crafting recipes. Each: { out, n, cost:{id:n}, desc, requires?(inv) }
// `requires` lets a recipe gate itself behind another item (e.g. iron sword needs a forge).
// All recipes pulled in via the game's crafting menu.

export const RECIPES = [
  // tier 1 — wood/stone work
  { out: 'arrow',         n: 5, cost: { wood: 2, stone: 1 }, desc: 'Bundle of arrows' },
  { out: 'cooked_meat',   n: 1, cost: { berry: 2, wood: 1 }, desc: 'Cook over fire' },
  { out: 'pickaxe_stone', n: 1, cost: { wood: 3, stone: 5 }, desc: 'Mine iron ore' },
  { out: 'sword_up',      n: 1, cost: { wood: 5, stone: 8 }, desc: 'Strong Sword — base 2 dmg' },
  { out: 'heat_cloak',    n: 1, cost: { wood: 4, stone: 10}, desc: 'Survive Ashen Wastes' },

  // tier 2 — iron (requires ore smelting)
  { out: 'iron_ingot',    n: 1, cost: { iron_ore: 2, wood: 1 }, desc: 'Smelt 2 ore → ingot' },
  { out: 'pickaxe_iron',  n: 1, cost: { iron_ingot: 3, wood: 2 }, desc: 'Mine gold ore' },
  { out: 'sword_iron',    n: 1, cost: { iron_ingot: 4, wood: 2 }, desc: 'Iron Sword — base 3 dmg' },
  { out: 'helm_iron',     n: 1, cost: { iron_ingot: 2 }, desc: 'Iron Helm — +1 defense' },
  { out: 'body_iron',     n: 1, cost: { iron_ingot: 3 }, desc: 'Iron Tunic — +1 defense' },
  { out: 'boots_iron',    n: 1, cost: { iron_ingot: 2 }, desc: 'Iron Boots — +1 defense' },

  // tier 3 — gold (rare)
  { out: 'gold_ingot',    n: 1, cost: { gold_ore: 2, wood: 1 }, desc: 'Smelt 2 ore → ingot' },
  { out: 'sword_gold',    n: 1, cost: { gold_ingot: 4, iron_ingot: 2 }, desc: 'Gold Sword — base 4 dmg' },

  // post-game
  { out: 'sword_legendary', n: 1, cost: { dragon_scale: 3, gold_ingot: 5 }, desc: 'Dragon Sword — base 6 dmg' },
];

export function canCraft(inv, recipe) {
  for (const id in recipe.cost) {
    if (!inv.has(id, recipe.cost[id])) return false;
  }
  // Don't allow re-crafting unique permanent items.
  const def = inv.constructor?.ITEMS?.[recipe.out];
  if (def?.perm && inv.has(recipe.out)) return false;
  // Specifically check known unique permanents (fallback if def isn't there yet)
  const unique = ['sword_up','sword_iron','sword_gold','sword_legendary','heat_cloak',
                  'pickaxe_stone','pickaxe_iron','helm_iron','body_iron','boots_iron'];
  if (unique.includes(recipe.out) && inv.has(recipe.out)) return false;
  return true;
}

export function craft(inv, recipe) {
  if (!canCraft(inv, recipe)) return false;
  for (const id in recipe.cost) inv.remove(id, recipe.cost[id]);
  inv.add(recipe.out, recipe.n);
  return true;
}
