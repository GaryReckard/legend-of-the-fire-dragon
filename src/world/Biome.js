// Per-biome metadata: name, ambient color, env effect on player.
import { T } from './tiles.js';

export const BIOMES = {
  forest: {
    name: 'Greenwood',
    ambient: '#0e1a0e',
    base: T.GRASS,
    decor: [{ tile: T.TREE, w: 0.10 }, { tile: T.BUSH, w: 0.05 }, { tile: T.FLOWER, w: 0.04 }, { tile: T.ROCK, w: 0.02 }],
    spawn: 'slime',
  },
  swamp: {
    name: 'Mistmarsh',
    ambient: '#1a201a',
    base: T.MUD,
    decor: [{ tile: T.SWAMP_TREE, w: 0.10 }, { tile: T.REEDS, w: 0.06 }, { tile: T.BOG_WATER, w: 0.05 }],
    spawn: 'bogwraith',
  },
  tundra: {
    name: 'Frozen Reach',
    ambient: '#1a2a36',
    base: T.SNOW,
    decor: [{ tile: T.PINE, w: 0.08 }, { tile: T.FROZEN_ROCK, w: 0.04 }, { tile: T.ICE, w: 0.06 }],
    spawn: 'iceskeleton',
  },
  volcano: {
    name: 'Ashen Wastes',
    ambient: '#2a1010',
    base: T.ASH,
    decor: [{ tile: T.CHARRED_TREE, w: 0.06 }, { tile: T.VOLCANIC_ROCK, w: 0.05 }, { tile: T.LAVA, w: 0.04 }],
    spawn: 'fireimp',
  },
};

// Given a tile id, return biome key
export function biomeOf(tileId) {
  if (tileId >= 40 && tileId < 60) return 'volcano';
  if (tileId >= 35 && tileId < 40) return 'swamp';
  if (tileId >= 20 && tileId < 35) return 'tundra';
  if (tileId >= 1 && tileId < 20) return 'forest';
  return 'forest';
}
