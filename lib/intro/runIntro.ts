import { INTRO } from "@/content/portfolio";
import { chooseIntroVariant } from "@/lib/intro/chooseIntroVariant";
import {
  createWalkTimeline,
  createWelcomeExit,
  releaseIntroElements,
  type IntroElements,
  type IntroPlayback,
} from "@/lib/intro/createIntroTimeline";
import { markIntroRunning } from "@/lib/intro/introLifecycle";
import type { LibraryScene } from "@/lib/intro/webgl/createLibraryScene";
import { createWelcomeProgress } from "@/lib/intro/welcomeProgress";
import {
  INTRO_DISPOSE_DELAY_MS,
  INTRO_LOAD_TIMEOUT_SECONDS,
  INTRO_PROGRESS,
  INTRO_WELCOME_MIN_SECONDS,
} from "@/lib/motion/config";
import { reportError } from "@/lib/reportError";

export interface RunningIntro {
  stop(): void;
}

/** Seconds left until the welcome screen has been up for its minimum, counted from the page's first moments. */
function measureRemainingWelcome(): number {
  return Math.max(0, INTRO_WELCOME_MIN_SECONDS - performance.now() / 1000);
}

// The welcome screen shows from the first paint. Behind it, the WebGL library
// downloads and builds in stages that the progress bar reports; once it is
// ready (and the welcome has had its moment) the walk begins. Anything that
// goes wrong, or takes too long, hands over to the site instead.
export function runIntro(elements: IntroElements): RunningIntro {
  markIntroRunning();
  const progress = createWelcomeProgress(elements.progressBar, elements.progressFill, elements.status);
  const variant = chooseIntroVariant();
  let playback: IntroPlayback | null = null;
  let scene: LibraryScene | null = null;
  let isStopped = false;
  let timeout = 0;

  function enterWithoutWalk(): void {
    if (isStopped || playback) return;
    progress.advance(1, INTRO.statuses.ready);
    playback = createWelcomeExit(elements, measureRemainingWelcome());
  }

  async function loadAndWalk(quality: Extract<typeof variant, { kind: "walk" }>["quality"]): Promise<void> {
    try {
      const { createLibraryScene } = await import("@/lib/intro/webgl/createLibraryScene");
      if (isStopped || playback) return;
      progress.advance(INTRO_PROGRESS.sceneModule, INTRO.statuses.lighting);
      const built = await createLibraryScene(elements.canvasHost, quality, (share) => {
        const status = share < 0.45 ? INTRO.statuses.lighting : INTRO.statuses.shelving;
        progress.advance(INTRO_PROGRESS.sceneModule + share * INTRO_PROGRESS.sceneSpan, status);
      });
      // Stopped, or timed out, while building: the site has already taken over.
      if (isStopped || playback) {
        built.dispose();
        return;
      }
      scene = built;
      window.clearTimeout(timeout);
      progress.advance(1, INTRO.statuses.ready);
      playback = createWalkTimeline(elements, built, measureRemainingWelcome());
    } catch (error) {
      reportError(error, "library intro");
      enterWithoutWalk();
    }
  }

  if (variant.kind === "welcome") {
    progress.advance(INTRO_PROGRESS.sceneModule, INTRO.statuses.opening);
    enterWithoutWalk();
  } else {
    progress.advance(INTRO_PROGRESS.started, INTRO.statuses.opening, INTRO_PROGRESS.downloadCreep);
    timeout = window.setTimeout(enterWithoutWalk, INTRO_LOAD_TIMEOUT_SECONDS * 1000);
    void loadAndWalk(variant.quality);
  }

  return {
    stop() {
      if (isStopped) return;
      isStopped = true;
      window.clearTimeout(timeout);
      playback?.kill();
      releaseIntroElements(elements);
      // The canvas goes once the overlay has finished fading over it.
      const builtScene = scene;
      if (builtScene) window.setTimeout(() => builtScene.dispose(), INTRO_DISPOSE_DELAY_MS);
    },
  };
}
