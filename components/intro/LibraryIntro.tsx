import { Bookshelf } from "@/components/intro/Bookshelf";
import { HeroVolume } from "@/components/intro/HeroVolume";
import { IntroDirector } from "@/components/intro/IntroDirector";

// Dust caught in the lamp light, as static markup for the same reason as the
// shelf: decorative nodes React doesn't need to hydrate one by one.
const DUST_MARKUP = [
  [38, 22, 3], [46, 34, 2], [55, 18, 4], [61, 41, 2], [43, 52, 3],
  [52, 47, 2], [58, 28, 3], [35, 40, 2], [66, 24, 2], [49, 12, 3],
]
  .map(([left, top, size]) => `<span data-intro-mote class="intro-mote" style="left:${left}%;top:${top}%;width:${size}px;height:${size}px"></span>`)
  .join("");

// The opening scene: a lamp-lit library rendered in layers that a GSAP
// timeline moves at different speeds to fake a camera. The server renders the
// first frame, and the inline boot script decides before the first paint
// whether it shows at all; without JavaScript it never does.
export function LibraryIntro() {
  return (
    <div className="library-intro" data-intro-overlay data-lenis-prevent role="region" aria-label="Opening animation">
      <div data-intro-scene className="intro-scene" aria-hidden="true">
        <div data-intro-camera className="intro-camera">
          <div data-intro-wall className="intro-wall" />
          <Bookshelf />
          <div data-intro-foreground className="intro-foreground" />
        </div>
        <div data-intro-glow className="intro-glow" />
        <div data-intro-dim className="intro-dim" />
        <div className="intro-vignette" />
        <div className="intro-dust" dangerouslySetInnerHTML={{ __html: DUST_MARKUP }} />
      </div>
      <HeroVolume />
      <button type="button" data-skip-intro className="intro-skip">
        Skip intro
        <kbd className="intro-skip-key">Esc</kbd>
      </button>
      <IntroDirector />
    </div>
  );
}
