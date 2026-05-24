// Player. 8-directional movement, sword attack, bow, shield, survival stats.

import { Entity } from './Entity.js';
import { drawPlayer } from '../assets/sprites.js';
import { TILE_SIZE, T, prop } from '../world/tiles.js';
import { Debug } from '../core/Debug.js';
import { Stats } from '../mechanics/progression/Stats.js';
import { Equipment } from '../mechanics/Equipment.js';
import { Haptics } from '../core/Haptics.js';

const BASE_SPEED = 130;

export class Player extends Entity {
  constructor(x, y) {
    super(x, y, 16, 18);
    this.name = 'Hero';
    this.skin = 'blue';           // 'blue' | 'red' | 'green' | 'purple'
    this.stats = new Stats();
    this.equipment = new Equipment();
    // Stats object exposes a `defense` getter; we keep it in sync from equipment each frame.
    Object.defineProperty(this.stats, 'defense', {
      get: () => this.equipment.defenseTotal(),
      configurable: true,
    });
    this.maxHp = 6;               // 3 hearts (2 per heart); +2 per VIT
    this.hp = this.maxHp;
    this.hunger = 100;
    this.maxHunger = 100;
    this.stamina = 100;
    this.maxStamina = 100;

    this.attackT = 0;             // time remaining in swing
    this.attackCd = 0;             // cooldown
    this.bowCd = 0;
    this.shielding = false;
    this.dir = 'down';
    this.lastMoveDir = 'down';

    // Superpower flags — set when player picks up power tokens.
    this.powers = { dash: false, flame: false, shield: false };

    // Dash state (Spirit Dash power)
    this.dashT = 0;     // time remaining mid-dash
    this.dashCd = 0;
    this.dashDir = { x: 0, y: 0 };

    this.deathT = 0;
  }

  // Recompute derived stats — call when stats change (level-up or equip).
  recomputeDerived() {
    const baseMaxHp = 6 + this.stats.vit * 2;
    const ratio = this.hp / this.maxHp;
    this.maxHp = baseMaxHp;
    this.hp = Math.min(this.maxHp, Math.max(1, Math.round(this.maxHp * ratio)));
  }

  gainXp(amount, hud) {
    const r = this.stats.gainXp(amount);
    if (r.leveledUp > 0) {
      this.recomputeDerived();
      this.hp = this.maxHp;
      hud?.flashLevelUp?.(this.stats.level);
    }
    return r;
  }

  setPos(x, y) { this.x = x; this.y = y; this.vx = 0; this.vy = 0; }

  hearts() { return Math.ceil(this.hp / 2); }
  maxHearts() { return Math.ceil(this.maxHp / 2); }

  // Returns sword hitbox if attacking, else null.
  swordHitbox() {
    if (this.attackT <= 0) return null;
    const reach = 20;
    const w = 22, h = 22;
    let hx = this.x, hy = this.y;
    const d = this.dir;
    if (d.includes('up')) hy -= reach;
    if (d.includes('down')) hy += reach;
    if (d.includes('left')) hx -= reach;
    if (d.includes('right')) hx += reach;
    if (!d.includes('up') && !d.includes('down') && !d.includes('left') && !d.includes('right')) {
      // 'down' default
      hy += reach;
    }
    return { x: hx - w/2, y: hy - h/2, w, h };
  }

  update(dt, ctx) {
    this.updateTimers(dt);
    if (this.attackT > 0) this.attackT -= dt;
    if (this.attackCd > 0) this.attackCd -= dt;
    if (this.bowCd > 0) this.bowCd -= dt;
    if (this.dashT > 0) this.dashT -= dt;
    if (this.dashCd > 0) this.dashCd -= dt;

    if (this.dead) { this.deathT += dt; return; }

    const input = ctx.input;
    const mv = input.moveVector();

    // Speed modified by tile underfoot
    let speed = BASE_SPEED;
    let underTile = ctx.tilemap.get(Math.floor(this.x / TILE_SIZE), Math.floor(this.y / TILE_SIZE));
    let underProp = prop(underTile);
    if (underProp.slow) speed *= underProp.slow;
    if (this.stamina < 20) speed *= 0.75;
    if (this.shielding) speed *= 0.5;

    // Dash power: hold Shift to burst forward. Costs stamina, brief i-frames.
    if (input.wasPressed('dash') && this.powers?.dash && this.dashCd <= 0 && this.stamina >= 25) {
      const dir = this.lastMoveDir || 'down';
      let dx = 0, dy = 0;
      if (dir.includes('up')) dy = -1; else if (dir.includes('down')) dy = 1;
      if (dir.includes('left')) dx = -1; else if (dir.includes('right')) dx = 1;
      if (dx === 0 && dy === 0) dy = 1;
      if (dx !== 0 && dy !== 0) { dx *= Math.SQRT1_2; dy *= Math.SQRT1_2; }
      this.dashDir = { x: dx, y: dy };
      this.dashT = 0.22;
      this.dashCd = 0.6;
      this.stamina = Math.max(0, this.stamina - 25);
      this.invulnT = Math.max(this.invulnT, 0.22);
    }

    if (this.dashT > 0) {
      this.vx = this.dashDir.x * speed * 3;
      this.vy = this.dashDir.y * speed * 3;
    } else {
      this.vx = mv.x * speed;
      this.vy = mv.y * speed;
    }

    // Update facing from movement
    if (mv.x !== 0 || mv.y !== 0) {
      let d = '';
      if (mv.y < -0.2) d += 'up';
      if (mv.y > 0.2) d += 'down';
      if (mv.x < -0.2) d += 'left';
      if (mv.x > 0.2) d += 'right';
      this.lastMoveDir = d || this.lastMoveDir;
      if (this.attackT <= 0) this.dir = this.lastMoveDir;
    }

    // Shield
    this.shielding = input.isHeld('shield') && this.stamina > 0;
    if (this.shielding) {
      this.stamina = Math.max(0, this.stamina - 12 * dt);
    } else {
      this.stamina = Math.min(this.maxStamina, this.stamina + 18 * dt);
    }

    // Attack
    if (input.wasPressed('attack') && this.attackCd <= 0 && this.stamina >= 10) {
      this.attackT = 0.18;
      this.attackCd = 0.32;
      this.stamina = Math.max(0, this.stamina - 10);
      this.dir = this.lastMoveDir;
    }

    // Bow
    if (input.wasPressed('bow') && this.bowCd <= 0 && ctx.inventory.has('arrow') && this.stamina >= 8) {
      this.bowCd = 0.45;
      this.stamina = Math.max(0, this.stamina - 8);
      ctx.inventory.remove('arrow', 1);
      ctx.scene.spawnProjectile?.(this.x, this.y, this.lastMoveDir, 'arrow', 'player');
    }

    this.moveAndCollide(dt, ctx.tilemap);

    // Lava damage
    underTile = ctx.tilemap.get(Math.floor(this.x / TILE_SIZE), Math.floor(this.y / TILE_SIZE));
    underProp = prop(underTile);
    if (underProp.dmg && !Debug.god) {
      this.damage(underProp.dmg * dt, 0, 0, 0);
    }
  }

  damage(amount, kx, ky, force) {
    if (Debug.god) return false;
    if (this.shielding && (this.dir.includes('left') && kx > 0 ||
        this.dir.includes('right') && kx < 0 ||
        this.dir.includes('up') && ky > 0 ||
        this.dir.includes('down') && ky < 0)) {
      // Tank with stamina cost — facing the attack
      if (this.stamina >= 15) {
        this.stamina -= 15;
        this.invulnT = 0.3;
        return false;
      }
    }
    const took = super.damage(amount, kx, ky, force);
    if (took) {
      if (this.dead) Haptics.death(); else Haptics.damage();
    }
    return took;
  }

  draw(ctx, off) {
    if (this.dead) {
      // simple fade to black
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - this.deathT);
      drawPlayer(ctx, this.x - off.x, this.y - off.y, this.dir, false, true, this.skin);
      ctx.restore();
      return;
    }
    // i-frame blink
    if (this.invulnT > 0 && Math.floor(this.invulnT * 24) % 2 === 0) return;
    drawPlayer(ctx, this.x - off.x, this.y - off.y, this.dir, this.attackT > 0, this.hurtT > 0, this.skin);

    // Shield indicator
    if (this.shielding) {
      ctx.save();
      ctx.fillStyle = 'rgba(120,180,255,0.4)';
      const sx = this.x - off.x, sy = this.y - off.y;
      let ox = 0, oy = 0;
      if (this.dir.includes('up')) oy -= 12;
      if (this.dir.includes('down')) oy += 12;
      if (this.dir.includes('left')) ox -= 12;
      if (this.dir.includes('right')) ox += 12;
      if (ox === 0 && oy === 0) oy = 12;
      ctx.beginPath(); ctx.arc(sx + ox, sy + oy, 8, 0, Math.PI*2); ctx.fill();
      ctx.restore();
    }

    if (Debug.enabled) {
      const hb = this.hitbox();
      ctx.strokeStyle = '#0f0'; ctx.lineWidth = 1;
      ctx.strokeRect(hb.x - off.x, hb.y - off.y, hb.w, hb.h);
      const sw = this.swordHitbox();
      if (sw) {
        ctx.strokeStyle = '#ff0';
        ctx.strokeRect(sw.x - off.x, sw.y - off.y, sw.w, sw.h);
      }
    }
  }
}
