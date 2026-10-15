import Link from "next/link";
import { SiteNav } from "@/components/layout/SiteNav";
import { Monogram } from "@/components/ornaments/Monogram";
import { PROFILE } from "@/content/portfolio";

export function Masthead() {
  return (
    <header data-masthead data-inert-during-intro className="fixed inset-x-3 top-3 z-40 sm:inset-x-6 sm:top-4">
      <div className="relative mx-auto flex h-14 max-w-[86rem] items-center gap-3 rounded-full border border-brass/15 bg-wood-950/95 pl-2 pr-2 shadow-[0_18px_40px_-20px_rgb(0_0_0/0.8)] sm:pl-3">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-3 rounded-full text-brass-light transition-colors duration-300 ease-settle hover:text-parchment sm:pr-2"
        >
          <Monogram className="size-10" />
          <span className="sr-only sm:not-sr-only eyebrow tracking-[0.2em] text-parchment/85">{PROFILE.fullName}</span>
        </Link>
        <SiteNav />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
          <div data-reading-progress className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-brass-light/80" />
        </div>
      </div>
    </header>
  );
}
