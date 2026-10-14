import { BrassRule } from "@/components/ornaments/BrassRule";
import type { Chapter } from "@/content/portfolio";

interface ChapterOpenerProps {
  readonly chapter: Chapter;
  readonly titleId: string;
}

export function ChapterOpener({ chapter, titleId }: ChapterOpenerProps) {
  return (
    <header className="relative lg:sticky lg:top-[calc(var(--spacing-masthead)+3rem)]">
      <span
        aria-hidden="true"
        data-parallax="0.25"
        className="pointer-events-none absolute -top-6 right-0 select-none font-display text-[7.5rem] font-semibold leading-none text-burgundy/[0.07] sm:text-[10rem] lg:-top-10 lg:text-[15rem]"
      >
        {chapter.numeral}
      </span>
      <p className="small-caps-label relative">Chapter {chapter.numeral}</p>
      <h1
        id={titleId}
        className="relative mt-3 font-display text-[clamp(2.9rem,2rem+3.6vw,4.75rem)] font-semibold leading-[0.98] tracking-[-0.01em] text-ink"
      >
        {chapter.title}
      </h1>
      <p className="relative mt-4 font-display text-2xl italic text-ink-soft">{chapter.subtitle}</p>
      <BrassRule className="relative my-8 max-w-[14rem]" />
      <p className="lede drop-cap relative max-w-[34rem]">{chapter.introduction}</p>
    </header>
  );
}
