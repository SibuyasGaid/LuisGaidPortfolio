import { LibraryIntro } from "@/components/intro/LibraryIntro";
import { LibraryShelfDirector } from "@/components/library/LibraryShelfDirector";
import { Bookcase } from "@/components/shelf/Bookcase";
import { LIBRARY, PROFILE } from "@/content/portfolio";

export default function LibraryPage() {
  return (
    <>
      <LibraryIntro />
      {/* Over the WebGL library where it runs; above the flat bookcase everywhere else. */}
      <div data-shelf-stage data-inert-during-intro className="library-stage">
        <header className="library-hero mx-auto max-w-[46rem] px-4 text-center">
          <p className="eyebrow text-brass-light">{LIBRARY.eyebrow}</p>
          <h1 className="mt-3 font-display text-[clamp(2.7rem,1.8rem+3.4vw,4.6rem)] font-medium leading-[0.95] tracking-[-0.02em] text-parchment-light">
            {PROFILE.fullName}
          </h1>
          <p className="mx-auto mt-4 max-w-[40rem] font-display text-[1.15rem] italic leading-snug text-smoke sm:text-[1.3rem]">
            {PROFILE.summary}
          </p>
        </header>
        <p data-scene-caption aria-hidden="true" className="library-scene-caption">
          {LIBRARY.sceneInstruction}
        </p>
        <Bookcase />
      </div>
      <LibraryShelfDirector />
    </>
  );
}
