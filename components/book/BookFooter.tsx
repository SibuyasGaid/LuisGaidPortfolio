import { ShelfLink } from "@/components/library/ShelfLink";
import type { BookId } from "@/content/portfolio";
import { getAdjacentBooks, getBookHref } from "@/lib/books";

interface BookFooterProps {
  readonly bookId: BookId;
}

export function BookFooter({ bookId }: BookFooterProps) {
  const { previous, next } = getAdjacentBooks(bookId);
  return (
    <nav aria-label="More books" className="mt-20 border-t border-ink/10 pt-7">
      <ul className="grid grid-cols-2 gap-6">
        <li>
          {previous ? (
            <FooterLink href={getBookHref(previous.id)} bookId={previous.id} rel="prev" label="Previous book" title={previous.title} direction="back" />
          ) : (
            <FooterLink href="/" bookId={null} label="Back to" title="The shelf" direction="back" />
          )}
        </li>
        <li className="text-right">
          {next ? (
            <FooterLink href={getBookHref(next.id)} bookId={next.id} rel="next" label="Next book" title={next.title} direction="forward" />
          ) : (
            <FooterLink href="/" bookId={null} label="Back to" title="The shelf" direction="forward" />
          )}
        </li>
      </ul>
      {/* Between the first and last books, the shelf is a step of its own. */}
      {previous && next ? (
        <p className="mt-10 text-center">
          <FooterLink href="/" bookId={null} label="Or go" title="Back to the shelf" direction="back" />
        </p>
      ) : null}
    </nav>
  );
}

interface FooterLinkProps {
  readonly href: string;
  readonly bookId: BookId | null;
  readonly label: string;
  readonly title: string;
  readonly direction: "back" | "forward";
  readonly rel?: "prev" | "next";
}

function FooterLink({ href, bookId, label, title, direction, rel }: FooterLinkProps) {
  const isForward = direction === "forward";
  return (
    <ShelfLink href={href} bookId={bookId} rel={rel} className="group inline-block">
      <span className="section-label block">{label}</span>
      <span className="mt-1.5 inline-flex items-baseline gap-2 font-display text-xl font-medium text-ink transition-colors duration-300 ease-settle group-hover:text-[color:var(--book-accent)] sm:text-2xl">
        {isForward ? null : (
          <span aria-hidden="true" className="nudge-arrow-back">
            ←
          </span>
        )}
        {title}
        {isForward ? (
          <span aria-hidden="true" className="nudge-arrow">
            →
          </span>
        ) : null}
      </span>
    </ShelfLink>
  );
}
