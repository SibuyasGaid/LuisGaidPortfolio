import { Monogram } from "@/components/ornaments/Monogram";
import type { Book } from "@/content/portfolio";

interface BookCoverProps {
  readonly book: Book;
}

// The closed cover that swings open over the pages. It is a pure CSS
// animation: it starts with the first paint, needs no JavaScript, and never
// hides the pages from the largest-paint measurement because they are painted
// underneath it from the start. Reduced motion removes it entirely.
export function BookCover({ book }: BookCoverProps) {
  return (
    <>
      <div className="book-cover-shade" aria-hidden="true" />
      <div className="book-cover-flap" aria-hidden="true">
        <div className="book-cover-face">
          <Monogram className="book-cover-monogram" />
          <p className="book-cover-title">{book.title}</p>
          <p className="book-cover-kind">
            Volume {book.numeral} · {book.kind}
          </p>
        </div>
      </div>
    </>
  );
}
