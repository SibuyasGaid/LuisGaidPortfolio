import type { ReactNode } from "react";
import { BrassRule } from "@/components/ornaments/BrassRule";
import type { Book } from "@/content/portfolio";
import type { BookFormat } from "@/lib/bookDesigns";

interface BookOpenerProps {
  readonly book: Book;
  readonly titleId: string;
  readonly format: BookFormat;
  /** An illustration printed under the opening lines, such as the author's portrait. */
  readonly plate?: ReactNode;
}

// The opening of a book. On a spread it fills the left page and stays in view
// while the right page scrolls (unless it carries a plate, which would make it
// taller than the screen: then it stays put, as a printed page does); on a
// folio it runs across the top of the page.
export function BookOpener({ book, titleId, format, plate }: BookOpenerProps) {
  const isSpread = format === "spread";
  const isSticky = isSpread && !plate;
  return (
    <header className={isSticky ? "relative lg:sticky lg:top-[calc(var(--spacing-masthead)+3rem)]" : isSpread ? "relative" : "relative mb-16 lg:mb-20"}>
      {/* Anchored by its left edge: numerals change width when the display font
          arrives, and a right-anchored box would visibly shift. */}
      <span
        aria-hidden="true"
        data-parallax="0.25"
        className={`pointer-events-none absolute -top-6 left-[60%] select-none ${isSpread ? "" : "lg:left-[40%]"} font-display text-[7.5rem] font-medium leading-none text-[color:var(--book-accent)] opacity-[0.07] sm:text-[10rem] lg:-top-10 lg:text-[15rem]`}
      >
        {book.numeral}
      </span>
      <div className={isSpread ? "relative" : "relative grid gap-x-16 gap-y-8 lg:grid-cols-[1.1fr_1fr] lg:items-end"}>
        <div>
          <p className="section-label">
            Volume {book.numeral} · {book.kind}
          </p>
          <h1
            id={titleId}
            className="mt-4 font-display text-[clamp(3rem,2rem+3.8vw,5rem)] font-medium leading-[0.95] tracking-[-0.02em] text-ink"
          >
            {book.title}
          </h1>
          <p className="mt-4 font-display text-[1.6rem] italic text-ink-soft">{book.subtitle}</p>
          {isSpread ? <BrassRule className="my-9 max-w-[9rem]" /> : null}
        </div>
        <p className="lede drop-cap max-w-[34rem]">{book.introduction}</p>
      </div>
      {plate}
      {isSpread ? null : <BrassRule className="mt-12 max-w-[9rem]" />}
    </header>
  );
}
