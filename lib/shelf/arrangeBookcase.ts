import { BOOKS, type BookId } from "@/content/portfolio";
import { BOOK_DESIGNS } from "@/lib/bookDesigns";

// Lays out the home page's bookcase: a long run of untitled books with the six
// titled ones scattered through it. The arrangement only looks random. It comes
// from a fixed seed, so the server and every visit render the same shelf.

export type FillerPattern = "banded" | "label" | "ribbed" | "plain" | "capped";

export interface FillerBook {
  readonly kind: "filler";
  /** Shelf units wide. */
  readonly width: number;
  /** Share of the row's height. */
  readonly height: number;
  readonly color: string;
  readonly pattern: FillerPattern;
  /** Degrees it leans against the next book, or 0 when it stands upright. */
  readonly lean: number;
}

export interface TitledBook {
  readonly kind: "titled";
  readonly bookId: BookId;
  readonly width: number;
  readonly height: number;
}

export interface LyingStack {
  readonly kind: "stack";
  readonly books: readonly { readonly width: number; readonly thickness: number; readonly color: string }[];
}

export interface Bookend {
  readonly kind: "bookend";
}

export type ShelfItem = FillerBook | TitledBook | LyingStack | Bookend;

const BOOKCASE_SEED = 20_261_015;
/** Far more books than any screen shows; the overflow wraps onto hidden rows. */
const SHELF_ITEM_COUNT = 170;
/**
 * The titled books stay within the first stretch of the run, so they always
 * land on a visible row even on the narrowest screen.
 */
const TITLED_RANGE = { first: 3, last: 72 } as const;
const STACK_CHANCE = 0.035;
const LEAN_CHANCE = 0.03;
const BOOKEND_CHANCE = 0.015;

// Muted leathers and cloths; a few lighter ones keep the run from reading as a wall.
const FILLER_COLORS = [
  "#5a1a26", "#3e0b16", "#2c3a2a", "#1f2c3f", "#4a3220", "#6e5124", "#7d6a48",
  "#23201d", "#5b2d1f", "#2f4045", "#8a7a5a", "#3a2a3e", "#a08c64", "#1a1410",
] as const;
const FILLER_PATTERNS: readonly FillerPattern[] = ["banded", "label", "ribbed", "plain", "capped"];

type Random = () => number;

// mulberry32: tiny, fast, and good enough to make a shelf look untidy.
function createRandom(seed: number): Random {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = state;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function pickBetween(random: Random, min: number, max: number): number {
  return Math.round((min + random() * (max - min)) * 100) / 100;
}

function pickFrom<Item>(random: Random, items: readonly Item[]): Item {
  const item = items[Math.floor(random() * items.length)];
  if (item === undefined) throw new Error("Cannot pick from an empty list");
  return item;
}

function shuffle<Item>(random: Random, items: readonly Item[]): Item[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(random() * (index + 1));
    const current = shuffled[index];
    const other = shuffled[swapIndex];
    if (current === undefined || other === undefined) continue;
    shuffled[index] = other;
    shuffled[swapIndex] = current;
  }
  return shuffled;
}

// One titled book per equal slice of the range, so they spread across rows
// instead of bunching together, in a shuffled order.
function placeTitledBooks(random: Random): Map<number, BookId> {
  const sliceLength = (TITLED_RANGE.last - TITLED_RANGE.first) / BOOKS.length;
  const order = shuffle(
    random,
    BOOKS.map((book) => book.id),
  );
  return new Map(
    order.map((bookId, slice) => {
      const sliceStart = TITLED_RANGE.first + slice * sliceLength;
      return [Math.round(sliceStart + 1 + random() * (sliceLength - 2)), bookId] as const;
    }),
  );
}

function createFiller(random: Random, previousColor: string | null, canLean: boolean): FillerBook {
  let color = pickFrom(random, FILLER_COLORS);
  while (color === previousColor) color = pickFrom(random, FILLER_COLORS);
  return {
    kind: "filler",
    width: pickBetween(random, 1.5, 3.2),
    height: pickBetween(random, 0.64, 0.95),
    color,
    pattern: pickFrom(random, FILLER_PATTERNS),
    lean: canLean && random() < LEAN_CHANCE ? pickBetween(random, 5, 9) : 0,
  };
}

function createStack(random: Random): LyingStack {
  const count = 2 + Math.floor(random() * 3);
  return {
    kind: "stack",
    books: Array.from({ length: count }, () => ({
      width: pickBetween(random, 5.2, 7.4),
      thickness: pickBetween(random, 0.9, 1.5),
      color: pickFrom(random, FILLER_COLORS),
    })),
  };
}

export function arrangeBookcase(): readonly ShelfItem[] {
  const random = createRandom(BOOKCASE_SEED);
  const titledPositions = placeTitledBooks(random);
  const items: ShelfItem[] = [];
  let previousColor: string | null = null;

  for (let index = 0; index < SHELF_ITEM_COUNT; index++) {
    const titledBookId = titledPositions.get(index);
    if (titledBookId) {
      const design = BOOK_DESIGNS[titledBookId];
      items.push({ kind: "titled", bookId: titledBookId, width: design.spineWidth, height: design.spineHeight / 100 });
      previousColor = null;
      continue;
    }
    // A leaning book needs an upright neighbour to rest on, never a titled one.
    const isNextToTitled = titledPositions.has(index + 1) || titledPositions.has(index - 1);
    const roll = random();
    if (!isNextToTitled && roll < STACK_CHANCE) {
      items.push(createStack(random));
    } else if (!isNextToTitled && roll < STACK_CHANCE + BOOKEND_CHANCE) {
      items.push({ kind: "bookend" });
    } else {
      const filler = createFiller(random, previousColor, !isNextToTitled);
      items.push(filler);
      previousColor = filler.color;
    }
  }
  return items;
}
