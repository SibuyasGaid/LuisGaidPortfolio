import { finishIntro } from "@/lib/intro/introLifecycle";
import { markWalkSeen } from "@/lib/library/libraryStage";
import type { LibraryScene } from "@/lib/library/webgl/createLibraryScene";
import {
  INTRO_EASES,
  INTRO_LANDING_START_SCALE,
  INTRO_TIMINGS,
  INTRO_WALK_PHASES,
  INTRO_WALK_SECONDS,
} from "@/lib/motion/config";
import { gsap } from "@/lib/motion/gsap";

export interface IntroElements {
  readonly overlay: HTMLElement;
  /** The lamp-lit dark behind the welcome screen, over the library. */
  readonly backdrop: HTMLElement;
  readonly welcome: HTMLElement;
  readonly progressBar: HTMLElement;
  readonly progressFill: HTMLElement;
  readonly status: HTMLElement;
  readonly skip: HTMLElement;
  /** The poster of the grand bookcase under the overlay, which settles into place where the library does not run. */
  readonly poster: HTMLElement;
  /** The navbar, heading, shading and shelf links laid over the library, held back while the intro plays. */
  readonly chrome: readonly HTMLElement[];
}

/** Where the intro lands: on the WebGL library, or on the poster of it. */
export type IntroLanding = "scene" | "flat";

/** The most the walk's clock moves in one frame, however long the frame took. */
const MAX_FRAME_STEP_SECONDS = 1 / 20;

/** A running piece of the intro that can be stopped wherever it has got to. */
export interface IntroPlayback {
  kill(): void;
}

// As the intro ends, whatever is still over the page dissolves and the page's
// navbar, heading and links rise into the view of the grand bookcase. Over
// the poster (no walk to arrive by), the bookcase also settles into place.
function addLanding(
  timeline: gsap.core.Timeline,
  elements: IntroElements,
  layers: readonly HTMLElement[],
  position: number | string,
  landing: IntroLanding,
): void {
  timeline.addLabel("landing", position);
  // The skip button goes first, so it never sits over the navbar rising beneath it.
  timeline.to([elements.skip, ...layers], { opacity: 0, duration: INTRO_TIMINGS.landingFade, ease: INTRO_EASES.fade }, "landing");
  if (landing === "flat") {
    timeline.fromTo(
      elements.poster,
      { scale: INTRO_LANDING_START_SCALE, transformOrigin: "50% 55%" },
      { scale: 1, duration: INTRO_TIMINGS.settle, ease: INTRO_EASES.land, immediateRender: false },
      "landing",
    );
  }
  timeline.fromTo(
    elements.chrome,
    { opacity: 0, y: 14 },
    { opacity: 1, y: 0, duration: INTRO_TIMINGS.settle, ease: INTRO_EASES.land, stagger: 0.08, immediateRender: false },
    "landing",
  );
  timeline.call(finishIntro);
}

/** Without the walk: the welcome screen holds for its moment, then gives way to the site. */
export function createWelcomeExit(elements: IntroElements, delaySeconds: number, landing: IntroLanding): IntroPlayback {
  const timeline = gsap.timeline({ delay: delaySeconds });
  timeline.to(elements.welcome, { opacity: 0, y: -10, duration: INTRO_TIMINGS.welcomeExit, ease: INTRO_EASES.fade }, 0);
  addLanding(timeline, elements, [elements.backdrop], INTRO_TIMINGS.welcomeExit * 0.4, landing);
  return timeline;
}

// Setting off, an even stride, then slowing to a stop. Each phase's speed
// meets the next one's, so the walk never lurches between them, and the
// footsteps swell and fade with the stride.
function addWalk(timeline: gsap.core.Timeline, walk: { progress: number; stride: number }, start: number): void {
  const setOffTime = INTRO_WALK_SECONDS * INTRO_WALK_PHASES.setOff;
  const arriveTime = INTRO_WALK_SECONDS * INTRO_WALK_PHASES.arrive;
  const strideTime = INTRO_WALK_SECONDS - setOffTime - arriveTime;
  const speed = 1 / (setOffTime / 2 + strideTime + arriveTime / 3);
  timeline
    .to(walk, { progress: (speed * setOffTime) / 2, duration: setOffTime, ease: INTRO_EASES.setOff }, start)
    .to(walk, { progress: (speed * setOffTime) / 2 + speed * strideTime, duration: strideTime, ease: INTRO_EASES.stride })
    .to(walk, { progress: 1, duration: arriveTime, ease: INTRO_EASES.arrive })
    .to(walk, { stride: 1, duration: setOffTime, ease: "power1.out" }, start)
    .to(walk, { stride: 0, duration: arriveTime, ease: "power2.out" }, start + setOffTime + strideTime);
}

/**
 * The welcome screen steps aside, the library fades up out of the dark, and
 * the walk begins, ending where the home page frames the grand bookcase. The
 * timeline runs on its own clock, advanced each frame by at most
 * MAX_FRAME_STEP_SECONDS: if the device stalls, the walk slows for a moment
 * instead of jumping ahead.
 */
export function createWalkTimeline(elements: IntroElements, scene: LibraryScene, delaySeconds: number): IntroPlayback {
  const walk = { progress: 0, stride: 0 };
  const walkStart = INTRO_TIMINGS.welcomeExit * 0.5;
  const timeline = gsap.timeline({ paused: true });

  timeline
    .to(elements.welcome, { opacity: 0, y: -10, duration: INTRO_TIMINGS.welcomeExit, ease: INTRO_EASES.fade }, 0)
    .to(elements.backdrop, { opacity: 0, duration: INTRO_TIMINGS.sceneFadeIn, ease: "power1.inOut" }, walkStart);
  addWalk(timeline, walk, walkStart);
  addLanding(timeline, elements, [], walkStart + INTRO_WALK_SECONDS - INTRO_TIMINGS.landingOverlap, "scene");

  function advance(_time: number, deltaMs: number): void {
    timeline.time(timeline.time() + Math.min(deltaMs / 1000, MAX_FRAME_STEP_SECONDS));
    scene.renderWalk({ ...walk, elapsed: Math.max(0, timeline.time() - walkStart) });
    if (timeline.progress() === 1) gsap.ticker.remove(advance);
  }
  // The walk's first frame is drawn before the backdrop lifts, so nothing old shows through.
  scene.renderWalk({ ...walk, elapsed: 0 });
  const start = gsap.delayedCall(delaySeconds, () => {
    markWalkSeen();
    gsap.ticker.add(advance);
  });
  return {
    kill() {
      start.kill();
      gsap.ticker.remove(advance);
      timeline.kill();
    },
  };
}

/** Puts the real page back exactly as the CSS lays it out, wherever the intro stopped. */
export function releaseIntroElements(elements: IntroElements): void {
  gsap.set(elements.poster, { clearProps: "transform,transformOrigin" });
  gsap.set(elements.chrome, { clearProps: "opacity,transform" });
}
