import type { BookId } from "@/content/portfolio";

/**
 * spread: two pages, the opener on the left and the content on the right.
 * folio: one wide page with the opener across the top, for gallery-like books.
 */
export type BookFormat = "spread" | "folio";

export interface BookDesign {
  readonly format: BookFormat;
  /** Spine width on the shelf, in rem at desktop size. */
  readonly spineWidth: number;
  /** Spine height as a share of the shelf bay, so the books stand at different heights. */
  readonly spineHeight: number;
}

// Colours live in CSS under [data-book]; this holds the structural choices.
export const BOOK_DESIGNS: Record<BookId, BookDesign> = {
  about: { format: "spread", spineWidth: 4.4, spineHeight: 86 },
  work: { format: "folio", spineWidth: 5.8, spineHeight: 97 },
  services: { format: "spread", spineWidth: 4.6, spineHeight: 81 },
  stack: { format: "folio", spineWidth: 4, spineHeight: 74 },
  experience: { format: "spread", spineWidth: 4.9, spineHeight: 91 },
  contact: { format: "folio", spineWidth: 3.8, spineHeight: 70 },
};
