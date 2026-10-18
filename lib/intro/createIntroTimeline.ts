import { finishIntro } from "@/lib/intro/introLifecycle";
import { markWalkSeen } from "@/lib/library/libraryStage";
import type { LibraryScene } from "@/lib/library/webgl/createLibraryScene";
import {
  INTRO_EASES,
  INTRO_LANDING_START_SCALE,
  INTRO_REWIND,
  INTRO_TIMINGS,
  INTRO_WALK_PHASES,
  INTRO_WALK_SECONDS,
  WALK_STEP_FREQUENCY_HZ,
} from "@/lib/motion/config";
import { gsap } from "@/lib/motion/gsap";
import { playCue } from "@/lib/sound/sound";

export interface IntroElements {
  readonly overlay: HTMLElement;
  /** The lamp-lit dark behind the welcome screen, over the library. */
  readonly backdrop: HTMLElement;
  readonly welcome: HTMLElement;
  readonly progressBar: HTMLElement;
  readonly progressFill: HTMLElement;
  readonly status: HTMLElement;
  /** The sound and skip buttons, in the corner. */
  readonly controls: HTMLElement;
  /** The way in, offered once the library is ready. */
  readonly enter: HTMLElement;
  readonly enterSilently: HTMLElement;
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
/** Below this share of a full stride (setting off, slowing to a stop) a step is too light to hear. */
const MIN_AUDIBLE_STRIDE = 0.12;
/** Footsteps fall a little to one side, then the other. */
const FOOTSTEP_PAN = 0.25;

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
  // The buttons go first, so they never sit over the navbar rising beneath them.
  timeline.to([elements.controls, ...layers], { opacity: 0, duration: INTRO_TIMINGS.landingFade, ease: INTRO_EASES.fade }, "landing");
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

function addWelcomeExit(timeline: gsap.core.Timeline, elements: IntroElements, position: number, landing: IntroLanding): void {
  // The library's door opens as the welcome card gives way.
  timeline.call(playCue, ["doorOpen"], position);
  timeline.to(elements.welcome, { opacity: 0, y: -10, duration: INTRO_TIMINGS.welcomeExit, ease: INTRO_EASES.fade }, position);
  addLanding(timeline, elements, [elements.backdrop], position + INTRO_TIMINGS.welcomeExit * 0.4, landing);
}

/** The welcome card returning over the dark, as a rewind brings it back. */
function addWelcomeReturn(timeline: gsap.core.Timeline, elements: IntroElements, position: number): void {
  timeline
    .fromTo(elements.backdrop, { opacity: 0 }, { opacity: 1, duration: INTRO_REWIND.cardIn, ease: "power1.in" }, position)
    .fromTo(
      elements.welcome,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: INTRO_REWIND.cardIn, ease: INTRO_EASES.land },
      position + INTRO_REWIND.cardIn * 0.5,
    );
}

/** Without the walk: the welcome screen holds for its moment, then gives way to the site. */
export function createWelcomeExit(elements: IntroElements, delaySeconds: number, landing: IntroLanding): IntroPlayback {
  const timeline = gsap.timeline({ delay: delaySeconds });
  addWelcomeExit(timeline, elements, 0, landing);
  return timeline;
}

/** A rewind where there is no walk to play: the welcome card returns, holds, and gives way to the shelf again. */
export function createWelcomeRewind(elements: IntroElements, landing: IntroLanding): IntroPlayback {
  const timeline = gsap.timeline();
  addWelcomeReturn(timeline, elements, 0);
  addWelcomeExit(timeline, elements, INTRO_REWIND.cardIn * 1.5 + INTRO_REWIND.hold, landing);
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
 * Plays a footstep each time the walk lands one (the moment the eye bobs
 * lowest, in walkCamera), as loud as the stride is full. Returns the steps
 * taken so far.
 */
function playFootsteps(elapsed: number, stride: number, stepsTaken: number): number {
  const steps = Math.floor(elapsed * WALK_STEP_FREQUENCY_HZ);
  if (steps > stepsTaken && stride > MIN_AUDIBLE_STRIDE) {
    playCue("footstep", { gain: stride, pan: steps % 2 === 0 ? -FOOTSTEP_PAN : FOOTSTEP_PAN });
  }
  return steps;
}

/**
 * The welcome screen steps aside, the library fades up out of the dark, and
 * the walk begins, ending where the home page frames the grand bookcase. The
 * timeline runs on its own clock, advanced each frame by at most
 * MAX_FRAME_STEP_SECONDS: if the device stalls, the walk slows for a moment
 * instead of jumping ahead.
 *
 * Rewound from the landing page, it first flies the camera back up the aisle
 * from the bookcase to the door (facing the room the whole way, as a film run
 * backwards) while the welcome card returns over it, then plays as before.
 */
export function createWalkTimeline(
  elements: IntroElements,
  scene: LibraryScene,
  delaySeconds: number,
  options: { readonly isRewind?: boolean } = {},
): IntroPlayback {
  const walk = { progress: options.isRewind ? 1 : 0, stride: 0 };
  const timeline = gsap.timeline({ paused: true });
  let welcomeExit = 0;
  if (options.isRewind) {
    timeline
      .call(playCue, ["rewind", { duration: INTRO_REWIND.flyBack }], 0)
      .to(walk, { progress: 0, duration: INTRO_REWIND.flyBack, ease: "power2.inOut" }, 0);
    addWelcomeReturn(timeline, elements, INTRO_REWIND.flyBack - INTRO_REWIND.cardIn * 0.7);
    welcomeExit = INTRO_REWIND.flyBack + INTRO_REWIND.cardIn * 0.8 + INTRO_REWIND.hold;
  }
  const walkStart = welcomeExit + INTRO_TIMINGS.welcomeExit * 0.5;

  // The library's door opens as the welcome card gives way.
  timeline
    .call(playCue, ["doorOpen"], welcomeExit)
    .to(elements.welcome, { opacity: 0, y: -10, duration: INTRO_TIMINGS.welcomeExit, ease: INTRO_EASES.fade }, welcomeExit)
    .to(elements.backdrop, { opacity: 0, duration: INTRO_TIMINGS.sceneFadeIn, ease: "power1.inOut" }, walkStart);
  addWalk(timeline, walk, walkStart);
  addLanding(timeline, elements, [], walkStart + INTRO_WALK_SECONDS - INTRO_TIMINGS.landingOverlap, "scene");

  let stepsTaken = 0;
  function advance(_time: number, deltaMs: number): void {
    timeline.time(timeline.time() + Math.min(deltaMs / 1000, MAX_FRAME_STEP_SECONDS));
    const elapsed = Math.max(0, timeline.time() - walkStart);
    scene.renderWalk({ ...walk, elapsed });
    stepsTaken = playFootsteps(elapsed, walk.stride, stepsTaken);
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
