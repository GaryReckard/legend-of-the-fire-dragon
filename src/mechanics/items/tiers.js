// Tool/weapon/armor tier system. Each tier has a damage/defense multiplier
// applied on top of the item's base stat.

export const TIERS = {
  wood:    { mult: 1.0,  color: '#7a5230', name: 'Wood' },
  stone:   { mult: 1.5,  color: '#7d7d8a', name: 'Stone' },
  iron:    { mult: 2.25, color: '#c8c8d0', name: 'Iron' },
  gold:    { mult: 3.0,  color: '#ffd700', name: 'Gold' },
  dragon:  { mult: 4.0,  color: '#ff3322', name: 'Dragon' }, // post-game crafting
};

export function tierMultiplier(tier) {
  return TIERS[tier]?.mult ?? 1;
}
