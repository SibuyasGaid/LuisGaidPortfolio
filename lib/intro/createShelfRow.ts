export type BookTone = "burgundy" | "burgundy-deep" | "burgundy-light" | "walnut" | "umber" | "ink" | "ochre" | "cream";

export interface ShelfBook {
  /** Spines are sized in viewport-height units so the whole shelf scales with the screen. */
  readonly widthVh: number;
  readonly heightPercent: number;
  readonly tone: BookTone;
  readonly hasGiltBands: boolean;
}

// Weighted towards the brand's burgundy and wood tones, with a few cream and
// ochre spines so the shelf doesn't read as one solid block.
const TONES: readonly BookTone[] = [
  "burgundy", "burgundy-deep", "walnut", "umber", "ink", "burgundy",
  "walnut", "burgundy-light", "umber", "ochre", "ink", "cream",
];

/** mulberry32: a tiny seeded generator, so the same shelf renders on every visit. */
function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function createShelfRow(seed: number, bookCount: number): ShelfBook[] {
  const random = createSeededRandom(seed);
  return Array.from({ length: bookCount }, () => ({
    widthVh: roundTo(2 + random() * 2.4, 2),
    heightPercent: Math.round(66 + random() * 28),
    tone: TONES[Math.floor(random() * TONES.length)] ?? "walnut",
    hasGiltBands: random() > 0.45,
  }));
}
