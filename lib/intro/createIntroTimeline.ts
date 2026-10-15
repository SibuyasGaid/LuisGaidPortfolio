import { finishIntro } from "@/lib/intro/introLifecycle";
import {
  BRIEF_INTRO_TIMINGS,
  DESKTOP_MEDIA_QUERY,
  FULL_INTRO_TIMINGS,
  INTRO_BRIEF_START_SCALE,
  INTRO_CROSSFADE_HOLD_SECONDS,
  INTRO_CROSSFADE_SECONDS,
  INTRO_DIM_FOCUS,
  INTRO_DIM_FULL,
  INTRO_DOLLY_SCALE,
  INTRO_EASES,
  INTRO_FOREGROUND_PARALLAX,
  INTRO_PUSH_IN_SCALE,
  INTRO_WALL_PARALLAX,
  type IntroTimings,
} from "@/lib/motion/config";
import { gsap } from "@/lib/motion/gsap";

export interface IntroElements {
  readonly overlay: HTMLElement;
  readonly scene: HTMLElement;
  readonly camera: HTMLElement;
  readonly wall: HTMLElement;
  readonly shelf: HTMLElement;
  readonly foreground: HTMLElement;
  readonly glow: HTMLElement;
  readonly dim: HTMLElement;
  readonly heroSpine: HTMLElement;
  readonly volume: HTMLElement;
  readonly cover: HTMLElement;
  readonly realBook: HTMLElement;
}

/** full: the whole sequence. brief: low-end devices. crossfade: reduced motion. */
export type IntroVariant = "full" | "brief" | "crossfade";

interface FitTransform {
  readonly x: number;
  readonly y: number;
  readonly scale: number;
}

function readCenter(element: HTMLElement): { x: number; y: number } {
  const rect = element.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function readNumber(element: HTMLElement, property: string): number {
  return Number(gsap.getProperty(element, property)) || 0;
}

function measurePanDistance(heroSpine: HTMLElement): number {
  return readCenter(heroSpine).x - window.innerWidth / 2;
}

// Scales the open book (uniformly) so its spread exactly covers the real book
// on the page, measured in screen space after every transform so far.
function measureFitOntoRealBook(elements: IntroElements, isSpread: boolean): FitTransform {
  const volumeRect = elements.volume.getBoundingClientRect();
  const spreadLeft = isSpread ? elements.cover.getBoundingClientRect().left : volumeRect.left;
  const spreadWidth = volumeRect.right - spreadLeft;
  const targetRect = elements.realBook.getBoundingClientRect();
  const scaleFactor = targetRect.width / spreadWidth;
  const centerX = volumeRect.left + volumeRect.width / 2;
  const centerY = volumeRect.top + volumeRect.height / 2;
  const scaledLeft = centerX + (spreadLeft - centerX) * scaleFactor;
  const scaledTop = centerY + (volumeRect.top - centerY) * scaleFactor;
  return {
    x: readNumber(elements.volume, "x") + targetRect.left - scaledLeft,
    y: readNumber(elements.volume, "y") + targetRect.top - scaledTop,
    scale: readNumber(elements.volume, "scale") * scaleFactor,
  };
}

function addCameraPan(timeline: gsap.core.Timeline, elements: IntroElements, timings: IntroTimings): void {
  let panDistance = 0;
  timeline
    .call(() => {
      panDistance = measurePanDistance(elements.heroSpine);
    })
    .addLabel("pan")
    .to(elements.shelf, { x: () => -panDistance, duration: timings.pan, ease: INTRO_EASES.camera }, "pan")
    .to(elements.wall, { x: () => -panDistance * INTRO_WALL_PARALLAX, duration: timings.pan, ease: INTRO_EASES.camera }, "pan")
    .to(
      elements.foreground,
      { x: () => -panDistance * INTRO_FOREGROUND_PARALLAX, duration: timings.pan, ease: INTRO_EASES.camera },
      "pan",
    )
    .to(elements.camera, { scale: INTRO_DOLLY_SCALE, duration: timings.pan, ease: INTRO_EASES.camera }, "pan")
    .to(elements.glow, { opacity: 1, duration: timings.pan, ease: "sine.inOut" }, "pan");
}

function addPushIn(timeline: gsap.core.Timeline, elements: IntroElements, timings: IntroTimings, position: string): void {
  timeline
    .addLabel("push", position)
    .to(elements.camera, { scale: INTRO_PUSH_IN_SCALE, duration: timings.pushIn, ease: INTRO_EASES.heavy }, "push")
    .to(elements.dim, { opacity: INTRO_DIM_FOCUS, duration: timings.pushIn, ease: "sine.inOut" }, "push");
}

function addBookPull(timeline: gsap.core.Timeline, elements: IntroElements, timings: IntroTimings): void {
  timeline
    .addLabel("pull", "-=0.25")
    .to(elements.heroSpine, { z: 70, yPercent: -6, duration: timings.pull, ease: INTRO_EASES.lift }, "pull");
}

// The spine turns away as the cover turns in: two flat faces sharing one
// rotation read as a single solid book turning to face the reader.
function addBookTurn(timeline: gsap.core.Timeline, elements: IntroElements, timings: IntroTimings): void {
  let spineCenter = { x: 0, y: 0 };
  let spineHeight = 0;
  timeline
    .addLabel("turn")
    .call(
      () => {
        spineCenter = readCenter(elements.heroSpine);
        spineHeight = elements.heroSpine.getBoundingClientRect().height;
      },
      [],
      "turn",
    )
    .to(elements.heroSpine, { rotationY: 88, duration: timings.turn * 0.5, ease: "power2.in" }, "turn")
    .set(elements.heroSpine, { autoAlpha: 0 }, `turn+=${timings.turn * 0.5}`)
    .set(
      elements.volume,
      {
        x: () => spineCenter.x - window.innerWidth / 2,
        y: () => spineCenter.y - window.innerHeight / 2,
        scale: () => spineHeight / elements.volume.offsetHeight,
        rotationY: -88,
        autoAlpha: 1,
      },
      "turn",
    )
    .to(
      elements.volume,
      { x: 0, y: 0, scale: 1, rotationY: 0, duration: timings.turn, ease: INTRO_EASES.heavy },
      "turn+=0.05",
    )
    .to(elements.dim, { opacity: INTRO_DIM_FULL, duration: timings.turn, ease: "sine.inOut" }, "turn");
}

function addCoverOpen(timeline: gsap.core.Timeline, elements: IntroElements, timings: IntroTimings, isSpread: boolean): void {
  timeline
    .addLabel("open", "-=0.2")
    .to(elements.cover, { rotationY: -180, duration: timings.open, ease: INTRO_EASES.heavy }, "open");
  // On the two-page layout the book slides right so the open spread stays centred.
  if (isSpread) {
    timeline.to(
      elements.volume,
      { x: () => elements.volume.offsetWidth / 2, duration: timings.open, ease: INTRO_EASES.heavy },
      "open",
    );
  }
}

// The open book glides onto the real one while the library fades away, then
// dissolves, so the real page appears to ink itself onto the blank paper.
function addHandoff(timeline: gsap.core.Timeline, elements: IntroElements, timings: IntroTimings, isSpread: boolean): void {
  let fit: FitTransform = { x: 0, y: 0, scale: 1 };
  timeline
    .addLabel("handoff")
    .call(
      () => {
        fit = measureFitOntoRealBook(elements, isSpread);
      },
      [],
      "handoff",
    )
    .to(
      elements.volume,
      { x: () => fit.x, y: () => fit.y, scale: () => fit.scale, duration: timings.handoff, ease: INTRO_EASES.heavy },
      "handoff",
    )
    .to(elements.scene, { autoAlpha: 0, duration: timings.handoff, ease: "power2.inOut" }, "handoff")
    .to(elements.volume, { autoAlpha: 0, duration: timings.fadeOut, ease: "power2.out" }, `handoff+=${timings.handoff - 0.1}`)
    .call(finishIntro);
}

function prepareScene(elements: IntroElements, layers: readonly HTMLElement[]): void {
  const spineCenterY = readCenter(elements.heroSpine).y;
  gsap.set(layers, { willChange: "transform" });
  // The camera zooms on the point where the PORTFOLIO spine will stop.
  gsap.set(elements.camera, { transformOrigin: `50% ${spineCenterY}px` });
  gsap.set(elements.heroSpine, { transformPerspective: 900 });
  gsap.set(elements.volume, { xPercent: -50, yPercent: -50 });
}

function createCrossfade(elements: IntroElements): gsap.core.Timeline {
  return gsap
    .timeline({ delay: INTRO_CROSSFADE_HOLD_SECONDS })
    .to(elements.overlay, { autoAlpha: 0, duration: INTRO_CROSSFADE_SECONDS, ease: "power1.inOut" })
    .call(finishIntro);
}

export function createIntroTimeline(elements: IntroElements, variant: IntroVariant): gsap.core.Timeline {
  if (variant === "crossfade") return createCrossfade(elements);

  const isSpread = window.matchMedia(DESKTOP_MEDIA_QUERY).matches;
  const layers = [elements.camera, elements.shelf, elements.wall, elements.foreground, elements.heroSpine, elements.volume, elements.cover];
  prepareScene(elements, layers);

  const timeline = gsap.timeline();

  if (variant === "full") {
    addCameraPan(timeline, elements, FULL_INTRO_TIMINGS);
    addPushIn(timeline, elements, FULL_INTRO_TIMINGS, `pan+=${FULL_INTRO_TIMINGS.pan - 0.6}`);
  } else {
    // Start already in front of the book, without the pan or the foreground.
    gsap.set(elements.foreground, { autoAlpha: 0 });
    gsap.set(elements.shelf, { x: -measurePanDistance(elements.heroSpine) });
    gsap.set(elements.camera, { scale: INTRO_BRIEF_START_SCALE });
    addPushIn(timeline, elements, BRIEF_INTRO_TIMINGS, "0");
  }

  const timings = variant === "full" ? FULL_INTRO_TIMINGS : BRIEF_INTRO_TIMINGS;
  addBookPull(timeline, elements, timings);
  addBookTurn(timeline, elements, timings);
  addCoverOpen(timeline, elements, timings, isSpread);
  addHandoff(timeline, elements, timings, isSpread);
  return timeline;
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
