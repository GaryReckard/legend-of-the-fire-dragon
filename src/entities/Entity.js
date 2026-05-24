// Base entity class. Position, velocity, hitbox, hp, optional sprite tag.

export class Entity {
  constructor(x, y, w = 20, h = 20) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.w = w;
    this.h = h;
    this.hp = 1;
    this.maxHp = 1;
    this.dead = false;
    this.dir = 'down';
    this.hurtT = 0;
    this.invulnT = 0;
    this.knockX = 0;
    this.knockY = 0;
  }

  hitbox() {
    return { x: this.x - this.w/2, y: this.y - this.h/2, w: this.w, h: this.h };
  }

  damage(amount, kx = 0, ky = 0, force = 220) {
    if (this.invulnT > 0 || this.dead) return false;
    this.hp -= amount;
    this.hurtT = 0.18;
    this.invulnT = 0.4;
    this.knockX = kx * force;
    this.knockY = ky * force;
    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
    }
    return true;
  }

  // Apply velocity + knockback against a tilemap, axis-separated so we slide along walls.
  moveAndCollide(dt, tilemap) {
    this.knockX *= 0.85;
    this.knockY *= 0.85;
    if (Math.abs(this.knockX) < 1) this.knockX = 0;
    if (Math.abs(this.knockY) < 1) this.knockY = 0;

    let dx = (this.vx + this.knockX) * dt;
    let dy = (this.vy + this.knockY) * dt;

    // X axis
    if (dx !== 0) {
      const nx = this.x + dx;
      const hb = { x: nx - this.w/2, y: this.y - this.h/2, w: this.w, h: this.h };
      if (!tilemap.rectCollides(hb.x, hb.y, hb.w, hb.h)) this.x = nx;
      else {
        // Try smaller step
        const small = Math.sign(dx) * Math.min(Math.abs(dx), 1);
        const hb2 = { x: this.x + small - this.w/2, y: this.y - this.h/2, w: this.w, h: this.h };
        if (!tilemap.rectCollides(hb2.x, hb2.y, hb2.w, hb2.h)) this.x += small;
      }
    }
    // Y axis
    if (dy !== 0) {
      const ny = this.y + dy;
      const hb = { x: this.x - this.w/2, y: ny - this.h/2, w: this.w, h: this.h };
      if (!tilemap.rectCollides(hb.x, hb.y, hb.w, hb.h)) this.y = ny;
      else {
        const small = Math.sign(dy) * Math.min(Math.abs(dy), 1);
        const hb2 = { x: this.x - this.w/2, y: this.y + small - this.h/2, w: this.w, h: this.h };
        if (!tilemap.rectCollides(hb2.x, hb2.y, hb2.w, hb2.h)) this.y += small;
      }
    }
  }

  updateTimers(dt) {
    if (this.hurtT > 0) this.hurtT = Math.max(0, this.hurtT - dt);
    if (this.invulnT > 0) this.invulnT = Math.max(0, this.invulnT - dt);
  }
}

// AABB overlap
export function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
