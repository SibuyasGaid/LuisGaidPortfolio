import { BOOKS, type BookId } from "@/content/portfolio";
import { BOOK_DESIGNS } from "@/lib/bookDesigns";
import {
  GRAND_BOOKCASE,
  GRAND_BOOKCASE_FRONT_Z,
  getRowBase,
  ROW_CLEAR_HEIGHT,
  TITLED_BOOK,
  TITLED_BOOK_SLOTS,
  type ShelfPose,
} from "@/lib/library/webgl/libraryLayout";

// How the home page frames the grand bookcase, as plain arithmetic shared by
// the WebGL camera, the pre-rendered posters of the same view, and the links
// laid over the titled books. There are two reference frames, one for wide
// screens and one for tall ones; each screen shows its reference cropped to
// cover it, exactly as CSS object-fit: cover crops the poster, so the live
// scene, the poster and the links always line up.

interface Point {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface ShelfReference {
  readonly orientation: "landscape" | "portrait";
  /** Width over height. */
  readonly aspect: number;
  /** Vertical, in degrees. */
  readonly fieldOfView: number;
  readonly pose: ShelfPose;
}

/** A rectangle as shares of the reference image, from its top left corner. */
export interface ReferenceRect {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

/** This much of the bookcase must fit the reference frame across or down, whichever comes first, in metres. */
const FIT = { height: 4.8, width: 8, centreY: 2.3, eyeHeight: 1.7 } as const;
const COVER_THICKNESS = 0.004;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function fitPose(aspect: number, fieldOfView: number): ShelfPose {
  const halfHeight = Math.tan(toRadians(fieldOfView) / 2);
  const distance = Math.min(FIT.height / (2 * halfHeight), FIT.width / (2 * halfHeight * aspect));
  return {
    position: { x: 0, y: FIT.eyeHeight, z: GRAND_BOOKCASE_FRONT_Z + distance },
    target: { x: 0, y: FIT.centreY, z: GRAND_BOOKCASE_FRONT_Z },
  };
}

function createReference(orientation: ShelfReference["orientation"], aspect: number, fieldOfView: number): ShelfReference {
  return { orientation, aspect, fieldOfView, pose: fitPose(aspect, fieldOfView) };
}

export const SHELF_REFERENCES = {
  landscape: createReference("landscape", 16 / 9, 50),
  portrait: createReference("portrait", 9 / 16, 70),
} as const;

/** Taller-than-wide screens use the portrait frame, as CSS's orientation media query decides. */
export function chooseShelfReference(aspect: number): ShelfReference {
  return aspect > 1 ? SHELF_REFERENCES.landscape : SHELF_REFERENCES.portrait;
}

/**
 * The vertical field of view that shows the reference frame cropped to cover
 * a screen of this shape: the sides are cut on a narrower screen (the field
 * stays), the top and bottom on a wider one (it narrows).
 */
export function getCoverFieldOfView(reference: ShelfReference, aspect: number): number {
  if (aspect <= reference.aspect) return reference.fieldOfView;
  const halfHeight = (Math.tan(toRadians(reference.fieldOfView) / 2) * reference.aspect) / aspect;
  return (2 * Math.atan(halfHeight) * 180) / Math.PI;
}

/** Where a point in the room appears in the reference frame, as shares across and down. */
export function projectToReference(point: Point, reference: ShelfReference): { u: number; v: number } {
  const { position, target } = reference.pose;
  const forward = normalize(subtract(target, position));
  const right = normalize(cross(forward, { x: 0, y: 1, z: 0 }));
  const up = cross(right, forward);
  const offset = subtract(point, position);
  const depth = dot(offset, forward);
  const halfHeight = Math.tan(toRadians(reference.fieldOfView) / 2);
  const across = dot(offset, right) / (depth * halfHeight * reference.aspect);
  const down = dot(offset, up) / (depth * halfHeight);
  return { u: (across + 1) / 2, v: (1 - down) / 2 };
}

/** A titled book's size on the shelf, in metres, as its design gives it. */
export function getTitledBookSize(bookId: BookId): { thickness: number; height: number } {
  const design = BOOK_DESIGNS[bookId];
  return {
    thickness: design.spineWidth * TITLED_BOOK.thicknessPerUnit,
    height: (design.spineHeight / 100) * ROW_CLEAR_HEIGHT * 0.98,
  };
}

/** Where a titled book's spine (with its front cover's edge) sits in the reference frame. */
export function getSpineRect(bookId: BookId, reference: ShelfReference): ReferenceRect {
  const { thickness, height } = getTitledBookSize(bookId);
  const slot = TITLED_BOOK_SLOTS[bookId];
  const centreX = slot.along - GRAND_BOOKCASE.width / 2;
  const base = getRowBase(slot.row);
  const z = GRAND_BOOKCASE_FRONT_Z - 0.002;
  const corners = [
    { x: centreX - thickness / 2, y: base, z },
    { x: centreX + thickness / 2 + COVER_THICKNESS, y: base, z },
    { x: centreX - thickness / 2, y: base + height, z },
    { x: centreX + thickness / 2 + COVER_THICKNESS, y: base + height, z },
  ].map((corner) => projectToReference(corner, reference));
  const left = Math.min(...corners.map((corner) => corner.u));
  const top = Math.min(...corners.map((corner) => corner.v));
  return {
    left,
    top,
    width: Math.max(...corners.map((corner) => corner.u)) - left,
    height: Math.max(...corners.map((corner) => corner.v)) - top,
  };
}

/** Every titled book's spine in both reference frames. */
export function getSpineRects(): Record<BookId, Record<ShelfReference["orientation"], ReferenceRect>> {
  return Object.fromEntries(
    BOOKS.map((book) => [
      book.id,
      { landscape: getSpineRect(book.id, SHELF_REFERENCES.landscape), portrait: getSpineRect(book.id, SHELF_REFERENCES.portrait) },
    ]),
  ) as Record<BookId, Record<ShelfReference["orientation"], ReferenceRect>>;
}

/** A rectangle of the reference frame on a screen of this size, with the frame cropped to cover it. */
export function placeOnScreen(rect: ReferenceRect, reference: ShelfReference, width: number, height: number): DOMRect {
  const shownWidth = Math.max(width, height * reference.aspect);
  const shownHeight = Math.max(height, width / reference.aspect);
  const left = (width - shownWidth) / 2;
  const top = (height - shownHeight) / 2;
  return new DOMRect(left + rect.left * shownWidth, top + rect.top * shownHeight, rect.width * shownWidth, rect.height * shownHeight);
}

function subtract(first: Point, second: Point): Point {
  return { x: first.x - second.x, y: first.y - second.y, z: first.z - second.z };
}

function dot(first: Point, second: Point): number {
  return first.x * second.x + first.y * second.y + first.z * second.z;
}

function cross(first: Point, second: Point): Point {
  return {
    x: first.y * second.z - first.z * second.y,
    y: first.z * second.x - first.x * second.z,
    z: first.x * second.y - first.y * second.x,
  };
}

function normalize(vector: Point): Point {
  const length = Math.hypot(vector.x, vector.y, vector.z);
  return { x: vector.x / length, y: vector.y / length, z: vector.z / length };
}
