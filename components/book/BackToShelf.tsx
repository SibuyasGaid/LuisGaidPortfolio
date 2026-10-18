import { ShelfLink } from "@/components/library/ShelfLink";

// Above every book, the way back: the book closes and goes back on the shelf,
// as it does from the navbar's Library link (which not every reader spots).
export function BackToShelf() {
  return (
    <div className="book-back-row">
      <ShelfLink href="/" bookId={null} className="book-back">
        <span aria-hidden="true" className="nudge-arrow-back">
          ←
        </span>
        Back to the shelf
      </ShelfLink>
    </div>
  );
}
