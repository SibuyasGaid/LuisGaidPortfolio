import type { BookId } from "@/content/portfolio";

// How the navbar reaches the bookcase. While the home page shows a bookcase
// (the WebGL library or the flat one), it registers a picker here: naming a
// book in the navbar previews it on the shelf, and choosing one takes it off
// the shelf before its page loads. Anywhere else the navbar's links simply
// navigate.

export interface BookPicker {
  /** Shows where a book is on the shelf, or stops showing with null. */
  preview(bookId: BookId | null): void;
  /** Takes the book off the shelf, then loads its page. */
  pick(bookId: BookId, href: string): void;
}

/** The WebGL library outranks the flat bookcase, which stays registered underneath as its fallback. */
export type BookPickerRank = "flat" | "scene";

const RANK_ORDER: Record<BookPickerRank, number> = { flat: 1, scene: 2 };
const pickers = new Map<BookPicker, BookPickerRank>();

export function setBookPicker(picker: BookPicker, rank: BookPickerRank): () => void {
  pickers.set(picker, rank);
  return () => {
    pickers.delete(picker);
  };
}

export function getBookPicker(): BookPicker | null {
  let best: BookPicker | null = null;
  let bestRank = 0;
  for (const [picker, rank] of pickers) {
    if (RANK_ORDER[rank] > bestRank) {
      best = picker;
      bestRank = RANK_ORDER[rank];
    }
  }
  return best;
}
