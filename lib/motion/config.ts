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
/** If the library is not ready by then, the welcome screen offers the way in anyway, and the library fades up when it is. */
export const INTRO_LOAD_TIMEOUT_SECONDS = 10;
/** A beat between the visitor's click and the welcome card stepping aside, while the sound wakes. */
export const INTRO_ENTRY_PAUSE_SECONDS = 0.15;
/** From the click in, the intro should be long over by now; if it is not, something failed and it ends. */
export const INTRO_AFTER_ENTRY_MAX_SECONDS = 20;

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
/** Steps a second down the aisle: the eye bobs, and a footstep lands, at this pace. */
export const WALK_STEP_FREQUENCY_HZ = 1.8;

export const INTRO_TIMINGS = {
  welcomeExit: 0.7,
  sceneFadeIn: 1.3,
  /** How long before the walk stops the home page's navbar and heading start to rise into the scene. */
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

/**
 * Rewinding the intro from the landing page: the camera flies back up the
 * aisle to the door, the welcome card returns over the dark and holds, then
 * the walk plays again. Where there is no walk, the card simply returns.
 */
export const INTRO_REWIND = { flyBack: 1.9, cardIn: 0.7, hold: 1.3, chromeOut: 0.45 } as const;

/** The real bookcase comes forward from this scale as the library dissolves onto it. */
export const INTRO_LANDING_START_SCALE = 1.06;

// ─── The library on the home page ───────────────────────────────────────────

/** How far the camera drifts with the pointer, in metres, and how quickly it follows (share per frame). */
export const SHELF_PARALLAX = { x: 0.16, y: 0.07, follow: 0.05 } as const;
/** With nothing moving for this long, the dust drifts on at half the frame rate. */
export const SHELF_IDLE_AFTER_MS = 3000;
/** And after this long it settles: nothing is drawn until the pointer moves or a book is named. */
export const SHELF_REST_AFTER_MS = 15_000;

/**
 * A book named in the navbar, or pointed at, slides well out of the shelf
 * (metres), tipped by its top edge (radians), and its spine lights up; the
 * hotspot over it dims the rest of the shelf and labels it (globals.css).
 */
export const SHELF_PREVIEW = { distance: 0.13, tipRadians: 0.19, glow: 1.25, seconds: 0.35 } as const;

/** Taking a book off the grand bookcase, in seconds from the moment it is chosen. */
export const SHELF_TAKE_TIMINGS = {
  /** It slides out tipped by its top edge. */
  pull: 0.45,
  /** The camera steps toward it meanwhile. */
  approach: 1.15,
  /** It turns to show its cover and comes up to the reader. */
  turnAt: 0.32,
  turn: 0.95,
  /** Its cover opens on the title page. */
  openAt: 1.18,
  open: 0.75,
  /** Share of the opening at which its page is loaded. */
  navigateShare: 0.4,
} as const;

export const SHELF_TAKE = {
  /** How far out of the shelf the book slides before it turns, in metres: clear of its neighbours. */
  pullDistance: 0.3,
  tipRadians: 0.17,
  /** Share of the way from where the camera stands toward the book that it steps. */
  approachShare: 0.35,
  /** The closed book's height as a share of the screen's, up close. */
  heightShare: 0.6,
  /** The open spread's width as a share of the screen's, where it fits. */
  spreadWidthShare: 0.82,
  /** The cover's turn about its hinge when open, in radians: lying nearly flat, as an open book does. */
  openRadians: -3.02,
} as const;

// ─── Taking a book off the shelf ────────────────────────────────────────────

export interface BookTransitTimings {
  /** The book slides out of its slot, tipped forward by its top edge. */
  readonly pull: number;
  /** It turns to show its cover while it travels to the middle of the screen. */
  readonly turn: number;
  readonly open: number;
}

export const BOOK_TRANSIT_TIMINGS: BookTransitTimings = {
  pull: 0.38,
  turn: 0.85,
  open: 0.8,
};

export const BOOK_TRANSIT_EASES = {
  pull: "power2.out",
  turn: "power3.inOut",
  open: "power2.inOut",
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
/** The cover's turn about its hinge when open: lying flat, so the open book can be zoomed into. */
export const BOOK_TRANSIT_OPEN_DEGREES = -90;
/** How dark the shelf gets behind a CSS book off it, at its darkest. */
export const BOOK_TRANSIT_SHELF_DIM = 0.6;
/** Gives up waiting for the next page after this long and carries on anyway. */
export const BOOK_TRANSIT_ROUTE_TIMEOUT_MS = 2500;
/**
 * Set on <html> while a book arrives from the shelf already open, so its page
 * skips its own cover animation. Cleared on the next navigation.
 */
export const BOOK_ARRIVAL_ATTRIBUTE = "data-arrival";

// ─── Into a book's page ─────────────────────────────────────────────────────

/** Zooming into the open book until it lies where its page is, then turning its title page over onto the content (seconds). */
export const PAGE_TURN_TIMINGS = {
  zoom: 0.9,
  /** Share of the zoom by which the shelf has slipped out of focus. */
  shelfFadeShare: 0.8,
  /** The copy and what it stands in for (the open book, the book's left page) cross over in this long. */
  handoff: 0.22,
  turn: 0.95,
} as const;

export const PAGE_TURN_EASES = { zoom: "power2.inOut", turn: "power2.inOut" } as const;
/** How dark a turning page gets, edge on to the lamp. */
export const PAGE_TURN_SHADE = 0.3;
/**
 * Set on <html>: "hold" while a book's page is hidden under the copy coming
 * to cover it, "turn" while the copy's title page turns over it.
 */
export const PAGE_TURN_ATTRIBUTE = "data-page-turn";
/** Where a book's page sets its two pages side by side (globals.css). */
export const TWO_PAGE_QUERY = "(min-width: 64rem)";
