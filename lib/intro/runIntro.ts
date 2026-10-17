import { INTRO } from "@/content/portfolio";
import { chooseIntroVariant } from "@/lib/intro/chooseIntroVariant";
import {
  createWalkTimeline,
  createWelcomeExit,
  createWelcomeRewind,
  releaseIntroElements,
  type IntroElements,
  type IntroLanding,
  type IntroPlayback,
} from "@/lib/intro/createIntroTimeline";
import { markIntroRunning } from "@/lib/intro/introLifecycle";
import { applyShelfView, fallBackToFlatShelf } from "@/lib/library/chooseShelfView";
import { getLoadedLibrary, loadLibrary, releaseLibrary } from "@/lib/library/libraryStage";
import type { RenderQuality } from "@/lib/library/webgl/createLibraryScene";
import { createWelcomeProgress } from "@/lib/intro/welcomeProgress";
import { INTRO_LOAD_TIMEOUT_SECONDS, INTRO_PROGRESS, INTRO_WELCOME_MIN_SECONDS } from "@/lib/motion/config";
import { gsap } from "@/lib/motion/gsap";
import { reportError } from "@/lib/reportError";

export interface RunningIntro {
  stop(): void;
}

/** Seconds left until the welcome screen has been up for its minimum, counted from the page's first moments. */
function measureRemainingWelcome(): number {
  return Math.max(0, INTRO_WELCOME_MIN_SECONDS - performance.now() / 1000);
}

/**
 * A rewind from the landing page: everything is already loaded, so the
 * welcome card comes back (with a full bar) and the walk plays again, or
 * where there is no walk the card returns and gives way to the shelf.
 */
function runRewind(elements: IntroElements): RunningIntro {
  const variant = chooseIntroVariant();
  const library = getLoadedLibrary();
  // Whatever the last run left on the overlay goes; the card and backdrop start unseen.
  gsap.set([elements.welcome, elements.backdrop, elements.controls, elements.progressFill], { clearProps: "all" });
  gsap.set([elements.welcome, elements.backdrop], { opacity: 0 });
  createWelcomeProgress(elements.progressBar, elements.progressFill, elements.status).advance(1, INTRO.statuses.ready);
  let playback: IntroPlayback;
  if (variant.kind === "walk" && library) playback = createWalkTimeline(elements, library.scene, 0, { isRewind: true });
  else playback = createWelcomeRewind(elements, library ? "scene" : "flat");
  if (library && variant.kind !== "walk") library.scene.renderWalk({ progress: 1, stride: 0, elapsed: 0 });
  return {
    stop() {
      playback.kill();
      releaseIntroElements(elements);
    },
  };
}

// The welcome screen shows from the first paint. Behind it, the WebGL library
// downloads and builds in stages that the progress bar reports; once it is
// ready (and the welcome has had its moment) the walk begins, and the library
// stays on as the home page. Anything that goes wrong hands over to the
// poster; taking too long hands over to the home page, where the library
// fades up whenever it is ready.
export function runIntro(elements: IntroElements, options: { readonly isRewind?: boolean } = {}): RunningIntro {
  if (options.isRewind) return runRewind(elements);
  markIntroRunning();
  const progress = createWelcomeProgress(elements.progressBar, elements.progressFill, elements.status);
  const variant = chooseIntroVariant();
  let playback: IntroPlayback | null = null;
  let isStopped = false;
  let timeout = 0;

  function enter(landing: IntroLanding): void {
    if (isStopped || playback) return;
    progress.advance(1, INTRO.statuses.ready);
    playback = createWelcomeExit(elements, measureRemainingWelcome(), landing);
  }

  async function loadScene(quality: RenderQuality, isWalking: boolean): Promise<void> {
    try {
      const library = await loadLibrary(quality, (share) => {
        const status = share < 0.45 ? INTRO.statuses.lighting : INTRO.statuses.shelving;
        progress.advance(INTRO_PROGRESS.sceneModule + share * INTRO_PROGRESS.sceneSpan, status);
      });
      // Stopped, or timed out, while loading: the home page has taken over.
      if (isStopped || playback) return;
      window.clearTimeout(timeout);
      progress.advance(1, INTRO.statuses.ready);
      if (isWalking) {
        playback = createWalkTimeline(elements, library.scene, measureRemainingWelcome());
      } else {
        library.scene.renderWalk({ progress: 1, stride: 0, elapsed: 0 });
        playback = createWelcomeExit(elements, measureRemainingWelcome(), "scene");
      }
    } catch (error) {
      reportError(error, "library intro");
      window.clearTimeout(timeout);
      releaseLibrary();
      fallBackToFlatShelf();
      enter("flat");
    }
  }

  if (variant.kind === "welcome") {
    applyShelfView("flat");
    progress.advance(INTRO_PROGRESS.sceneModule, INTRO.statuses.opening);
    enter("flat");
  } else {
    applyShelfView("scene");
    progress.advance(INTRO_PROGRESS.started, INTRO.statuses.opening, INTRO_PROGRESS.downloadCreep);
    timeout = window.setTimeout(() => enter("scene"), INTRO_LOAD_TIMEOUT_SECONDS * 1000);
    void loadScene(variant.quality, variant.kind === "walk");
  }

  return {
    stop() {
      if (isStopped) return;
      isStopped = true;
      window.clearTimeout(timeout);
      playback?.kill();
      releaseIntroElements(elements);
    },
  };
}
