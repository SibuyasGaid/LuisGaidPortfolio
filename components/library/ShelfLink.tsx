"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import type { BookId } from "@/content/portfolio";
import { getBookPicker } from "@/lib/library/bookPicker";

type ShelfLinkProps = ComponentProps<typeof Link> & {
  readonly href: string;
  /** The book this link opens, or null for a link back to the shelf. */
  readonly bookId: BookId | null;
  /** Called when the library takes the move over (to close a menu, say). */
  readonly onMoveStart?: () => void;
};

// A link to a book or to the shelf that lets the library play the move:
// taking the book off the shelf, or putting the open one back. Naming a book
// (by pointer or keyboard) shows where it stands on the shelf.
export function ShelfLink({ bookId, href, onMoveStart, onPointerEnter, onPointerLeave, onFocus, onBlur, ...props }: ShelfLinkProps) {
  const preview = (target: BookId | null) => {
    if (bookId) getBookPicker()?.preview(target);
  };
  return (
    <Link
      {...props}
      href={href}
      onNavigate={(event) => {
        if (!getBookPicker()?.move({ bookId, href })) return;
        event.preventDefault();
        onMoveStart?.();
      }}
      onPointerEnter={(event) => {
        preview(bookId);
        onPointerEnter?.(event);
      }}
      onPointerLeave={(event) => {
        preview(null);
        onPointerLeave?.(event);
      }}
      onFocus={(event) => {
        preview(bookId);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        preview(null);
        onBlur?.(event);
      }}
    />
  );
}
