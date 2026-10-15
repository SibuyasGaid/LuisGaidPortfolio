import type { BookId } from "@/content/portfolio";

// The library in metres. The aisle runs from z = 0 toward negative z, x = 0
// is its centre line and y = 0 the floor. Bookcases line both sides, then the
// aisle opens into a reading room whose back wall is one grand bookcase: where
// the walk ends, and what the home page shows.

export const AISLE = {
  /** From the centre line to the front of the shelves. */
  halfWidth: 1.2,
  length: 22,
  ceilingHeight: 3.7,
} as const;

/** A wall of shelves: a plinth, then equal rows of books up to a cornice. */
export const SHELVING = {
  depth: 0.34,
  plinthHeight: 0.1,
  rowHeight: 0.43,
  rowCount: 7,
  boardThickness: 0.026,
  /** Uprights divide each wall into bays this wide. */
  bayWidth: 1.1,
  uprightThickness: 0.05,
  corniceHeight: 0.16,
} as const;

/** The reading room rises higher than the aisle. */
export const ROOM_CEILING_HEIGHT = 4.9;

export const ROOM = {
  depth: 9,
  width: 12,
  /** The reading room's back wall. */
  backWallZ: -AISLE.length - 9,
} as const;

/** Floor to just under the ceiling, nearly wall to wall: the bookcase the home page stands in front of. */
export const GRAND_BOOKCASE = {
  width: 7.2,
  rowCount: 9,
} as const;

/** Where the spines of the grand bookcase's books stand. */
export const GRAND_BOOKCASE_FRONT_Z = ROOM.backWallZ + SHELVING.depth;

export function getBookcaseHeight(rowCount: number): number {
  return SHELVING.plinthHeight + SHELVING.rowHeight * rowCount + SHELVING.corniceHeight;
}

/** Height above the floor of the board that a row's books stand on (row 0 is the lowest). */
export function getRowBase(row: number): number {
  return SHELVING.plinthHeight + row * SHELVING.rowHeight + SHELVING.boardThickness;
}

/** Room between one board and the next. */
export const ROW_CLEAR_HEIGHT = SHELVING.rowHeight - SHELVING.boardThickness;

/**
 * The six titled books: how far along the grand bookcase each one's centre
 * stands (from its left end, in metres) and on which row. They look scattered
 * but stay within the middle two metres and the lower rows, so a phone held
 * upright still sees every one of them under the page's heading.
 */
export const TITLED_BOOK_SLOTS: Readonly<Record<BookId, { readonly along: number; readonly row: number }>> = {
  about: { along: 2.8, row: 4 },
  stack: { along: 4.3, row: 4 },
  work: { along: 3.5, row: 3 },
  experience: { along: 2.66, row: 2 },
  services: { along: 3.85, row: 2 },
  contact: { along: 4.45, row: 1 },
};

/** A titled book is bound a little larger than the books around it, and stands flush with the shelf's edge. */
export const TITLED_BOOK = {
  depth: 0.27,
  /** Metres of thickness per unit of the book's spine width in its design. */
  thicknessPerUnit: 0.0135,
  /** Gap left either side of it on the shelf. */
  clearance: 0.004,
} as const;

/** The rolling ladder hooked over a brass rail along the grand bookcase. */
export const LADDER = {
  /** Distance along the bookcase from its left end. */
  along: 6.15,
  width: 0.5,
  railHeight: 3.78,
  /** How far its feet stand out from the shelves. */
  footOut: 0.95,
  rungSpacing: 0.3,
} as const;

/** Brass picture lights along the top of the grand bookcase, by distance from its left end. */
export const PICTURE_LIGHTS = [1.2, 3.6, 6] as const;

export const LAMP_SPACING = 3.6;
export const LAMP_HANG_HEIGHT = 2.75;

export interface LampPosition {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  /** Light it casts relative to an aisle lamp. */
  readonly strength: number;
  /** Picture lights cast light but hang no pendant. */
  readonly kind: "pendant" | "picture";
}

/** The reading room's pendant hangs just short of where the walk stops, so it lights the bookcase from out of view. */
export const ROOM_LAMP = { x: 0, y: 3.4, z: ROOM.backWallZ + 4.6 } as const;

/** Every light in the library: the aisle's pendants, the reading room's pendant, then the picture lights. */
export function getLampPositions(): LampPosition[] {
  const aisleLamps = Array.from({ length: Math.floor(AISLE.length / LAMP_SPACING) }, (_, index) => ({
    x: 0,
    y: LAMP_HANG_HEIGHT,
    z: -LAMP_SPACING * (index + 0.5),
    strength: 1,
    kind: "pendant" as const,
  }));
  const pictureLights = PICTURE_LIGHTS.map((along) => ({
    x: along - GRAND_BOOKCASE.width / 2,
    y: getBookcaseHeight(GRAND_BOOKCASE.rowCount) - 0.12,
    z: GRAND_BOOKCASE_FRONT_Z + 0.3,
    strength: 0.2,
    kind: "picture" as const,
  }));
  return [...aisleLamps, { ...ROOM_LAMP, strength: 5.2, kind: "pendant" }, ...pictureLights];
}

export const CAMERA_PATH = {
  eyeHeight: 1.62,
  startZ: 1.2,
  /** Vertical field of view on a landscape screen, and on the narrowest portrait one. */
  fieldOfView: { landscape: 52, portrait: 72 },
} as const;

/**
 * How the home page frames the grand bookcase: this much of it must fit the
 * screen across or down, whichever comes first, so it fills a wide screen
 * edge to edge and a tall one floor to cornice.
 */
const SHELF_FRAMING = {
  height: 4.8,
  width: 7.7,
  /** The height at the bookcase that the camera looks toward. */
  centreY: 2.3,
  eyeHeight: 1.7,
} as const;

export interface ShelfPose {
  readonly position: { readonly x: number; readonly y: number; readonly z: number };
  readonly target: { readonly x: number; readonly y: number; readonly z: number };
}

/** Wider on tall portrait screens, so a phone still sees down the aisle. */
export function chooseFieldOfView(aspectRatio: number): number {
  const { landscape, portrait } = CAMERA_PATH.fieldOfView;
  const share = Math.min(1, Math.max(0, (1.3 - aspectRatio) / (1.3 - 0.5)));
  return landscape + (portrait - landscape) * share;
}

/** Where the camera stands to show the grand bookcase on a screen of this shape: where the walk ends. */
export function getShelfPose(aspectRatio: number): ShelfPose {
  const halfHeight = Math.tan((chooseFieldOfView(aspectRatio) * Math.PI) / 360);
  const distance = Math.min(SHELF_FRAMING.height / (2 * halfHeight), SHELF_FRAMING.width / (2 * halfHeight * aspectRatio));
  return {
    position: { x: 0, y: SHELF_FRAMING.eyeHeight, z: GRAND_BOOKCASE_FRONT_Z + distance },
    target: { x: 0, y: SHELF_FRAMING.centreY, z: GRAND_BOOKCASE_FRONT_Z },
  };
}
