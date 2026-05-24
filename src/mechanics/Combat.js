// Combat helpers — pure functions called by scenes.

import { rectsOverlap } from '../entities/Entity.js';

export function knockbackDir(attackerX, attackerY, target) {
  const dx = target.x - attackerX;
  const dy = target.y - attackerY;
  const m = Math.hypot(dx, dy) || 1;
  return { x: dx / m, y: dy / m };
}

// Apply sword hits from player to enemies. Returns list of enemies hit this frame.
export function applySwordHits(playerSwordHb, player, enemies) {
  if (!playerSwordHb) return [];
  const hits = [];
  for (const e of enemies) {
    if (e.dead || e.invulnT > 0) continue;
    if (rectsOverlap(playerSwordHb, e.hitbox())) {
      const k = knockbackDir(player.x, player.y, e);
      if (e.damage(1, k.x, k.y, 260)) hits.push(e);
    }
  }
  return hits;
}

// Apply enemy contact damage to player. Touch-based.
export function applyEnemyTouch(player, enemies, baseDmg = 1) {
  if (player.dead || player.invulnT > 0) return false;
  const phb = player.hitbox();
  for (const e of enemies) {
    if (e.dead) continue;
    if (rectsOverlap(phb, e.hitbox())) {
      const k = knockbackDir(e.x, e.y, player);
      const dmg = e.touchDmg ?? baseDmg;
      return player.damage(dmg, k.x, k.y, 240);
    }
  }
  return false;
}
