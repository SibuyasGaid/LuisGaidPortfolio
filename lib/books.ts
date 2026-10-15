import type { Metadata } from "next";
import { BOOKS, type Book, type BookId } from "@/content/portfolio";

export function getBookHref(bookId: BookId): `/${BookId}` {
  return `/${bookId}`;
}

export function getBook(bookId: BookId): Book {
  const book = BOOKS.find((candidate) => candidate.id === bookId);
  if (!book) throw new Error(`Unknown book: ${bookId}`);
  return book;
}

export function getAdjacentBooks(bookId: BookId): {
  previous: Book | null;
  next: Book | null;
} {
  const index = BOOKS.findIndex((book) => book.id === bookId);
  return {
    previous: BOOKS[index - 1] ?? null,
    next: BOOKS[index + 1] ?? null,
  };
}

/** Decorative page numbers for two-page spreads: each book starts on an even left page. */
export function getBookFolios(bookId: BookId): readonly [string, string] {
  const leftPageNumber = (BOOKS.findIndex((book) => book.id === bookId) + 1) * 2;
  return [String(leftPageNumber), String(leftPageNumber + 1)];
}

export function createBookMetadata(bookId: BookId): Metadata {
  const book = getBook(bookId);
  return {
    title: book.title,
    description: book.introduction,
    alternates: { canonical: getBookHref(bookId) },
  };
}
