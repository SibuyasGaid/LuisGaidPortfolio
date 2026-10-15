import Link from "next/link";
import { Monogram } from "@/components/ornaments/Monogram";
import { PROFILE } from "@/content/portfolio";

export function Masthead() {
  return (
    <header data-inert-during-intro className="fixed inset-x-3 top-3 z-40 sm:inset-x-6 sm:top-4">
      <div className="relative mx-auto flex h-14 max-w-[86rem] items-center justify-between gap-4 overflow-hidden rounded-full border border-brass/15 bg-wood-950/95 pl-2 pr-2 shadow-[0_18px_40px_-20px_rgb(0_0_0/0.8)] sm:pl-3">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-full pr-3 text-brass-light transition-colors duration-300 ease-settle hover:text-parchment"
        >
          <Monogram className="size-10" />
          <span className="sr-only sm:not-sr-only eyebrow tracking-[0.2em] text-parchment/85">{PROFILE.fullName}</span>
        </Link>
        <nav aria-label="Site">
          <ul className="flex items-center gap-1 sm:gap-2">
            <li>
              <Link
                href="/"
                className="inline-flex min-h-10 items-center rounded-full px-4 text-sm text-smoke transition-colors duration-300 ease-settle hover:text-parchment"
              >
                Contents
              </Link>
            </li>
            <li>
              <Link
                href="/contact"
                className="inline-flex min-h-10 items-center rounded-full bg-brass-light px-4 text-sm font-semibold text-wood-950 transition-colors duration-300 ease-settle hover:bg-parchment"
              >
                Get in touch
              </Link>
            </li>
          </ul>
        </nav>
        <div
          data-reading-progress
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-brass-light/80"
        />
      </div>
    </header>
  );
}
