import { IntroDirector } from "@/components/intro/IntroDirector";
import { DUST_MARKUP, LIBRARY_SCENE_MARKUP } from "@/lib/intro/renderLibraryScene";

// The opening scene: a lamp-lit library built in CSS 3D. A GSAP timeline walks
// the camera down an aisle of bookcases into a reading room, where the scene
// dissolves onto the real bookcase. The server renders the first frame, and
// the inline boot script decides before the first paint whether it shows at
// all; without JavaScript it never does.
export function LibraryIntro() {
  return (
    <div className="library-intro" data-intro-overlay data-lenis-prevent role="region" aria-label="Opening animation">
      <div data-intro-scene className="intro-scene" aria-hidden="true">
        <div data-intro-camera className="intro-camera">
          <div data-intro-world className="aisle-world" dangerouslySetInnerHTML={{ __html: LIBRARY_SCENE_MARKUP }} />
        </div>
        <div className="intro-vignette" />
        <div className="intro-dust" dangerouslySetInnerHTML={{ __html: DUST_MARKUP }} />
      </div>
      <button type="button" data-skip-intro className="intro-skip">
        Skip intro
        <kbd className="intro-skip-key">Esc</kbd>
      </button>
      <IntroDirector />
    </div>
  );
}
