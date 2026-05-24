// Multi-phase Fire Dragon boss.
// Cycles attacks while flying overhead, lowers head to roar (vulnerable window).
// Phases by HP threshold; later phases speed up + add overlapping attacks.

import { Entity, rectsOverlap } from './Entity.js';
import { drawFireDragon } from '../assets/sprites.js';
import { Debug } from '../core/Debug.js';

const ARENA = { x: 64, y: 64, w: 672, h: 472 }; // pixels within boss canvas

export class FireDragon extends Entity {
  constructor(x, y) {
    super(x, y, 130, 60);
    this.maxHp = 18;
    this.hp = 18;
    this.t = 0;
    this.phase = 1;             // 1, 2, 3
    this.mode = 'fly';          // 'fly' | 'breath' | 'rocks' | 'expose'
    this.modeT = 0;
    this.targetX = x; this.targetY = y - 60;
    this.fireTiles = [];        // active fire damage zones
    this.rockMarkers = [];      // {x,y,t,impact}
    this.cool = 0;
    this.dead = false;
    this.deathT = 0;
    this.attacksSinceExpose = 0;  // pity timer to guarantee periodic vulnerability
  }

  // Override hitbox for the head/weakpoint area
  weakPointHb() {
    // Head is at (this.x - 60, this.y - 10)
    return { x: this.x - 90, y: this.y - 28, w: 50, h: 36 };
  }

  damage(amount, kx, ky, force) {
    if (this.invulnT > 0 || this.dead) return false;
    if (this.mode !== 'expose') return false; // only vulnerable when exposed
    this.hp -= amount;
    this.hurtT = 0.18;
    this.invulnT = 0.4;
    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
    }
    // Update phases by hp threshold
    if (this.hp <= this.maxHp * 0.33 && this.phase < 3) this.phase = 3;
    else if (this.hp <= this.maxHp * 0.66 && this.phase < 2) this.phase = 2;
    return true;
  }

  pickMode() {
    // Pity timer: after 3 non-expose modes in a row, guarantee the next one is expose.
    // Without this the player could be RNG-locked out of the entire damage window.
    if (this.attacksSinceExpose >= 3) return 'expose';

    const r = Math.random();
    if (this.phase === 1) {
      // ~20% expose so the fight is actually winnable from the start
      if (r < 0.40) return 'breath';
      if (r < 0.80) return 'rocks';
      return 'expose';
    }
    if (this.phase === 2) {
      if (r < 0.35) return 'breath';
      if (r < 0.65) return 'rocks';
      return 'expose';
    }
    // Phase 3 — most aggressive, expose roughly every other attack
    if (r < 0.25) return 'breath';
    if (r < 0.50) return 'rocks';
    return 'expose';
  }

  enterMode(name) {
    this.mode = name;
    this.modeT = 0;
    if (name === 'expose') this.attacksSinceExpose = 0;
    else if (name !== 'fly') this.attacksSinceExpose += 1;
    if (name === 'breath') {
      // Aim a fan of fire toward the player's CURRENT y row.
      this.breathStarted = false;
    } else if (name === 'rocks') {
      this.spawnRocks();
    } else if (name === 'expose') {
      // Lower head to player level — vulnerable
      this.targetX = this.x;
      this.targetY = ARENA.y + ARENA.h - 130;
    } else if (name === 'fly') {
      this.targetX = ARENA.x + 160 + Math.random() * (ARENA.w - 360);
      this.targetY = ARENA.y + 60 + Math.random() * 60;
    }
  }

  spawnRocks() {
    const count = this.phase === 3 ? 8 : (this.phase === 2 ? 6 : 4);
    for (let i = 0; i < count; i++) {
      const x = ARENA.x + 60 + Math.random() * (ARENA.w - 120);
      const y = ARENA.y + 80 + Math.random() * (ARENA.h - 160);
      this.rockMarkers.push({ x, y, t: 1.2, impact: false });
    }
  }

  emitFireLine(scene) {
    // Lay a horizontal line of fire tiles across the arena at the dragon's head y.
    const y = this.y + 4;
    const w = ARENA.w - 40;
    const x0 = ARENA.x + 20;
    scene.fireZones.push({ x: x0, y: y - 12, w, h: 24, life: this.phase === 3 ? 2.2 : 1.6 });
  }

  update(dt, ctx) {
    this.updateTimers(dt);
    this.t += dt;
    if (this.dead) { this.deathT += dt; return; }
    this.modeT += dt;
    const speed = 90 + this.phase * 20;

    // Soft move toward target
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const m = Math.hypot(dx, dy) || 1;
    if (m > 8) {
      this.x += (dx / m) * speed * dt;
      this.y += (dy / m) * speed * dt;
    }

    // Tick rock markers
    for (const r of this.rockMarkers) {
      r.t -= dt;
      if (r.t <= 0 && !r.impact) {
        r.impact = true;
        r.t = 0.4;
        // Damage if player in radius at impact
        if (!ctx.player.dead && Math.hypot(ctx.player.x - r.x, ctx.player.y - r.y) < 28 && !Debug.god) {
          ctx.player.damage(2, (ctx.player.x - r.x)/28, (ctx.player.y - r.y)/28, 200);
        }
        ctx.scene.spawnHitPuff(r.x, r.y, '#ff7733');
        ctx.scene.cameraShake?.(0.2, 5);
      }
    }
    this.rockMarkers = this.rockMarkers.filter(r => r.t > 0 || r.impact && r.t > -0.5);
    this.rockMarkers = this.rockMarkers.filter(r => r.t > -0.5);

    // Phase machine
    switch (this.mode) {
      case 'fly': {
        if (this.modeT > 1.2 + Math.random() * 0.6) this.enterMode(this.pickMode());
        break;
      }
      case 'breath': {
        // 0.6s wind-up then emit and stay for 0.6s
        if (this.modeT > 0.6 && !this.breathStarted) {
          this.breathStarted = true;
          this.emitFireLine(ctx.scene);
        }
        if (this.modeT > 1.4) this.enterMode('fly');
        break;
      }
      case 'rocks': {
        if (this.modeT > 1.6) this.enterMode('fly');
        break;
      }
      case 'expose': {
        // Stay vulnerable for short window
        const dur = this.phase === 3 ? 1.8 : 1.4;
        if (this.modeT > dur) {
          this.enterMode('fly');
        }
        break;
      }
    }
  }

  draw(ctx, off) {
    if (this.dead) {
      ctx.save();
      const a = Math.max(0, 1 - this.deathT / 2);
      ctx.globalAlpha = a;
      const wob = Math.sin(this.deathT * 12) * 6;
      drawFireDragon(ctx, this.x - off.x + wob, this.y - off.y, this.t, this.phase, true);
      ctx.restore();
      return;
    }
    drawFireDragon(ctx, this.x - off.x, this.y - off.y, this.t, this.mode === 'expose' ? 'expose' : this.phase, this.hurtT > 0);
    // Rock shadows
    for (const r of this.rockMarkers) {
      const sx = r.x - off.x, sy = r.y - off.y;
      if (!r.impact) {
        const k = Math.max(0.25, 1 - r.t / 1.2);
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.arc(sx, sy, 14 + 6 * k, 0, Math.PI*2);
        ctx.fill();
        ctx.strokeStyle = '#ffaa33'; ctx.lineWidth = 2;
        ctx.stroke();
        // Falling rock above
        const ry = sy - 200 + (200 * (1.2 - r.t) / 1.2);
        ctx.fillStyle = '#4a3030';
        ctx.beginPath(); ctx.arc(sx, ry, 10, 0, Math.PI*2); ctx.fill();
        ctx.restore();
      } else {
        ctx.save();
        ctx.fillStyle = `rgba(255, 120, 40, ${Math.max(0, r.t / 0.4)})`;
        ctx.beginPath(); ctx.arc(sx, sy, 22, 0, Math.PI*2); ctx.fill();
        ctx.restore();
      }
    }
    // Weak point debug
    if (Debug.enabled) {
      const hb = this.weakPointHb();
      ctx.strokeStyle = this.mode === 'expose' ? '#0f0' : '#f80';
      ctx.lineWidth = 2;
      ctx.strokeRect(hb.x - off.x, hb.y - off.y, hb.w, hb.h);
    }
  }
}

export const BOSS_ARENA = ARENA;
