// Combat helpers — pure functions called by scenes.

import { rectsOverlap } from '../entities/Entity.js';
import { swordDamage, applyDefense } from './Damage.js';

export function knockbackDir(attackerX, attackerY, target) {
  const dx = target.x - attackerX;
  const dy = target.y - attackerY;
  const m = Math.hypot(dx, dy) || 1;
  return { x: dx / m, y: dy / m };
}

// Apply sword hits from player to enemies. Returns list of enemies hit this frame.
// Damage value now comes from Damage.swordDamage so Strong Sword + STR actually matter.
export function applySwordHits(playerSwordHb, player, enemies, inventory) {
  if (!playerSwordHb) return [];
  const dmg = swordDamage(inventory, player.stats);
  const hits = [];
  for (const e of enemies) {
    if (e.dead || e.invulnT > 0 || e.friendly) continue;
    if (rectsOverlap(playerSwordHb, e.hitbox())) {
      const k = knockbackDir(player.x, player.y, e);
      if (e.damage(dmg, k.x, k.y, 260)) hits.push(e);
    }
  }
  return hits;
}

// Apply enemy contact damage to player. Touch-based.
// Player defense now reduces incoming damage (min 1).
// NPCs and other non-combatants must set `friendly = true` to opt out.
export function applyEnemyTouch(player, enemies, baseDmg = 1) {
  if (player.dead || player.invulnT > 0) return false;
  const phb = player.hitbox();
  for (const e of enemies) {
    if (e.dead || e.friendly) continue;
    if (rectsOverlap(phb, e.hitbox())) {
      const k = knockbackDir(e.x, e.y, player);
      const raw = e.touchDmg ?? baseDmg;
      const dmg = applyDefense(raw, player.stats);
      return player.damage(dmg, k.x, k.y, 240);
    }
  }
  return false;
}
