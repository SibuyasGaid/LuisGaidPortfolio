// A fixed seed makes "random" layouts repeatable: the server, the browser and
// every visit build the same shelf.

export type Random = () => number;

/** mulberry32: tiny, fast, and good enough to make a shelf look untidy. */
export function createSeededRandom(seed: number): Random {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = state;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4_294_967_296;
  };
}

export function pickBetween(random: Random, min: number, max: number): number {
  return min + random() * (max - min);
}

export function pickFrom<Item>(random: Random, items: readonly Item[]): Item {
  const item = items[Math.floor(random() * items.length)];
  if (item === undefined) throw new Error("Cannot pick from an empty list");
  return item;
}
