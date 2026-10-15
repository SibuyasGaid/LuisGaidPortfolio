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

/** The welcome screen shows at least this long, so it reads as a greeting rather than a flash. */
export const INTRO_WELCOME_MIN_SECONDS = 1.8;
/** If the library is not ready by then, the welcome screen gives way to the site. */
export const INTRO_LOAD_TIMEOUT_SECONDS = 10;

/**
 * Where the progress bar stands at each stage of loading. While the WebGL
 * code downloads (which reports no progress) the bar creeps toward a cap.
 */
export const INTRO_PROGRESS = {
  started: 0.12,
  downloadCreep: 0.36,
  sceneModule: 0.4,
  sceneSpan: 0.58,
} as const;

export const INTRO_WALK_SECONDS = 6.4;
/** Shares of the walk spent setting off and slowing to a stop; the rest is an even stride. */
export const INTRO_WALK_PHASES = { setOff: 0.18, arrive: 0.4 } as const;

export const INTRO_TIMINGS = {
  welcomeExit: 0.7,
  sceneFadeIn: 1.3,
  /** How long before the walk stops the library starts dissolving onto the real bookcase. */
  landingOverlap: 1,
  landingFade: 1.1,
  settle: 1.4,
} as const;

export const INTRO_EASES = {
  setOff: "power1.in",
  stride: "none",
  arrive: "power2.out",
  land: "power3.out",
  fade: "power2.inOut",
} as const;

/** The real bookcase comes forward from this scale as the library dissolves onto it. */
export const INTRO_LANDING_START_SCALE = 1.06;
/** The canvas is released after the overlay has finished fading out. */
export const INTRO_DISPOSE_DELAY_MS = 700;

// ─── Taking a book off the shelf ────────────────────────────────────────────

export interface BookTransitTimings {
  /** The book slides out of its slot, tipped forward by its top edge. */
  readonly pull: number;
  /** It turns to show its cover while it travels to the middle of the screen. */
  readonly turn: number;
  readonly open: number;
  /** The open book fades into its page. */
  readonly reveal: number;
}

export const BOOK_TRANSIT_TIMINGS: BookTransitTimings = {
  pull: 0.38,
  turn: 0.85,
  open: 0.8,
  reveal: 0.45,
};

export const BOOK_TRANSIT_EASES = {
  pull: "power2.out",
  turn: "power3.inOut",
  open: "power2.inOut",
  reveal: "power2.in",
} as const;

/** How far the book comes out of the shelf, in pixels toward the viewer. */
export const BOOK_TRANSIT_PULL_PX = 70;
/** Tipping the book out by its top edge, the way a hand takes it. */
export const BOOK_TRANSIT_TIP_DEGREES = -9;
/** Cover width as a share of its height. */
export const BOOK_COVER_ASPECT = 0.7;
/** The book's height on arrival, as a share of the viewport's height. */
export const BOOK_TRANSIT_HEIGHT_SHARE = 0.62;
/** Caps that height when the open spread would be wider than this share of the viewport. */
export const BOOK_TRANSIT_SPREAD_WIDTH_SHARE = 0.9;
/** The cover's turn about its hinge when open: just short of flat. */
export const BOOK_TRANSIT_OPEN_DEGREES = -80;
/** The neighbours rock into the gap the book leaves, then settle. */
export const BOOK_NEIGHBOUR_ROCK_DEGREES = 2.6;
export const BOOK_NEIGHBOUR_REST_DEGREES = 1.1;
/** Gives up waiting for the next page after this long and fades out anyway. */
export const BOOK_TRANSIT_ROUTE_TIMEOUT_MS = 2500;
/**
 * Set on <html> while a book arrives from the shelf already open, so its page
 * skips its own cover animation. Cleared on the next navigation.
 */
export const BOOK_ARRIVAL_ATTRIBUTE = "data-arrival";
