// Hidden lore books scattered across the world. Each is a tile of type LORE_BOOK
// that the player walks onto to pick up; the dialog system displays the text.

export const LORE_BOOKS = {
  book_genesis: {
    title: 'On the Burning',
    body: [
      "Lost Journal — found beneath a charred pine.",
      "\"...the sky split, and the Dragon came down. We thought it slept beneath the mountain, but the burning had woken it...\"",
      "\"...three of us escaped into the bog. Tomas didn't. Even the mud burned.\"",
      "(The last page is torn out.)",
    ],
  },
  book_dragons: {
    title: "A Hunter's Log",
    body: [
      "Hunter's Tally, year unknown.",
      "\"Fire breath is only half of it. The beast SUMMONS rocks from the crater walls. Watch the shadows on the stone.\"",
      "\"Strike when it drops to feed. Anywhere else and your blade will only scorch.\"",
      "\"Three of us went in. I am writing this from outside.\"",
    ],
  },
  book_spirits: {
    title: 'The Grove Spirit',
    body: [
      "Lila's translation of a stone tablet.",
      "\"In the heart of the Greenwood, where seven trees stand as one, the Spirit waits.\"",
      "\"It tests with riddles of motion, and grants the gift of the Wind to those who pass.\"",
      "\"With this gift, you may cross what cannot be crossed.\"",
    ],
  },
};

// Placement plan: 3 books distributed across the world.
// (tx, ty) relative to map dimensions. Caller maps biome coords.
export function placeLoreBooks(map, gen, TILE_SIZE, T) {
  // book_genesis — burning ground of volcano, near east edge
  const v = gen.waypoints.volcano;
  placeAt(map, Math.floor(v.x / TILE_SIZE) + 6, Math.floor(v.y / TILE_SIZE) - 4, T.LORE_BOOK);
  // book_dragons — in the dungeon-approach pad (north of stairs)
  placeAt(map, Math.floor(gen.dungeonEntrance.tx) - 1, Math.floor(gen.dungeonEntrance.ty) - 2, T.LORE_BOOK);
  // book_spirits — swamp middle
  const s = gen.waypoints.swamp;
  placeAt(map, Math.floor(s.x / TILE_SIZE) + 5, Math.floor(s.y / TILE_SIZE), T.LORE_BOOK);
}

function placeAt(map, tx, ty, T_ID) {
  // Carve walkable around to ensure reachable
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      // Don't overwrite if it's already walkable — just nudge non-walkable next to the book
      const t = map.get(tx + dx, ty + dy);
      // Leave existing tiles; just place the book on top
    }
  }
  map.set(tx, ty, T_ID);
}

// Map a tile position to the book id placed there. For now, use a fixed ordering: any LORE_BOOK
// tile gives whichever book hasn't been read yet, in this order.
export const BOOK_ORDER = ['book_genesis', 'book_dragons', 'book_spirits'];
