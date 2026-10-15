import {
  BoxGeometry,
  Color,
  InstancedMesh,
  Matrix4,
  Quaternion,
  Vector3,
  type BufferAttribute,
  type Material,
} from "three";
import { BOOK_CLOTH_COLORS } from "@/lib/bookCloths";
import { SPINE_ATLAS } from "@/lib/intro/webgl/createLibraryTextures";
import { SHELVING } from "@/lib/intro/webgl/libraryLayout";
import { pickBetween, pickFrom, type Random } from "@/lib/random/seededRandom";

// Fills runs of shelving with books, drawn as one instanced box per spine
// design so thousands of books cost a handful of draw calls.

/** A run of shelving, described from where it starts on the floor at its front edge. */
export interface ShelfRun {
  readonly origin: Vector3;
  /** Along the run, the way books are placed. */
  readonly along: Vector3;
  /** Out of the shelves toward the reader: the way spines face. */
  readonly out: Vector3;
  readonly length: number;
  readonly rowCount: number;
}

interface Book {
  readonly pattern: number;
  readonly color: Color;
  /** Position along the run of the book's centre. */
  readonly along: number;
  /** Height above the floor of the board it stands on. */
  readonly base: number;
  readonly thickness: number;
  readonly height: number;
  readonly depth: number;
  readonly inset: number;
  /** Radians leaned into the gap beside it; 0 when upright. */
  lean: number;
  /** Lying flat in a stack: its height above the board. */
  readonly stackOffset: number | null;
}

const UP = new Vector3(0, 1, 0);
const LOCAL_Z = new Vector3(0, 0, 1);
const STACK_CHANCE = 0.03;
const GAP_CHANCE = 0.03;
const PATTERN_WEIGHTS = [0.34, 0.2, 0.22, 0.24] as const;

function pickPattern(random: Random): number {
  let roll = random();
  for (let pattern = 0; pattern < PATTERN_WEIGHTS.length; pattern++) {
    roll -= PATTERN_WEIGHTS[pattern] ?? 0;
    if (roll <= 0) return pattern;
  }
  return 0;
}

// Warm lamplight and tone mapping wash cloth toward brown, so each colour is
// pushed a little richer than on the page, then varied book to book.
function pickCloth(random: Random): Color {
  return new Color(pickFrom(random, BOOK_CLOTH_COLORS)).offsetHSL(0, pickBetween(random, 0.04, 0.14), pickBetween(random, -0.02, 0.05));
}

function fillBay(books: Book[], random: Random, start: number, end: number, base: number, clearHeight: number): void {
  let position = start + pickBetween(random, 0, 0.02);
  let previousStanding: Book | null = null;
  while (position < end) {
    const roll = random();
    if (roll < STACK_CHANCE && end - position > 0.32) {
      const length = pickBetween(random, 0.2, 0.27);
      let stackHeight = 0;
      const count = 2 + Math.floor(random() * 3);
      for (let index = 0; index < count; index++) {
        const thickness = pickBetween(random, 0.025, 0.05);
        books.push({
          pattern: pickPattern(random),
          color: pickCloth(random),
          along: position + length / 2 + pickBetween(random, -0.012, 0.012),
          base,
          thickness,
          height: length,
          depth: pickBetween(random, 0.16, 0.22),
          inset: pickBetween(random, 0.005, 0.03),
          lean: 0,
          stackOffset: stackHeight,
        });
        stackHeight += thickness;
      }
      position += length + 0.02;
      previousStanding = null;
    } else if (roll < STACK_CHANCE + GAP_CHANCE) {
      const gap = pickBetween(random, 0.04, 0.12);
      // The book before a gap leans into it, as far as the gap allows.
      if (previousStanding) previousStanding.lean = Math.min(pickBetween(random, 0.1, 0.2), Math.asin(gap / previousStanding.height));
      position += gap;
      previousStanding = null;
    } else {
      const thickness = pickBetween(random, 0.022, 0.058);
      if (position + thickness > end) break;
      const book: Book = {
        pattern: pickPattern(random),
        color: pickCloth(random),
        along: position + thickness / 2,
        base,
        thickness,
        height: clearHeight * pickBetween(random, 0.62, 0.93),
        depth: pickBetween(random, 0.17, 0.25),
        inset: pickBetween(random, 0.004, 0.03),
        lean: 0,
        stackOffset: null,
      };
      books.push(book);
      previousStanding = book;
      position += thickness + 0.0015;
    }
  }
}

function generateBooks(run: ShelfRun, random: Random): Book[] {
  const books: Book[] = [];
  const clearHeight = SHELVING.rowHeight - SHELVING.boardThickness;
  const bayCount = Math.round(run.length / SHELVING.bayWidth);
  const bayWidth = run.length / bayCount;
  for (let row = 0; row < run.rowCount; row++) {
    const base = SHELVING.plinthHeight + row * SHELVING.rowHeight + SHELVING.boardThickness;
    for (let bay = 0; bay < bayCount; bay++) {
      const start = bay * bayWidth + SHELVING.uprightThickness / 2;
      const end = (bay + 1) * bayWidth - SHELVING.uprightThickness / 2;
      fillBay(books, random, start, end, base, clearHeight);
    }
  }
  return books;
}

// Every face but the spine reads the plain strip at the top of the atlas;
// the spine (+z) reads its design's column, inset so mipmaps never bleed.
function createBookGeometry(pattern: number): BoxGeometry {
  const geometry = new BoxGeometry(1, 1, 1);
  const uv = geometry.getAttribute("uv") as BufferAttribute;
  const columnWidth = 1 / SPINE_ATLAS.patternCount;
  const inset = 2 / SPINE_ATLAS.size;
  const plainV = 1 - SPINE_ATLAS.plainStripHeight / SPINE_ATLAS.size / 2;
  const patternTop = 1 - SPINE_ATLAS.plainStripHeight / SPINE_ATLAS.size - inset;
  const spineFaceStart = 16;
  for (let vertex = 0; vertex < uv.count; vertex++) {
    if (vertex >= spineFaceStart && vertex < spineFaceStart + 4) {
      const u = columnWidth * pattern + inset + uv.getX(vertex) * (columnWidth - inset * 2);
      const v = inset + uv.getY(vertex) * (patternTop - inset);
      uv.setXY(vertex, u, v);
    } else {
      uv.setXY(vertex, 0.5, plainV);
    }
  }
  return geometry;
}

function composeBookMatrix(run: ShelfRun, book: Book, basis: Quaternion, target: Matrix4): void {
  const tilt = new Quaternion();
  let along = book.along;
  let height = book.base + book.height / 2;
  if (book.stackOffset !== null) {
    tilt.setFromAxisAngle(LOCAL_Z, Math.PI / 2);
    height = book.base + book.stackOffset + book.thickness / 2;
  } else if (book.lean > 0) {
    // Pivot on the bottom corner nearest the gap, tipping the top into it.
    const angle = -book.lean;
    const pivot = book.along + book.thickness / 2;
    const offsetAlong = -book.thickness / 2;
    const offsetUp = book.height / 2;
    along = pivot + offsetAlong * Math.cos(angle) - offsetUp * Math.sin(angle);
    height = book.base + offsetAlong * Math.sin(angle) + offsetUp * Math.cos(angle);
    tilt.setFromAxisAngle(LOCAL_Z, angle);
  }
  const position = run.origin
    .clone()
    .addScaledVector(run.along, along)
    .addScaledVector(UP, height)
    .addScaledVector(run.out, -(book.inset + book.depth / 2));
  target.compose(position, basis.clone().multiply(tilt), new Vector3(book.thickness, book.height, book.depth));
}

/** Instanced meshes for every book on the given runs, one per spine design, sharing one material. */
export function buildBooks(runs: readonly ShelfRun[], material: Material, random: Random): InstancedMesh[] {
  const placed = runs.flatMap((run) => generateBooks(run, random).map((book) => ({ run, book })));
  const matrix = new Matrix4();
  return Array.from({ length: SPINE_ATLAS.patternCount }, (_, pattern) => {
    const books = placed.filter(({ book }) => book.pattern === pattern);
    const mesh = new InstancedMesh(createBookGeometry(pattern), material, books.length);
    books.forEach(({ run, book }, index) => {
      const basis = new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(run.along, UP, run.out));
      composeBookMatrix(run, book, basis, matrix);
      mesh.setMatrixAt(index, matrix);
      mesh.setColorAt(index, book.color);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
    return mesh;
  });
}
