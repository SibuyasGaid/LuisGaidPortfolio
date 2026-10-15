import Link from "next/link";
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
            <FooterLink href={getBookHref(previous.id)} rel="prev" label="Previous book" title={previous.title} direction="back" />
          ) : (
            <FooterLink href="/" label="Back to" title="The shelf" direction="back" />
          )}
        </li>
        <li className="text-right">
          {next ? (
            <FooterLink href={getBookHref(next.id)} rel="next" label="Next book" title={next.title} direction="forward" />
          ) : (
            <FooterLink href="/" label="Back to" title="The shelf" direction="forward" />
          )}
        </li>
      </ul>
    </nav>
  );
}

interface FooterLinkProps {
  readonly href: string;
  readonly label: string;
  readonly title: string;
  readonly direction: "back" | "forward";
  readonly rel?: "prev" | "next";
}

function FooterLink({ href, label, title, direction, rel }: FooterLinkProps) {
  const isForward = direction === "forward";
  return (
    <Link href={href} rel={rel} className="group inline-block">
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
    </Link>
  );
}
