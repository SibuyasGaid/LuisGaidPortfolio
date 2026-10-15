import { BrassRule } from "@/components/ornaments/BrassRule";
import type { Chapter } from "@/content/portfolio";

interface ChapterOpenerProps {
  readonly chapter: Chapter;
  readonly titleId: string;
}

export function ChapterOpener({ chapter, titleId }: ChapterOpenerProps) {
  return (
    <header className="relative lg:sticky lg:top-[calc(var(--spacing-masthead)+3rem)]">
      {/* Anchored by its left edge: numerals change width when the display font
          arrives, and a right-anchored box would visibly shift. */}
      <span
        aria-hidden="true"
        data-parallax="0.25"
        className="pointer-events-none absolute -top-6 left-[60%] select-none font-display text-[7.5rem] font-medium leading-none text-burgundy/[0.06] sm:text-[10rem] lg:-top-10 lg:left-[58%] lg:text-[15rem]"
      >
        {chapter.numeral}
      </span>
      <p className="section-label relative">Chapter {chapter.numeral}</p>
      <h1
        id={titleId}
        className="relative mt-4 font-display text-[clamp(3rem,2rem+3.8vw,5rem)] font-medium leading-[0.95] tracking-[-0.02em] text-ink"
      >
        {chapter.title}
      </h1>
      <p className="relative mt-4 font-display text-[1.6rem] italic text-ink-soft">{chapter.subtitle}</p>
      <BrassRule className="relative my-9 max-w-[9rem]" />
      <p className="lede drop-cap relative max-w-[34rem]">{chapter.introduction}</p>
    </header>
  );
}
