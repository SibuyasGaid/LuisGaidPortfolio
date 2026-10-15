import Link from "next/link";
import type { CSSProperties } from "react";
import { BOOKS, LIBRARY, type Book } from "@/content/portfolio";
import { BOOK_DESIGNS } from "@/lib/bookDesigns";
import { getBookHref } from "@/lib/books";

type SpineStyle = CSSProperties & Record<"--spine-width" | "--spine-height", number>;

function getSpineStyle(book: Book): SpineStyle {
  const { spineWidth, spineHeight } = BOOK_DESIGNS[book.id];
  return { "--spine-width": spineWidth, "--spine-height": spineHeight / 100 };
}

// Three volumes lying flat at the end of the row, purely for the look of a lived-in shelf.
const LYING_BOOK_CLASSES = ["shelf-lying-book bg-burgundy-deep", "shelf-lying-book bg-wood-800", "shelf-lying-book bg-brass"] as const;

// The home page: every book stands on one shelf. Hovering or focusing a spine
// pulls it forward and names it in the caption below; choosing it opens the book.
export function LibraryShelf() {
  return (
    <nav aria-label="Library shelf" className="shelf">
      <div className="shelf-unit">
        <div className="shelf-cabinet">
          <span aria-hidden="true" className="shelf-bookend" />
          <ul className="flex items-end gap-[3px]">
            {BOOKS.map((book) => (
              <li key={book.id} className="flex">
                <Link href={getBookHref(book.id)} data-book={book.id} className="shelf-spine" style={getSpineStyle(book)}>
                  <span className="shelf-spine-body">
                    <span aria-hidden="true" className="shelf-spine-numeral">
                      {book.numeral}
                    </span>
                    <span className="shelf-spine-title">{book.title}</span>
                    <span className="sr-only">: {book.subtitle}</span>
                  </span>
                </Link>
                <span aria-hidden="true" className="shelf-caption">
                  <span className="eyebrow text-brass-light">
                    Volume {book.numeral} · {book.kind}
                  </span>
                  <span className="mt-1.5 block font-display text-[1.6rem] leading-tight text-parchment-light">
                    {book.title} <em className="text-smoke">{book.subtitle}</em>
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <span aria-hidden="true" className="shelf-bookend" />
          <span aria-hidden="true" className="shelf-lying-stack">
            {LYING_BOOK_CLASSES.map((className) => (
              <span key={className} className={className} />
            ))}
          </span>
        </div>
        <div aria-hidden="true" className="shelf-plank" />
        <p className="shelf-instruction">{LIBRARY.shelfInstruction}</p>
      </div>
    </nav>
  );
}
