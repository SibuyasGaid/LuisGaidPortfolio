import Link from "next/link";
import { Monogram } from "@/components/ornaments/Monogram";
import { PROFILE } from "@/content/portfolio";

export function Masthead() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-brass/20 bg-wood-950">
      <div className="mx-auto flex h-masthead max-w-[90rem] items-center justify-between gap-4 px-4 sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-3 text-brass-light transition-colors duration-300 ease-settle hover:text-parchment"
        >
          <Monogram className="size-9" />
          <span className="sr-only sm:not-sr-only small-caps text-[0.78rem] tracking-[0.14em] sm:inline">
            {PROFILE.fullName}
          </span>
        </Link>
        <nav aria-label="Site">
          <ul className="flex items-center gap-4 sm:gap-7">
            <li>
              <Link
                href="/"
                className="text-sm tracking-wide text-smoke transition-colors duration-300 ease-settle hover:text-parchment"
              >
                Contents
              </Link>
            </li>
            <li>
              <Link
                href="/contact"
                className="inline-flex min-h-10 items-center rounded-[2px] border border-brass/60 px-4 text-sm font-semibold tracking-wide text-brass-light transition-colors duration-300 ease-settle hover:border-brass-light hover:text-parchment"
              >
                Get in touch
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <div
        data-reading-progress
        aria-hidden="true"
        className="absolute inset-x-0 -bottom-px h-px origin-left scale-x-0 bg-brass-light"
      />
    </header>
  );
}
