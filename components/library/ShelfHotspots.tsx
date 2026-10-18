import type { CSSProperties } from "react";
import { ShelfHotspotsController } from "@/components/library/ShelfHotspotsController";
import { BOOKS, LIBRARY } from "@/content/portfolio";
import { getBookHref } from "@/lib/books";
import { getSpineRects, type ReferenceRect } from "@/lib/library/shelfFraming";

// A link over each titled book on the shelf, placed from the same framing as
// the poster and the live scene, so a book can be chosen where it stands.
// They are plain links: without JavaScript they open their books. Named (by
// pointer, keyboard or the navbar), a book is labelled with a tag above it.

function toPlacement(prefix: "l" | "p", rect: ReferenceRect): Record<string, string> {
  return {
    [`--${prefix}-left`]: `${(rect.left * 100).toFixed(3)}%`,
    [`--${prefix}-top`]: `${(rect.top * 100).toFixed(3)}%`,
    [`--${prefix}-width`]: `${(rect.width * 100).toFixed(3)}%`,
    [`--${prefix}-height`]: `${(rect.height * 100).toFixed(3)}%`,
  };
}

export function ShelfHotspots() {
  const rects = getSpineRects();
  return (
    <nav aria-label={LIBRARY.shelfLabel} data-inert-during-intro className="shelf-hotspots">
      <div className="shelf-frame" data-shelf-hotspots>
        {BOOKS.map((book) => (
          <a
            key={book.id}
            href={getBookHref(book.id)}
            data-shelf-book={book.id}
            className="shelf-hotspot"
            style={{ ...toPlacement("l", rects[book.id].landscape), ...toPlacement("p", rects[book.id].portrait) } as CSSProperties}
          >
            <span className="sr-only">
              Volume {book.numeral}: {book.title}, {book.subtitle}
            </span>
            <span aria-hidden="true" className="shelf-hotspot-tag">
              <span className="eyebrow text-brass-ink">
                Vol. {book.numeral} · {book.kind}
              </span>
              <span className="shelf-hotspot-title">{book.title}</span>
              <span className="shelf-hotspot-action">
                Open <span className="nudge-arrow">→</span>
              </span>
            </span>
          </a>
        ))}
      </div>
      <ShelfHotspotsController />
    </nav>
  );
}
