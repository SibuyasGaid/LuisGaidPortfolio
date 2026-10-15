// The intro's library, measured in viewport-height units (vh) so it scales
// with the screen. The camera's eye sits PERSPECTIVE_VH in front of the
// screen plane, looking down the aisle (toward negative z); z is 0 at the
// screen plane and y grows downward, as in CSS.

export const PERSPECTIVE_VH = 80;

export const AISLE = {
  halfWidth: 34,
  floorY: 42,
  ceilingY: -62,
  /**
   * Each bookcase along the aisle. They are short so that one can be hidden the
   * moment it reaches the camera without any of it still being on screen.
   */
  segmentLength: 32,
  segmentCount: 14,
  /** A lamp hangs over every second bookcase. */
  segmentsPerLamp: 2,
  /** The first bookcases start beside the camera, so the walls fill the frame. */
  startZ: 64,
} as const;

export const AISLE_END_Z = AISLE.startZ - AISLE.segmentLength * AISLE.segmentCount;


export const ROOM = {
  /** The reading room's back wall, holding the bookcase the walk ends at. */
  endWallZ: AISLE_END_Z - 96,
  endWallTop: -98,
} as const;

/** The walk stops this far short of the back wall. */
export const WALK_STOP_DISTANCE_VH = 10;
export const WALK_TRAVEL_VH = -ROOM.endWallZ - WALK_STOP_DISTANCE_VH;

/** Centre z of each aisle segment, nearest first. */
export function getSegmentCentres(): number[] {
  return Array.from({ length: AISLE.segmentCount }, (_, index) => AISLE.startZ - AISLE.segmentLength * (index + 0.5));
}


/** Whether a lamp hangs over this segment: every second one, from the first. */
export function isLampSegment(segmentIndex: number): boolean {
  return segmentIndex % AISLE.segmentsPerLamp === 0;
}

/** Bookcases fall into darkness with distance from the eye; even up close the lamps leave some shadow. */
const FOG = { nearVh: 20, rangeVh: 240, minOpacity: 0.2, maxOpacity: 0.86 } as const;

export function measureFog(distanceVh: number): number {
  const progress = Math.min(1, Math.max(0, (distanceVh - FOG.nearVh) / FOG.rangeVh));
  const opacity = FOG.minOpacity + progress * (FOG.maxOpacity - FOG.minOpacity);
  return Math.round(opacity * 1000) / 1000;
}

/** Distance from the eye to something at depth z once the walk has covered travelVh. */
export function measureDistanceFromEye(z: number, travelVh: number): number {
  return PERSPECTIVE_VH - (z + travelVh);
}

/** Which way a piece leaves the screen as the camera passes it. */
export type PieceEdge = "side" | "lamp";

/** How far a piece sits from the line of sight, in vh, across the screen or up and down it. */
const PIECE_OFFSETS: Record<PieceEdge, { readonly offset: number; readonly isAcross: boolean }> = {
  side: { offset: AISLE.halfWidth, isAcross: true },
  lamp: { offset: -AISLE.ceilingY - 24, isAcross: false },
};

/**
 * The distance from the eye below which a piece is wholly off screen. The
 * screen's edge is 50vh from its centre vertically, and 50vh times the aspect
 * ratio across it. A piece any closer is hidden: up close it would be magnified
 * enormously, and the browser could spend its whole tile budget drawing it.
 */
export function measureOffScreenDistance(edge: PieceEdge, aspectRatio: number): number {
  const { offset, isAcross } = PIECE_OFFSETS[edge];
  const screenHalfExtent = isAcross ? 50 * aspectRatio : 50;
  return (offset * PERSPECTIVE_VH) / screenHalfExtent;
}
