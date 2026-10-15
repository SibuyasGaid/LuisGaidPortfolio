import Link from "next/link";
import { BOOK_COVER, CHAPTERS } from "@/content/portfolio";
import { getChapterHref } from "@/lib/chapters";

export function TableOfContents() {
  return (
    <nav aria-labelledby="contents-title">
      <p className="section-label">Table of</p>
      <h2 id="contents-title" className="mt-4 font-display text-[2.6rem] font-medium leading-none tracking-[-0.01em] text-ink">
        {BOOK_COVER.contentsTitle}
      </h2>
      <ol className="mt-10 border-t border-ink/10">
        {CHAPTERS.map((chapter) => (
          <li key={chapter.id} className="border-b border-ink/10" data-reveal>
            <Link
              href={getChapterHref(chapter.id)}
              className="group grid grid-cols-[2.5rem_1fr_auto] items-center gap-x-3 py-5 sm:grid-cols-[3rem_1fr_auto]"
            >
              <span className="font-display text-lg italic text-burgundy">{chapter.numeral}</span>
              <span className="flex min-w-0 flex-col sm:flex-row sm:items-baseline sm:gap-4">
                <span className="font-display text-[1.75rem] font-medium leading-tight text-ink transition-colors duration-300 ease-settle group-hover:text-burgundy sm:text-[1.9rem]">
                  {chapter.title}
                </span>
                <span className="text-sm text-ink-soft">{chapter.subtitle}</span>
              </span>
              <span aria-hidden="true" className="nudge-arrow text-lg text-brass-ink">
                →
              </span>
            </Link>
          </li>
        ))}
      </ol>
      <p className="mt-10">
        <Link href={getChapterHref("about")} className="button-primary">
          Begin reading
          <span aria-hidden="true" className="nudge-arrow">
            →
          </span>
        </Link>
      </p>
    </nav>
  );
}
