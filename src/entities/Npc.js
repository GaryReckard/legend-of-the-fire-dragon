// NPC entity. Has a name, a sprite color, and a dialog tree.
// The OverworldScene checks for facing-NPC and triggers dialog via [E].

import { Entity } from './Entity.js';
import { Debug } from '../core/Debug.js';

export class Npc extends Entity {
  constructor(x, y, def) {
    super(x, y, 18, 22);
    this.def = def;          // { id, name, color, hairColor, dialog: [...], backstory }
    this.bob = Math.random() * 6.28;
    this.t = 0;
    this.hp = 999;            // invulnerable
    this.maxHp = 999;
    this.friendly = true;     // combat code skips friendlies
    this.touchDmg = 0;        // defensive — even if friendly check is missed
  }

  // Stub — NPCs don't act on the world.
  update(dt, _ctx) { this.t += dt; }

  // NPCs never take damage.
  damage() { return false; }

  draw(ctx, off) {
    const sx = this.x - off.x;
    const sy = this.y - off.y + Math.sin(this.t * 2 + this.bob) * 1.5;
    const w = 20, h = 22;
    const px = sx - w/2, py = sy - h/2;
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse(sx, py + h + 1, 8, 3, 0, 0, Math.PI*2); ctx.fill();
    // body
    ctx.fillStyle = this.def.color;
    ctx.fillRect(px, py + 8, w, h - 10);
    // head
    ctx.fillStyle = '#f0c898';
    ctx.fillRect(px + 4, py, w - 8, 9);
    // hair
    ctx.fillStyle = this.def.hairColor || '#5a3a1a';
    ctx.fillRect(px + 4, py, w - 8, 3);
    // eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(px + 6, py + 4, 2, 2);
    ctx.fillRect(px + w - 8, py + 4, 2, 2);
    // "!" indicator floating above
    ctx.fillStyle = '#ffe066';
    ctx.font = 'bold 14px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('!', sx, py - 4);
    // Name label below
    ctx.fillStyle = '#fff';
    ctx.font = '10px "Courier New", monospace';
    ctx.fillText(this.def.name, sx, py + h + 14);
    if (Debug.enabled) {
      const hb = this.hitbox();
      ctx.strokeStyle = '#0ff';
      ctx.lineWidth = 1;
      ctx.strokeRect(hb.x - off.x, hb.y - off.y, hb.w, hb.h);
    }
  }
}

// Greenhaven village — 3 NPCs in the spawn forest.
// Each has a backstory + dialog tree. Dialog is just an array of lines for now;
// extend to branching later by replacing with a graph + choice keys.
export const GREENHAVEN_NPCS = [
  {
    id: 'mira',
    name: 'Mira the Herbalist',
    color: '#3a7a4a',
    hairColor: '#8a4a1a',
    backstory: 'Lost her brother to a dragon raid years ago; now grows healing herbs at the village edge.',
    dialog: [
      "Mira: Oh — a traveler! You smell of soot and old grass.",
      "Mira: My brother walked south once, chasing the dragon. He didn't come back.",
      "Mira: Take a berry from my garden. The Mistmarsh ahead drains the body — eat as you go.",
      "Mira: And if you find a book in the marsh's heart... bring it to me. I want to know what he wrote.",
    ],
    onTalk: (game) => {
      if (!game.flags.miraGift) {
        game.inventory.add('berry', 5);
        game.flags.miraGift = true;
        return 'Mira gave you 5 berries.';
      }
      return null;
    },
  },
  {
    id: 'oren',
    name: 'Oren the Smith',
    color: '#7a4a2a',
    hairColor: '#1a1a1a',
    backstory: 'A retired armorer who lost his forge in the burning. Teaches young hands how to swing without dying.',
    dialog: [
      "Oren: HRMPH. So you're the new one. Don't get yourself killed.",
      "Oren: Iron ore lies past the mud — but you'll need a stone pickaxe first, eh? Craft one.",
      "Oren: Smelt 2 iron ore + 1 wood to get an ingot. Three ingots get you a real pickaxe.",
      "Oren: And listen — shield with L when their swords come down. Even a coward outlives a hero who forgets.",
    ],
  },
  {
    id: 'lila',
    name: 'Lila the Scribe',
    color: '#7a4a8a',
    hairColor: '#fff066',
    backstory: 'A young scholar obsessed with the old gods of the Grove. Believes a Spirit still walks the misty parts of the forest.',
    dialog: [
      "Lila: You hear it too, don't you? The hum in the trees?",
      "Lila: The Spirit of the Grove is real. I've found three of its shrines.",
      "Lila: They say it tests those worthy of its gift — a power older than fire.",
      "Lila: Look for a clearing where the trees stand in a circle. That's where it speaks.",
    ],
  },
];
