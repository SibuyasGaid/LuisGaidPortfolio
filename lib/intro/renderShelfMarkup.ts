import { BOOK_COVER } from "@/content/portfolio";
import { createShelfRow, type ShelfBook } from "@/lib/intro/createShelfRow";

/** Enough spines that the shelf still reaches the right edge after the camera pans on wide screens. */
const BOOKS_PER_ROW = 80;
/** The PORTFOLIO spine sits this far along the middle shelf, so the camera has a real distance to pan. */
const HERO_BOOK_INDEX = 46;
const ROW_SEEDS = [11, 23, 37] as const;

function renderSpine(book: ShelfBook): string {
  const gilt = book.hasGiltBands ? " data-gilt" : "";
  return `<span class="intro-spine" data-tone="${book.tone}"${gilt} style="width:${book.widthVh}vh;height:${book.heightPercent}%"></span>`;
}

const HERO_SPINE_MARKUP = `<span data-intro-hero-spine class="intro-hero-spine"><span class="intro-hero-spine-title">${BOOK_COVER.spineTitle}</span></span>`;

function renderRow(seed: number, rowIndex: number): string {
  const books = createShelfRow(seed, BOOKS_PER_ROW);
  const spines = books.map((book, bookIndex) =>
    rowIndex === 1 && bookIndex === HERO_BOOK_INDEX ? HERO_SPINE_MARKUP : renderSpine(book),
  );
  return `<div class="intro-shelf-row" data-row="${rowIndex}">${spines.join("")}</div>`;
}

// The shelf is a few hundred purely decorative spans. Handing it to React as
// one static HTML string means hydration treats it as a single node instead of
// walking every spine, which kept the intro from blocking the main thread.
// Every value interpolated here is a number, a fixed tone name or the spine title from the content file.
export const SHELF_MARKUP = ROW_SEEDS.map(renderRow).join("");
