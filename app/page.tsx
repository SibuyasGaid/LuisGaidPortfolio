import { LibraryIntro } from "@/components/intro/LibraryIntro";
import { LibraryShelfDirector } from "@/components/library/LibraryShelfDirector";
import { RewindIntroButton } from "@/components/library/RewindIntroButton";
import { ShelfHotspots } from "@/components/library/ShelfHotspots";
import { ShelfPoster } from "@/components/library/ShelfPoster";
import { LIBRARY, PROFILE } from "@/content/portfolio";

// The home page is the grand bookcase the intro walks up to: its poster
// first, then (where the device runs it) the live WebGL library fading up
// over it in exactly the same place, the heading above, and a link over each
// titled book.
export default function LibraryPage() {
  return (
    <>
      <LibraryIntro />
      <div data-shelf-poster aria-hidden="true" className="shelf-poster is-home">
        <ShelfPoster isEager />
      </div>
      <div aria-hidden="true" className="library-scene-shade" />
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
        <div className="library-foot">
          <p data-scene-caption aria-hidden="true" className="library-scene-caption">
            {LIBRARY.sceneInstruction}
          </p>
          <RewindIntroButton />
        </div>
      </div>
      <ShelfHotspots />
      <LibraryShelfDirector />
    </>
  );
}
