// Single source of truth for player damage calculations.
// Centralized so combat sites don't hard-code numbers and so it's unit-testable.

// Sword damage: base 1, +1 with Strong Sword, +10% per STR.
export function swordDamage(inventory, stats) {
  let base = 1;
  if (inventory?.has?.('sword_up')) base = 2;
  if (inventory?.has?.('sword_legendary')) base = 4;
  const strBonus = 1 + ((stats?.str ?? 0) * 0.10);
  return Math.floor(base * strBonus);
}

// Bow damage: base 1, +1 with Composite Bow, +10% per DEX.
export function bowDamage(inventory, stats) {
  let base = 1;
  if (inventory?.has?.('bow_up')) base = 2;
  const dexBonus = 1 + ((stats?.dex ?? 0) * 0.10);
  return Math.floor(base * dexBonus);
}

// Defense from armor. Each armor piece has a `defense` number; we sum them.
// Damage taken = max(1, incoming - defense)  — never reduce to 0 by armor alone.
export function applyDefense(incoming, stats) {
  const def = stats?.defense ?? 0;
  return Math.max(1, incoming - def);
}
