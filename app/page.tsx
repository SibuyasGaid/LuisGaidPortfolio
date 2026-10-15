import { LibraryIntro } from "@/components/intro/LibraryIntro";
import { LibraryShelf } from "@/components/shelf/LibraryShelf";
import { LIBRARY, PROFILE } from "@/content/portfolio";

export default function LibraryPage() {
  return (
    <>
      <LibraryIntro />
      {/* The intro's camera comes to rest on this stage before handing over. */}
      <div data-shelf-stage data-inert-during-intro className="library-stage">
        <header className="mx-auto max-w-[46rem] px-4 text-center">
          <p className="eyebrow text-brass-light">{LIBRARY.eyebrow}</p>
          <h1 className="mt-4 font-display text-[clamp(2.9rem,1.9rem+4.2vw,5.5rem)] font-medium leading-[0.95] tracking-[-0.02em] text-parchment-light">
            {PROFILE.fullName}
          </h1>
          <p className="mx-auto mt-5 max-w-[38rem] font-display text-[1.25rem] italic leading-snug text-smoke sm:text-[1.45rem]">
            {PROFILE.summary}
          </p>
        </header>
        <LibraryShelf />
      </div>
    </>
  );
}
