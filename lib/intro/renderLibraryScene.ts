import {
  AISLE,
  getSegmentCentres,
  isLampSegment,
  measureDistanceFromEye,
  measureFog,
  type PieceEdge,
  ROOM,
} from "@/lib/intro/libraryGeometry";

// The library the intro walks through, as plain HTML: a real CSS 3D space of
// bookcase walls and lamps, ending in a reading room. It is
// decorative and never changes, so it is rendered once as a string instead of
// as React elements that would each need hydrating.

/** Dust caught in the lamp light: left %, top %, size in px. */
const DUST_MOTES: readonly (readonly [number, number, number])[] = [
  [38, 22, 3], [46, 34, 2], [55, 18, 4], [61, 41, 2], [43, 52, 3],
  [52, 47, 2], [58, 28, 3], [35, 40, 2], [66, 24, 2], [49, 12, 3],
];

function place(x: number, y: number, z: number, rotation = ""): string {
  return `transform:translate3d(${x}vh,${y}vh,${z}vh)${rotation ? ` ${rotation}` : ""}`;
}

const wallCentreY = (AISLE.floorY + AISLE.ceilingY) / 2;

function renderShade(z: number): string {
  return `<i class="aisle-shade" style="opacity:${measureFog(measureDistanceFromEye(z, 0))}"></i>`;
}

// One slice of the aisle: a bookcase either side, the floor and the ceiling
// between them, and a lamp over every second slice. Each piece is marked with
// its depth so the timeline can darken it with distance and hide it once the
// camera has walked past. The shade starts at the darkness of the first frame,
// so nothing jumps when the walk begins.
function markDepth(z: number, edge: PieceEdge): string {
  return `data-intro-segment="${z}" data-intro-edge="${edge}"`;
}

// One slice of the aisle: a bookcase either side and, over every second
// slice, a lamp. Each piece is marked with its depth so the timeline can
// darken it with distance and hide it once it has left the screen. The floor
// and ceiling are not pieces at all: see .intro-scene.
function renderSegment(z: number, segmentIndex: number): string {
  const pieces = [
    `<div class="aisle-wall aisle-case" ${markDepth(z, "side")} style="${place(-AISLE.halfWidth, wallCentreY, z, "rotateY(90deg)")}">${renderShade(z)}</div>`,
    `<div class="aisle-wall aisle-case" ${markDepth(z, "side")} style="${place(AISLE.halfWidth, wallCentreY, z, "rotateY(-90deg)")}">${renderShade(z)}</div>`,
  ];
  if (isLampSegment(segmentIndex)) {
    pieces.push(`<div class="aisle-lamp" ${markDepth(z, "lamp")} style="${place(0, AISLE.ceilingY + 24, z)}"></div>`);
  }
  return pieces.join("");
}

function renderRoom(): string {
  return [
    `<div class="aisle-end-wall" style="${place(0, (ROOM.endWallTop + AISLE.floorY) / 2, ROOM.endWallZ)};height:${AISLE.floorY - ROOM.endWallTop}vh;margin-top:${(ROOM.endWallTop - AISLE.floorY) / 2}vh">`,
    `<span class="aisle-window is-left"></span><span class="aisle-window is-right"></span>`,
    `<span class="aisle-end-glow"></span><span class="aisle-case aisle-end-case"></span>`,
    `</div>`,
  ].join("");
}

export const LIBRARY_SCENE_MARKUP = getSegmentCentres().map(renderSegment).join("") + renderRoom();

export const DUST_MARKUP = DUST_MOTES.map(
  ([left, top, size]) => `<span data-intro-mote class="intro-mote" style="left:${left}%;top:${top}%;width:${size}px;height:${size}px"></span>`,
).join("");
