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
  readonly pan: number;
  readonly pushIn: number;
  readonly pull: number;
  readonly turn: number;
  readonly open: number;
  readonly handoff: number;
  readonly fadeOut: number;
}

/** About 6.5 seconds end to end. */
export const FULL_INTRO_TIMINGS: IntroTimings = {
  pan: 2.6,
  pushIn: 1.2,
  pull: 0.6,
  turn: 1.1,
  open: 1.2,
  handoff: 0.9,
  fadeOut: 0.45,
};

/** Low-end devices start already in front of the book: about 3 seconds. */
export const BRIEF_INTRO_TIMINGS: IntroTimings = {
  pan: 0,
  pushIn: 0.7,
  pull: 0.35,
  turn: 0.75,
  open: 0.75,
  handoff: 0.6,
  fadeOut: 0.35,
};

export const INTRO_EASES = {
  camera: "power2.inOut",
  heavy: "power3.inOut",
  lift: "power2.out",
} as const;

export const INTRO_DOLLY_SCALE = 1.06;
export const INTRO_PUSH_IN_SCALE = 1.85;
export const INTRO_BRIEF_START_SCALE = 1.35;
/** How far the wall and the foreground upright travel relative to the shelf. */
export const INTRO_WALL_PARALLAX = 0.35;
export const INTRO_FOREGROUND_PARALLAX = 1.6;
export const INTRO_DIM_FOCUS = 0.55;
export const INTRO_DIM_FULL = 0.8;
/** Reduced motion: hold the still library briefly, then crossfade to the book. */
export const INTRO_CROSSFADE_HOLD_SECONDS = 0.9;
export const INTRO_CROSSFADE_SECONDS = 0.6;
