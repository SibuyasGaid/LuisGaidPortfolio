import Link from "next/link";
import { OpenBook } from "@/components/book/OpenBook";
import { BrassRule } from "@/components/ornaments/BrassRule";

export default function NotFound() {
  return (
    <OpenBook
      format="spread"
      leftPage={
        <header>
          <p className="section-label">Page not found</p>
          <h1 className="mt-3 font-display text-[clamp(2.6rem,2rem+3vw,4.25rem)] font-medium leading-[1] text-ink">
            This page has been torn out.
          </h1>
          <BrassRule className="my-8 max-w-[14rem]" />
          <p className="lede max-w-[32rem]">The link may be out of date, or the page never existed.</p>
        </header>
      }
      rightPage={
        <div className="flex h-full flex-col items-start justify-center gap-6">
          <p className="body-copy">Everything else is still on the shelf. Head back to the library to pick a book.</p>
          <Link href="/" className="button-primary">
            Back to the library
          </Link>
        </div>
      }
    />
  );
}
