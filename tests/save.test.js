import { describe, it, expect, beforeEach } from 'vitest';
import { saveGame, loadGame, hasSave, clearSave, SAVE_KEY } from '../src/core/Save.js';
import { Player } from '../src/entities/Player.js';
import { Inventory } from '../src/mechanics/Inventory.js';

function makeGame() {
  // happy-dom gives us localStorage. Build a minimal "game" shape Save expects.
  const game = {
    player: new Player(100, 100),
    inventory: new Inventory(),
    flags: { foo: true, defeatedBoss: false },
  };
  game.player.name = 'Darwin';
  game.player.skin = 'green';
  game.player.stats.gainXp(150);     // → level 3, 6 unspent
  game.player.stats.spendPoint('str');
  game.player.equipment.equip('helm_iron'); // expects we add it to inv? helm catalog defines it
  game.inventory.add('wood', 17);
  game.inventory.add('helm_iron', 1);
  return game;
}

describe('Save', () => {
  beforeEach(() => { localStorage.removeItem(SAVE_KEY); });

  it('hasSave false when nothing stored', () => {
    expect(hasSave()).toBe(false);
  });

  it('round-trips player name, skin, stats, inventory, flags', () => {
    const g = makeGame();
    saveGame(g);
    expect(hasSave()).toBe(true);

    const fresh = {
      player: new Player(0, 0),
      inventory: new Inventory(),
      flags: {},
    };
    const ok = loadGame(fresh);
    expect(ok).toBe(true);
    expect(fresh.player.name).toBe('Darwin');
    expect(fresh.player.skin).toBe('green');
    expect(fresh.player.stats.level).toBe(3);
    expect(fresh.player.stats.str).toBe(1);
    expect(fresh.inventory.count('wood')).toBe(17);
    expect(fresh.flags.foo).toBe(true);
  });

  it('clearSave deletes the slot', () => {
    saveGame(makeGame());
    expect(hasSave()).toBe(true);
    clearSave();
    expect(hasSave()).toBe(false);
  });

  it('loadGame returns false when no save exists', () => {
    const fresh = { player: new Player(0,0), inventory: new Inventory(), flags: {} };
    expect(loadGame(fresh)).toBe(false);
  });
});
