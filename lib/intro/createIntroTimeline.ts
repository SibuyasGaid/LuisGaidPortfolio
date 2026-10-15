import { finishIntro } from "@/lib/intro/introLifecycle";
import {
  AISLE,
  measureDistanceFromEye,
  measureFog,
  measureOffScreenDistance,
  type PieceEdge,
  WALK_TRAVEL_VH,
} from "@/lib/intro/libraryGeometry";
import {
  BRIEF_INTRO_TIMINGS,
  FULL_INTRO_TIMINGS,
  INTRO_BRIEF_START_PROGRESS,
  INTRO_CROSSFADE_HOLD_SECONDS,
  INTRO_CROSSFADE_SECONDS,
  INTRO_EASES,
  INTRO_GLANCE_DEGREES,
  INTRO_LANDING_START_SCALE,
  INTRO_STEP_RISE_VH,
  INTRO_STEP_SECONDS,
  INTRO_WALK_PHASES,
  type IntroTimings,
} from "@/lib/motion/config";
import { gsap } from "@/lib/motion/gsap";

export interface IntroElements {
  readonly scene: HTMLElement;
  /** Turns and bobs like a head. */
  readonly camera: HTMLElement;
  /** Everything in the library; moving it toward the camera is the walk. */
  readonly world: HTMLElement;
  /** Every piece of the aisle, each carrying its depth in data-intro-segment. */
  readonly segments: readonly HTMLElement[];
  /** The real page's bookcase and heading, waiting under the scene. */
  readonly stage: HTMLElement;
}

/** full: the whole walk. brief: low-end devices. crossfade: reduced motion. */
export type IntroVariant = "full" | "brief" | "crossfade";

function convertVhToPx(vh: number): number {
  return (vh * window.innerHeight) / 100;
}

function isPieceEdge(value: string | undefined): value is PieceEdge {
  return value === "side" || value === "lamp";
}

// Darkens each piece of the aisle by its distance from the eye as the world
// moves, so the light falls away down the aisle and comes up as the walk
// passes, and hides each piece once all of it has left the screen.
function createDepthUpdater(elements: IntroElements): () => void {
  const aspectRatio = window.innerWidth / window.innerHeight;
  const pieces = elements.segments.map((piece) => {
    const edge = piece.dataset.introEdge;
    return {
      piece,
      shade: piece.querySelector<HTMLElement>(".aisle-shade"),
      z: Number(piece.dataset.introSegment) || 0,
      offScreenDistance: isPieceEdge(edge) ? measureOffScreenDistance(edge, aspectRatio) : 0,
    };
  });
  return () => {
    const travelVh = (Number(gsap.getProperty(elements.world, "z")) / window.innerHeight) * 100;
    for (const { piece, shade, z, offScreenDistance } of pieces) {
      const distance = measureDistanceFromEye(z, travelVh);
      if (shade) shade.style.opacity = String(measureFog(distance));
      const farEndDistance = distance + AISLE.segmentLength / 2;
      piece.style.visibility = farEndDistance < offScreenDistance ? "hidden" : "";
    }
  };
}

// Setting off, an even stride, then slowing to a stop. Each phase's speed
// meets the next one's, so the walk never lurches between them.
function addFullWalk(timeline: gsap.core.Timeline, world: HTMLElement, timings: IntroTimings): void {
  const distance = convertVhToPx(WALK_TRAVEL_VH);
  const setOffTime = timings.walk * INTRO_WALK_PHASES.setOff;
  const arriveTime = timings.walk * INTRO_WALK_PHASES.arrive;
  const strideTime = timings.walk - setOffTime - arriveTime;
  const speed = distance / (setOffTime / 2 + strideTime + arriveTime / 3);
  timeline
    .fromTo(world, { z: 0 }, { z: (speed * setOffTime) / 2, duration: setOffTime, ease: INTRO_EASES.setOff }, 0)
    .to(world, { z: `+=${speed * strideTime}`, duration: strideTime, ease: INTRO_EASES.stride })
    .to(world, { z: distance, duration: arriveTime, ease: INTRO_EASES.arrive });
}

// A walker's head: it rises and falls with each step and glances toward the
// shelves before looking ahead again as the room opens up.
function addHeadMotion(timeline: gsap.core.Timeline, camera: HTMLElement, timings: IntroTimings): void {
  const stepCount = Math.floor((timings.walk * 0.8) / INTRO_STEP_SECONDS / 2) * 2;
  timeline
    .fromTo(
      camera,
      { y: 0 },
      {
        y: convertVhToPx(INTRO_STEP_RISE_VH),
        duration: INTRO_STEP_SECONDS,
        ease: "sine.inOut",
        repeat: stepCount - 1,
        yoyo: true,
      },
      timings.walk * 0.08,
    )
    .fromTo(camera, { rotationY: 0 }, { rotationY: INTRO_GLANCE_DEGREES, duration: timings.walk * 0.45, ease: "sine.inOut" }, 0)
    .to(camera, { rotationY: 0, duration: timings.walk * 0.5, ease: "sine.inOut" }, timings.walk * 0.45);
}

// As the walk slows, the room dissolves onto the real bookcase, which carries
// on coming forward into place.
function addLanding(timeline: gsap.core.Timeline, elements: IntroElements, timings: IntroTimings): void {
  timeline
    .addLabel("landing", timings.walk - timings.landingOverlap)
    .to(elements.scene, { autoAlpha: 0, duration: timings.sceneFade, ease: INTRO_EASES.fade }, "landing")
    .fromTo(
      elements.stage,
      { scale: INTRO_LANDING_START_SCALE, transformOrigin: "50% 65%" },
      { scale: 1, duration: timings.settle, ease: INTRO_EASES.land, immediateRender: false },
      "landing",
    )
    .call(finishIntro);
}

function createCrossfade(elements: IntroElements): gsap.core.Timeline {
  return gsap
    .timeline({ delay: INTRO_CROSSFADE_HOLD_SECONDS })
    .to(elements.scene, { autoAlpha: 0, duration: INTRO_CROSSFADE_SECONDS, ease: "power1.inOut" })
    .call(finishIntro);
}

export function createIntroTimeline(elements: IntroElements, variant: IntroVariant): gsap.core.Timeline {
  if (variant === "crossfade") return createCrossfade(elements);

  const timeline = gsap.timeline({ onUpdate: createDepthUpdater(elements) });
  if (variant === "full") {
    addFullWalk(timeline, elements.world, FULL_INTRO_TIMINGS);
    addHeadMotion(timeline, elements.camera, FULL_INTRO_TIMINGS);
    addLanding(timeline, elements, FULL_INTRO_TIMINGS);
  } else {
    const distance = convertVhToPx(WALK_TRAVEL_VH);
    timeline.fromTo(
      elements.world,
      { z: distance * INTRO_BRIEF_START_PROGRESS },
      { z: distance, duration: BRIEF_INTRO_TIMINGS.walk, ease: INTRO_EASES.arrive },
      0,
    );
    addLanding(timeline, elements, BRIEF_INTRO_TIMINGS);
  }
  return timeline;
}

/** Puts the real page back exactly as the CSS lays it out, wherever the intro stopped. */
export function releaseIntroElements(elements: IntroElements): void {
  gsap.set(elements.stage, { clearProps: "transform,transformOrigin" });
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
