import type { BookId } from "@/content/portfolio";

/**
 * spread: two pages, the opener on the left and the content on the right.
 * folio: one wide page with the opener across the top, for gallery-like books.
 */
export type BookFormat = "spread" | "folio";

export interface BookDesign {
  readonly format: BookFormat;
  /** Spine width on the shelf, in shelf units (one rem on a desktop screen). */
  readonly spineWidth: number;
  /** Spine height as a share of the shelf's row, so the books stand at different heights. */
  readonly spineHeight: number;
}

// Colours live in CSS under [data-book]; this holds the structural choices.
export const BOOK_DESIGNS: Record<BookId, BookDesign> = {
  about: { format: "spread", spineWidth: 4.4, spineHeight: 90 },
  work: { format: "folio", spineWidth: 5.8, spineHeight: 97 },
  services: { format: "spread", spineWidth: 4.6, spineHeight: 88 },
  stack: { format: "folio", spineWidth: 4, spineHeight: 86 },
  experience: { format: "spread", spineWidth: 4.9, spineHeight: 95 },
  contact: { format: "folio", spineWidth: 3.8, spineHeight: 85 },
};
