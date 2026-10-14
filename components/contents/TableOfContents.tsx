import Link from "next/link";
import { BrassRule } from "@/components/ornaments/BrassRule";
import { BOOK_COVER, CHAPTERS } from "@/content/portfolio";
import { getChapterHref } from "@/lib/chapters";

export function TableOfContents() {
  return (
    <nav aria-labelledby="contents-title">
      <h2
        id="contents-title"
        className="small-caps text-[1.55rem] leading-none tracking-[0.14em] text-ink"
      >
        {BOOK_COVER.contentsTitle}
      </h2>
      <BrassRule className="mt-6 max-w-[14rem]" />
      <ol className="mt-8 border-t border-ink/12">
        {CHAPTERS.map((chapter) => (
          <li key={chapter.id} className="border-b border-ink/12" data-reveal>
            <Link
              href={getChapterHref(chapter.id)}
              className="group grid grid-cols-[2.75rem_1fr] items-baseline gap-x-2 py-5 sm:grid-cols-[3.5rem_1fr]"
            >
              <span className="small-caps text-[0.85rem] tracking-[0.12em] text-burgundy">{chapter.numeral}</span>
              <span className="flex flex-col sm:flex-row sm:items-baseline sm:gap-3">
                <span className="font-display text-[1.75rem] font-semibold leading-tight text-ink transition-colors duration-300 ease-settle group-hover:text-burgundy">
                  {chapter.title}
                </span>
                <span aria-hidden="true" className="mb-1.5 hidden flex-1 border-b border-dotted border-ink/35 sm:block" />
                <span className="font-display text-lg italic text-ink-soft">{chapter.subtitle}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
      <p className="mt-10">
        <Link href={getChapterHref("about")} className="button-primary">
          Begin reading
        </Link>
      </p>
    </nav>
  );
}
