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
import { promptEntry, type EntryPrompt } from "@/lib/intro/entryPrompt";
import { finishIntro, INTRO_PROMPT_ATTRIBUTE, markIntroRunning } from "@/lib/intro/introLifecycle";
import { applyShelfView, fallBackToFlatShelf } from "@/lib/library/chooseShelfView";
import { getLoadedLibrary, loadLibrary, releaseLibrary, type Library } from "@/lib/library/libraryStage";
import type { RenderQuality } from "@/lib/library/webgl/createLibraryScene";
import { createWelcomeProgress } from "@/lib/intro/welcomeProgress";
import {
  INTRO_AFTER_ENTRY_MAX_SECONDS,
  INTRO_ENTRY_PAUSE_SECONDS,
  INTRO_LOAD_TIMEOUT_SECONDS,
  INTRO_PROGRESS,
  INTRO_WELCOME_MIN_SECONDS,
} from "@/lib/motion/config";
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
  // A rewind was asked for with a click, so it plays straight through, with no way in to offer.
  document.documentElement.removeAttribute(INTRO_PROMPT_ATTRIBUTE);
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
// downloads and builds in stages that the progress bar reports. Once it is
// ready (and the welcome has had its moment), or once loading has taken too
// long, or failed, the card offers the way in, and the intro waits for the
// visitor's click: it is what lets the sound play with the walk. Then the
// walk begins, and the library stays on as the home page. Where the library
// failed, the poster of it is the shelf; where it was still loading, it fades
// up whenever it is ready.
export function runIntro(elements: IntroElements, options: { readonly isRewind?: boolean } = {}): RunningIntro {
  if (options.isRewind) return runRewind(elements);
  markIntroRunning();
  const progress = createWelcomeProgress(elements.progressBar, elements.progressFill, elements.status);
  const variant = chooseIntroVariant();
  let library: Library | null = null;
  let landing: IntroLanding = variant.kind === "welcome" ? "flat" : "scene";
  let prompt: EntryPrompt | null = null;
  let playback: IntroPlayback | null = null;
  let isStopped = false;
  let timeout = 0;
  let ceiling = 0;

  // Decided at the click, from whatever is ready by then.
  function begin(): void {
    if (isStopped || playback) return;
    if (library && variant.kind === "walk") {
      playback = createWalkTimeline(elements, library.scene, INTRO_ENTRY_PAUSE_SECONDS);
    } else {
      library?.scene.renderWalk({ progress: 1, stride: 0, elapsed: 0 });
      playback = createWelcomeExit(elements, INTRO_ENTRY_PAUSE_SECONDS, landing);
    }
    ceiling = window.setTimeout(finishIntro, INTRO_AFTER_ENTRY_MAX_SECONDS * 1000);
  }

  function offerEntry(): void {
    if (isStopped || prompt) return;
    window.clearTimeout(timeout);
    progress.advance(1, INTRO.statuses.ready);
    prompt = promptEntry(elements, measureRemainingWelcome(), begin);
  }

  async function loadScene(quality: RenderQuality): Promise<void> {
    try {
      library = await loadLibrary(quality, (share) => {
        if (prompt) return;
        const status = share < 0.45 ? INTRO.statuses.lighting : INTRO.statuses.shelving;
        progress.advance(INTRO_PROGRESS.sceneModule + share * INTRO_PROGRESS.sceneSpan, status);
      });
      if (isStopped) return;
      offerEntry();
    } catch (error) {
      reportError(error, "library intro");
      library = null;
      landing = "flat";
      releaseLibrary();
      fallBackToFlatShelf();
      offerEntry();
    }
  }

  if (variant.kind === "welcome") {
    applyShelfView("flat");
    progress.advance(INTRO_PROGRESS.sceneModule, INTRO.statuses.opening);
    offerEntry();
  } else {
    applyShelfView("scene");
    progress.advance(INTRO_PROGRESS.started, INTRO.statuses.opening, INTRO_PROGRESS.downloadCreep);
    timeout = window.setTimeout(offerEntry, INTRO_LOAD_TIMEOUT_SECONDS * 1000);
    void loadScene(variant.quality);
  }

  return {
    stop() {
      if (isStopped) return;
      isStopped = true;
      window.clearTimeout(timeout);
      window.clearTimeout(ceiling);
      prompt?.cancel();
      playback?.kill();
      releaseIntroElements(elements);
    },
  };
}
