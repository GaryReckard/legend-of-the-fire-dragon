// Crafting recipes. Cost map → product (count).

export const RECIPES = [
  { out: 'arrow',      n: 5, cost: { wood: 2, stone: 1 }, desc: 'Bundle of arrows' },
  { out: 'cooked_meat',n: 1, cost: { berry: 2, wood: 1 }, desc: 'Cook over fire (need wood)' },
  { out: 'sword_up',   n: 1, cost: { wood: 5, stone: 8 }, desc: 'Strong Sword — double damage' },
  { out: 'heat_cloak', n: 1, cost: { wood: 4, stone: 10}, desc: 'Heat Cloak — survive Ashen Wastes' },
];

export function canCraft(inv, recipe) {
  for (const id in recipe.cost) {
    if (!inv.has(id, recipe.cost[id])) return false;
  }
  if (recipe.out === 'sword_up' && inv.has('sword_up')) return false;
  if (recipe.out === 'heat_cloak' && inv.has('heat_cloak')) return false;
  return true;
}

export function craft(inv, recipe) {
  if (!canCraft(inv, recipe)) return false;
  for (const id in recipe.cost) inv.remove(id, recipe.cost[id]);
  inv.add(recipe.out, recipe.n);
  return true;
}
