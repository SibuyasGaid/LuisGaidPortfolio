import { finishIntro } from "@/lib/intro/introLifecycle";
import {
  BRIEF_INTRO_TIMINGS,
  FULL_INTRO_TIMINGS,
  INTRO_BRIEF_START_PROGRESS,
  INTRO_CROSSFADE_HOLD_SECONDS,
  INTRO_CROSSFADE_SECONDS,
  INTRO_DOLLY_START_SCALE,
  INTRO_EASES,
  INTRO_LANDING_OFFSET,
  INTRO_LANDING_START_SCALE,
  INTRO_PAN_TRAVEL_VIEWPORTS,
  INTRO_SPINE_DROP_PERCENT,
  INTRO_SPINE_STAGGER_SECONDS,
  type IntroTimings,
} from "@/lib/motion/config";
import { gsap } from "@/lib/motion/gsap";

export interface IntroElements {
  readonly scene: HTMLElement;
  readonly camera: HTMLElement;
  /** Every parallax layer, each carrying its depth in data-intro-layer. */
  readonly layers: readonly HTMLElement[];
  /** The real page's shelf, waiting under the scene. */
  readonly stage: HTMLElement;
  readonly spines: readonly HTMLElement[];
}

/** full: the whole walk. brief: low-end devices. crossfade: reduced motion. */
export type IntroVariant = "full" | "brief" | "crossfade";

function readDepth(layer: HTMLElement): number {
  return Number(layer.dataset.introLayer) || 0;
}

function isDetailLayer(layer: HTMLElement): boolean {
  return layer.hasAttribute("data-intro-detail");
}

// Each layer slides left by the walk's length times its depth, which is all a
// sideways camera move is: near things pass quickly, far things barely move.
function addPan(
  timeline: gsap.core.Timeline,
  camera: HTMLElement,
  layers: readonly HTMLElement[],
  timings: IntroTimings,
  startProgress: number,
): void {
  const travel = window.innerWidth * INTRO_PAN_TRAVEL_VIEWPORTS;
  for (const layer of layers) {
    const distance = travel * readDepth(layer);
    timeline.fromTo(
      layer,
      { x: -distance * startProgress },
      { x: -distance, duration: timings.pan, ease: INTRO_EASES.pan },
      0,
    );
  }
  timeline.fromTo(
    camera,
    { scale: INTRO_DOLLY_START_SCALE },
    { scale: 1, duration: timings.pan, ease: INTRO_EASES.pan },
    0,
  );
}

// As the walk slows, the library dissolves and the real shelf carries on the
// same sideways motion into place, then its books drop into their slots.
function addLanding(timeline: gsap.core.Timeline, elements: IntroElements, timings: IntroTimings): void {
  timeline
    .addLabel("landing", timings.pan - timings.landingOverlap)
    .to(elements.scene, { autoAlpha: 0, duration: timings.sceneFade, ease: INTRO_EASES.fade }, "landing")
    .fromTo(
      elements.stage,
      { x: () => window.innerWidth * INTRO_LANDING_OFFSET, scale: INTRO_LANDING_START_SCALE },
      { x: 0, scale: 1, duration: timings.settle, ease: INTRO_EASES.land, immediateRender: false },
      "landing",
    )
    .to(
      elements.spines,
      { yPercent: 0, opacity: 1, duration: timings.spineDrop, ease: INTRO_EASES.land, stagger: INTRO_SPINE_STAGGER_SECONDS },
      `landing+=${timings.sceneFade * 0.35}`,
    )
    .call(finishIntro);
}

// Hidden under the opaque scene from the start, so nothing pops when they drop.
// The layers' will-change comes from the CSS while the intro plays.
function prepareShelf(elements: IntroElements): void {
  gsap.set(elements.spines, { yPercent: INTRO_SPINE_DROP_PERCENT, opacity: 0 });
}

function createCrossfade(elements: IntroElements): gsap.core.Timeline {
  return gsap
    .timeline({ delay: INTRO_CROSSFADE_HOLD_SECONDS })
    .to(elements.scene, { autoAlpha: 0, duration: INTRO_CROSSFADE_SECONDS, ease: "power1.inOut" })
    .call(finishIntro);
}

export function createIntroTimeline(elements: IntroElements, variant: IntroVariant): gsap.core.Timeline {
  if (variant === "crossfade") return createCrossfade(elements);

  const isFull = variant === "full";
  const layers = isFull ? elements.layers : elements.layers.filter((layer) => !isDetailLayer(layer));
  if (!isFull) gsap.set(elements.layers.filter(isDetailLayer), { autoAlpha: 0 });
  prepareShelf(elements);

  const timings = isFull ? FULL_INTRO_TIMINGS : BRIEF_INTRO_TIMINGS;
  const timeline = gsap.timeline();
  addPan(timeline, elements.camera, layers, timings, isFull ? 0 : INTRO_BRIEF_START_PROGRESS);
  addLanding(timeline, elements, timings);
  return timeline;
}

/** Puts the real page back exactly as the CSS lays it out, wherever the intro stopped. */
export function releaseIntroElements(elements: IntroElements): void {
  gsap.set([elements.stage, ...elements.spines], { clearProps: "transform,opacity" });
}

/** Dust drifting through the lamp light; endless, so it is stopped separately when the intro ends. */
export function createDustDrift(motes: readonly HTMLElement[]): gsap.core.Tween[] {
  return motes.map((mote, index) =>
    gsap.fromTo(
      mote,
      { opacity: 0, y: 0, x: 0 },
      {
        opacity: 0.55 + (index % 3) * 0.12,
        y: -40 - (index % 4) * 18,
        x: (index % 2 === 0 ? 1 : -1) * (10 + (index % 5) * 4),
        duration: 5 + (index % 4),
        delay: (index % 5) * 0.35,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      },
    ),
  );
}
