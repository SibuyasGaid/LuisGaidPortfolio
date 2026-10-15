import Link from "next/link";
import { BookTabs } from "@/components/layout/BookTabs";
import { Monogram } from "@/components/ornaments/Monogram";
import { PROFILE } from "@/content/portfolio";

export function Masthead() {
  return (
    <header data-inert-during-intro className="fixed inset-x-3 top-3 z-40 sm:inset-x-6 sm:top-4">
      <div className="relative mx-auto flex h-14 max-w-[86rem] items-center gap-1.5 overflow-hidden rounded-full border border-brass/15 bg-wood-950/95 pl-2 pr-1.5 shadow-[0_18px_40px_-20px_rgb(0_0_0/0.8)] sm:gap-4 sm:pl-3">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-3 rounded-full text-brass-light transition-colors duration-300 ease-settle hover:text-parchment lg:pr-2"
        >
          <Monogram className="size-10" />
          <span className="sr-only lg:not-sr-only eyebrow tracking-[0.2em] text-parchment/85">{PROFILE.fullName}</span>
        </Link>
        <span aria-hidden="true" className="h-6 w-px shrink-0 bg-brass/20" />
        <BookTabs />
        <div
          data-reading-progress
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-brass-light/80"
        />
      </div>
    </header>
  );
}
