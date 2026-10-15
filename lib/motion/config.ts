// Every timing, easing and distance used by the motion layer lives here, so the
// whole site can be retuned from one place. GSAP durations are in seconds.

export const MOTION_EASES = {
  settle: "power3.out",
  draw: "expo.inOut",
  stamp: "expo.out",
  fade: "power2.out",
} as const;

export const REVEAL_START = "top 88%";
export const REVEAL_STAGGER_SECONDS = 0.09;
export const SCROLL_LINE_SCRUB_SECONDS = 0.6;
export const PARALLAX_SCRUB_SECONDS = 0.8;
export const READING_PROGRESS_SCRUB_SECONDS = 0.3;
export const DESKTOP_MEDIA_QUERY = "(min-width: 64rem)";
export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export const SMOOTH_SCROLL_LERP = 0.085;
export const SMOOTH_SCROLL_WHEEL_MULTIPLIER = 0.9;
/** Keeps anchor targets clear of the fixed masthead. */
export const ANCHOR_SCROLL_OFFSET_PX = -96;

export type RevealVariant = "rise" | "sheet" | "rule" | "seal";

interface RevealAnimation {
  readonly from: gsap.TweenVars;
  readonly to: gsap.TweenVars;
}

export const REVEAL_ANIMATIONS: Record<RevealVariant, RevealAnimation> = {
  rise: {
    from: { opacity: 0, y: 28 },
    to: { opacity: 1, y: 0, duration: 1.1, ease: MOTION_EASES.settle },
  },
  // A sheet of paper being laid down: it tips back from its top edge as it settles.
  sheet: {
    from: { opacity: 0, y: 64, rotationX: 9, transformPerspective: 1600, transformOrigin: "50% 0%" },
    to: { opacity: 1, y: 0, rotationX: 0, duration: 1.4, ease: MOTION_EASES.settle },
  },
  rule: {
    from: { scaleX: 0 },
    to: { scaleX: 1, duration: 1.4, ease: MOTION_EASES.draw },
  },
  // Waits for the letter to land, then presses down without any bounce.
  seal: {
    from: { opacity: 0, scale: 1.6, rotation: -16 },
    to: { opacity: 1, scale: 1, rotation: 0, duration: 0.9, delay: 0.55, ease: MOTION_EASES.stamp },
  },
};

/** Low-end devices get a plain fade: no transforms, shorter, no layers to composite. */
export const LOW_END_REVEAL_ANIMATION: RevealAnimation = {
  from: { opacity: 0 },
  to: { opacity: 1, duration: 0.6, ease: MOTION_EASES.fade },
};

// ─── Library intro ──────────────────────────────────────────────────────────

export interface IntroTimings {
  /** The camera's walk down the aisle. */
  readonly pan: number;
  /** How long before the pan ends the landing begins, so the two overlap. */
  readonly landingOverlap: number;
  readonly sceneFade: number;
  readonly settle: number;
  readonly spineDrop: number;
}

/** About 5 seconds end to end. */
export const FULL_INTRO_TIMINGS: IntroTimings = {
  pan: 4.4,
  landingOverlap: 1,
  sceneFade: 1.1,
  settle: 1.4,
  spineDrop: 0.8,
};

/** Low-end devices join the walk near its end: about 2.5 seconds. */
export const BRIEF_INTRO_TIMINGS: IntroTimings = {
  pan: 1.8,
  landingOverlap: 0.5,
  sceneFade: 0.7,
  settle: 0.9,
  spineDrop: 0.5,
};

export const INTRO_EASES = {
  pan: "power2.inOut",
  land: "power3.out",
  fade: "power2.inOut",
} as const;

/** How far the aisle travels, in viewport widths. Nearer and further layers scale this by their depth. */
export const INTRO_PAN_TRAVEL_VIEWPORTS = 2.4;
/** The brief walk starts this far along the full one, so both end on the same frame. */
export const INTRO_BRIEF_START_PROGRESS = 0.6;
/** A slow dolly back while the camera walks. */
export const INTRO_DOLLY_START_SCALE = 1.08;
/** The shelf arrives from the right, continuing the pan, as a fraction of the viewport width. */
export const INTRO_LANDING_OFFSET = 0.08;
export const INTRO_LANDING_START_SCALE = 1.04;
/** The books drop into their slots from this far above, as a percentage of their height. */
export const INTRO_SPINE_DROP_PERCENT = -14;
export const INTRO_SPINE_STAGGER_SECONDS = 0.07;
export const INTRO_DUST_START_DELAY_SECONDS = 0.3;
/** Reduced motion: hold the still library briefly, then crossfade to the shelf. */
export const INTRO_CROSSFADE_HOLD_SECONDS = 0.9;
export const INTRO_CROSSFADE_SECONDS = 0.6;
