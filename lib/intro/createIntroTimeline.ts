import { finishIntro } from "@/lib/intro/introLifecycle";
import type { LibraryScene } from "@/lib/intro/webgl/createLibraryScene";
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
  /** The lamp-lit dark behind the welcome screen. */
  readonly backdrop: HTMLElement;
  readonly welcome: HTMLElement;
  readonly progressBar: HTMLElement;
  readonly progressFill: HTMLElement;
  readonly status: HTMLElement;
  /** Where the WebGL canvas goes, under a vignette. */
  readonly canvasHost: HTMLElement;
  /** The real page's heading and bookcase, waiting under the overlay. */
  readonly stage: HTMLElement;
}

/** The most the walk's clock moves in one frame, however long the frame took. */
const MAX_FRAME_STEP_SECONDS = 1 / 20;

/** A running piece of the intro that can be stopped wherever it has got to. */
export interface IntroPlayback {
  kill(): void;
}

// As the intro ends, everything over the page dissolves while the real
// bookcase comes forward into place.
function addLanding(timeline: gsap.core.Timeline, elements: IntroElements, layers: readonly HTMLElement[], position: number | string): void {
  timeline
    .addLabel("landing", position)
    .to(layers, { opacity: 0, duration: INTRO_TIMINGS.landingFade, ease: INTRO_EASES.fade }, "landing")
    .fromTo(
      elements.stage,
      { scale: INTRO_LANDING_START_SCALE, transformOrigin: "50% 65%" },
      { scale: 1, duration: INTRO_TIMINGS.settle, ease: INTRO_EASES.land, immediateRender: false },
      "landing",
    )
    .call(finishIntro);
}

/** Without the walk: the welcome screen holds for its moment, then gives way to the site. */
export function createWelcomeExit(elements: IntroElements, delaySeconds: number): IntroPlayback {
  const timeline = gsap.timeline({ delay: delaySeconds });
  timeline.to(elements.welcome, { opacity: 0, y: -10, duration: INTRO_TIMINGS.welcomeExit, ease: INTRO_EASES.fade }, 0);
  addLanding(timeline, elements, [elements.backdrop], INTRO_TIMINGS.welcomeExit * 0.4);
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
 * the walk begins. The timeline runs on its own clock, advanced each frame by
 * at most MAX_FRAME_STEP_SECONDS: if the device stalls, the walk slows for a
 * moment instead of jumping ahead.
 */
export function createWalkTimeline(elements: IntroElements, scene: LibraryScene, delaySeconds: number): IntroPlayback {
  const walk = { progress: 0, stride: 0 };
  const walkStart = INTRO_TIMINGS.welcomeExit * 0.5;
  const timeline = gsap.timeline({ paused: true });

  timeline
    .to(elements.welcome, { opacity: 0, y: -10, duration: INTRO_TIMINGS.welcomeExit, ease: INTRO_EASES.fade }, 0)
    .fromTo(elements.canvasHost, { opacity: 0 }, { opacity: 1, duration: INTRO_TIMINGS.sceneFadeIn, ease: "power1.inOut" }, walkStart);
  addWalk(timeline, walk, walkStart);
  addLanding(timeline, elements, [elements.canvasHost, elements.backdrop], walkStart + INTRO_WALK_SECONDS - INTRO_TIMINGS.landingOverlap);

  function advance(_time: number, deltaMs: number): void {
    timeline.time(timeline.time() + Math.min(deltaMs / 1000, MAX_FRAME_STEP_SECONDS));
    scene.render({ ...walk, elapsed: Math.max(0, timeline.time() - walkStart) });
    if (timeline.progress() === 1) gsap.ticker.remove(advance);
  }
  const start = gsap.delayedCall(delaySeconds, () => gsap.ticker.add(advance));
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
  gsap.set(elements.stage, { clearProps: "transform,transformOrigin" });
}
