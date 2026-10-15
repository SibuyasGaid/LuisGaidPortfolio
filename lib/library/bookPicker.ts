import type { BookId } from "@/content/portfolio";

// How links reach the library. The site's librarian (ShelfTransitions, in the
// layout) registers here once. Naming a book on the home page shows where it
// stands on the shelf; following a link to a book, or back to the shelf, lets
// the librarian play the move: a book taken off the shelf, or the open book
// put back (and the next one taken). Without a librarian, links just navigate.

export interface ShelfMove {
  /** The book the link opens, or null for the shelf itself. */
  readonly bookId: BookId | null;
  readonly href: string;
}

export interface BookPicker {
  /** Shows where a book stands on the shelf, or stops showing with null. */
  preview(bookId: BookId | null): void;
  /** Plays the move and navigates when it is time; false leaves the link to navigate by itself. */
  move(move: ShelfMove): boolean;
}

let activePicker: BookPicker | null = null;

export function setBookPicker(picker: BookPicker): () => void {
  activePicker = picker;
  return () => {
    if (activePicker === picker) activePicker = null;
  };
}

export function getBookPicker(): BookPicker | null {
  return activePicker;
}
