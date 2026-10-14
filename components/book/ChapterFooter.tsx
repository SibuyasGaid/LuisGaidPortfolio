import Link from "next/link";
import type { ChapterId } from "@/content/portfolio";
import { getAdjacentChapters, getChapterHref } from "@/lib/chapters";

interface ChapterFooterProps {
  readonly chapterId: ChapterId;
}

export function ChapterFooter({ chapterId }: ChapterFooterProps) {
  const { previous, next } = getAdjacentChapters(chapterId);
  return (
    <nav aria-label="Chapters" className="mt-20 border-t border-ink/15 pt-6">
      <ul className="grid grid-cols-2 gap-6">
        <li>
          {previous ? (
            <FooterLink href={getChapterHref(previous.id)} rel="prev" label="Previous" title={`${previous.numeral}. ${previous.title}`} />
          ) : (
            <FooterLink href="/" label="Back to" title="Contents" />
          )}
        </li>
        <li className="text-right">
          {next ? (
            <FooterLink href={getChapterHref(next.id)} rel="next" label="Next" title={`${next.numeral}. ${next.title}`} />
          ) : (
            <FooterLink href="/" label="Back to" title="Contents" />
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
  readonly rel?: "prev" | "next";
}

function FooterLink({ href, label, title, rel }: FooterLinkProps) {
  return (
    <Link href={href} rel={rel} className="group block">
      <span className="small-caps-label block">{label}</span>
      <span className="mt-1 block font-display text-xl font-semibold text-ink transition-colors duration-300 ease-settle group-hover:text-burgundy sm:text-2xl">
        {title}
      </span>
    </Link>
  );
}
