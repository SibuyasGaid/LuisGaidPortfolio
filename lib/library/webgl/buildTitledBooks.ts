import {
  BoxGeometry,
  Color,
  Group,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Quaternion,
  Vector3,
  type BufferAttribute,
  type Material,
  type Texture,
} from "three";
import type { BookId } from "@/content/portfolio";
import type { ReservedSlot, ShelfRun } from "@/lib/library/webgl/buildBooks";
import { TITLED_SPINE_ATLAS, type TitledBookArt } from "@/lib/library/webgl/createTitledBookArt";
import { getRowBase, TITLED_BOOK, TITLED_BOOK_SLOTS } from "@/lib/library/webgl/libraryLayout";

// The six titled books as solid books: a block of pages with the spine and
// back cover on it, and a front cover on a hinge at the spine, so a book can
// be taken off the shelf, turned and opened. In each book's own frame x runs
// toward its front cover, y up and z out of the shelf through its spine.

export interface TitledBook {
  readonly bookId: BookId;
  readonly art: TitledBookArt;
  /** Placed in the room; move and turn this to move the whole book. */
  readonly group: Group;
  /** What a pointer hits. */
  readonly block: Mesh;
  /** Turn about y (negative opens) to open the front cover. */
  readonly coverHinge: Group;
  readonly spineMaterial: MeshStandardMaterial;
  readonly restPosition: Vector3;
  readonly restQuaternion: Quaternion;
  /** Out of the shelf toward the reader, in the room. */
  readonly out: Vector3;
}

const UP = new Vector3(0, 1, 0);
const COVER_THICKNESS = 0.004;
const SPINE_GLOW = 0.1;
/** Vertex ranges of a box's faces, as three.js builds them: +x, then +z. */
const FACE_VERTICES = { right: 0, front: 16 } as const;

function setFaceUvs(geometry: BoxGeometry, firstVertex: number, left: number, right: number, bottom: number, top: number): void {
  const uv = geometry.getAttribute("uv") as BufferAttribute;
  for (let vertex = firstVertex; vertex < firstVertex + 4; vertex++) {
    uv.setXY(vertex, left + uv.getX(vertex) * (right - left), bottom + uv.getY(vertex) * (top - bottom));
  }
}

/** Every titled book's slot on the run, so the shelf's other books leave room for it. */
export function reserveTitledSlots(books: readonly TitledBookArt[]): ReservedSlot[] {
  return books.map((art) => {
    const slot = TITLED_BOOK_SLOTS[art.bookId];
    const halfWidth = art.thickness / 2 + COVER_THICKNESS + TITLED_BOOK.clearance;
    return { row: slot.row, start: slot.along - halfWidth, end: slot.along + halfWidth };
  });
}

/** Builds the titled books in their slots on the given run (the grand bookcase). */
export function buildTitledBooks(run: ShelfRun, books: readonly TitledBookArt[], spineAtlas: Texture): TitledBook[] {
  const paper = new MeshStandardMaterial({ color: "#d9cdb2", roughness: 0.92 });
  // Inside the cover: a darker laid paper, so the open cover does not outshine the title page.
  const endpaper = new MeshStandardMaterial({ color: "#6e5a3e", roughness: 0.9 });
  const basis = new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(run.along, UP, run.out));
  const columnWidth = 1 / books.length;

  return books.map((art, column) => {
    const slot = TITLED_BOOK_SLOTS[art.bookId];
    const cloth = new MeshStandardMaterial({ color: new Color(art.cloth), roughness: 0.74 });
    const spineMaterial = new MeshStandardMaterial({
      map: spineAtlas,
      emissiveMap: spineAtlas,
      emissive: "#ffffff",
      emissiveIntensity: SPINE_GLOW,
      roughness: 0.66,
    });

    const block = new Mesh(new BoxGeometry(art.thickness, art.height, TITLED_BOOK.depth), [
      paper,
      cloth,
      paper,
      paper,
      spineMaterial,
      paper,
    ] satisfies Material[]);
    const inset = 1 / TITLED_SPINE_ATLAS.width;
    setFaceUvs(block.geometry as BoxGeometry, FACE_VERTICES.front, column * columnWidth + inset, (column + 1) * columnWidth - inset, 0, 1);
    // The title page reads the right half of the book's face texture, once it has one.
    setFaceUvs(block.geometry as BoxGeometry, FACE_VERTICES.right, 0.5, 1, 0, 1);

    const cover = new Mesh(new BoxGeometry(COVER_THICKNESS, art.height + 0.006, TITLED_BOOK.depth + 0.003), [
      cloth,
      endpaper,
      cloth,
      cloth,
      cloth,
      cloth,
    ] satisfies Material[]);
    setFaceUvs(cover.geometry as BoxGeometry, FACE_VERTICES.right, 0, 0.5, 0, 1);
    cover.position.set(COVER_THICKNESS / 2, 0, -TITLED_BOOK.depth / 2);
    const coverHinge = new Group();
    coverHinge.position.set(art.thickness / 2, 0, TITLED_BOOK.depth / 2);
    coverHinge.add(cover);

    const group = new Group();
    group.add(block, coverHinge);
    const restPosition = run.origin
      .clone()
      .addScaledVector(run.along, slot.along)
      .addScaledVector(UP, getRowBase(slot.row) + art.height / 2)
      .addScaledVector(run.out, -(TITLED_BOOK.depth / 2 + 0.002));
    group.position.copy(restPosition);
    group.quaternion.copy(basis);
    return {
      bookId: art.bookId,
      art,
      group,
      block,
      coverHinge,
      spineMaterial,
      restPosition,
      restQuaternion: basis.clone(),
      out: run.out.clone(),
    };
  });
}

/** Puts a book's painted cover and title page on it (they are only seen once it leaves the shelf). */
export function dressTitledBook(book: TitledBook, faceTexture: Texture): void {
  const face = new MeshStandardMaterial({ map: faceTexture, roughness: 0.78 });
  const blockMaterials = book.block.material as Material[];
  blockMaterials[0] = face;
  const cover = book.coverHinge.children[0];
  if (cover instanceof Mesh) (cover.material as Material[])[0] = face;
}

export const TITLED_SPINE_GLOW = SPINE_GLOW;
