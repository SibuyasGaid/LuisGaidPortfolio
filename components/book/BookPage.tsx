import type { ReactNode } from "react";
import { BackToShelf } from "@/components/book/BackToShelf";
import { BookCover } from "@/components/book/BookCover";
import { BookFooter } from "@/components/book/BookFooter";
import { BookOpener } from "@/components/book/BookOpener";
import { OpenBook } from "@/components/book/OpenBook";
import { RunningHead } from "@/components/book/RunningHead";
import { BookFallback } from "@/components/errors/BookFallback";
import { ErrorBoundary } from "@/components/errors/ErrorBoundary";
import { RevealScope } from "@/components/motion/RevealScope";
import type { BookId } from "@/content/portfolio";
import { BOOK_DESIGNS } from "@/lib/bookDesigns";
import { getBook, getBookFolios } from "@/lib/books";

interface BookPageProps {
  readonly bookId: BookId;
  readonly children: ReactNode;
  /** An illustration printed under the book's opening lines (on the left page of a spread), such as the author's portrait. */
  readonly plate?: ReactNode;
}

export function BookPage({ bookId, children, plate }: BookPageProps) {
  const book = getBook(bookId);
  const { format } = BOOK_DESIGNS[bookId];
  const titleId = `${bookId}-title`;
  const content = <ErrorBoundary fallback={<BookFallback bookTitle={book.title} />}>{children}</ErrorBoundary>;
  const cover = <BookCover book={book} />;

  return (
    <RevealScope>
      <article aria-labelledby={titleId} data-book={bookId}>
        <BackToShelf />
        {format === "spread" ? (
          <OpenBook
            format="spread"
            cover={cover}
            folios={getBookFolios(bookId)}
            leftPage={<BookOpener book={book} titleId={titleId} format="spread" plate={plate} />}
            rightPage={
              <>
                <RunningHead book={book} />
                {content}
                <BookFooter bookId={bookId} />
              </>
            }
          />
        ) : (
          <OpenBook
            format="folio"
            cover={cover}
            page={
              <>
                <BookOpener book={book} titleId={titleId} format="folio" plate={plate} />
                {content}
                <BookFooter bookId={bookId} />
              </>
            }
          />
        )}
      </article>
    </RevealScope>
  );
}
