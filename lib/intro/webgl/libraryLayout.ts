// The intro's library in metres. The aisle runs from z = 0 toward negative z,
// x = 0 is its centre line and y = 0 the floor. Bookcases line both sides,
// then the aisle opens into a reading room whose back wall holds the bookcase
// the walk ends at.

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

/** The bookcase on the reading room's back wall: what the walk arrives at. */
export const END_BOOKCASE = {
  width: 6.6,
  rowCount: 5,
} as const;

export const LAMP_SPACING = 3.6;
export const LAMP_HANG_HEIGHT = 2.75;

/** Z of each lamp down the aisle, then the reading room's lamp over the end bookcase. */
export function getLampPositions(): { readonly x: number; readonly y: number; readonly z: number }[] {
  const aisleLamps = Array.from({ length: Math.floor(AISLE.length / LAMP_SPACING) }, (_, index) => ({
    x: 0,
    y: LAMP_HANG_HEIGHT,
    z: -LAMP_SPACING * (index + 0.5),
  }));
  return [...aisleLamps, { x: 0, y: 3.05, z: ROOM.backWallZ + 2.4 }];
}

export const CAMERA_PATH = {
  eyeHeight: 1.62,
  startZ: 1.2,
  /** Where the walk stops, facing the end bookcase. */
  stopZ: ROOM.backWallZ + 4.9,
  /** Where the camera looks once it has turned toward the end bookcase. */
  finalTarget: { x: 0, y: 1.2, z: ROOM.backWallZ },
  /** Vertical field of view on a landscape screen, and on the narrowest portrait one. */
  fieldOfView: { landscape: 52, portrait: 72 },
} as const;
