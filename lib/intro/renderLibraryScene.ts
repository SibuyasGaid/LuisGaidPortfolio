import { INTRO_PAN_TRAVEL_VIEWPORTS } from "@/lib/motion/config";

// The library the intro walks through, as plain HTML. It is decorative and
// never changes, so it is rendered once as a string instead of as dozens of
// React elements that would each need hydrating.

type LayerName = "hall" | "stacks" | "lamps" | "aisle" | "pillars";

interface SceneLayer {
  readonly name: LayerName;
  /** Travel relative to the aisle: the far wall barely moves, the pillars rush past. */
  readonly depth: number;
  /** Dropped on low-end devices, where the fastest layer costs the most to move. */
  readonly isDetail?: boolean;
  readonly pieceClass: string;
  /** Where each piece stands along the layer, in viewport widths. */
  readonly pieceOffsets: readonly number[];
}

// The walk ends with a lamp (194vw on its layer) over the middle of the screen
// and the aisle's last bookcase just out of view, where the real shelf appears.
const SCENE_LAYERS: readonly SceneLayer[] = [
  { name: "hall", depth: 0.15, pieceClass: "intro-window", pieceOffsets: [8, 54, 104] },
  { name: "stacks", depth: 0.4, pieceClass: "intro-case intro-case-far", pieceOffsets: [0, 38, 76, 114, 152, 190] },
  { name: "lamps", depth: 0.6, pieceClass: "intro-lamp", pieceOffsets: [24, 68, 112, 154, 194] },
  { name: "aisle", depth: 1, pieceClass: "intro-case intro-case-near", pieceOffsets: [4, 62, 124, 186] },
  { name: "pillars", depth: 1.6, isDetail: true, pieceClass: "intro-pillar", pieceOffsets: [36, 152, 270] },
];

/** Dust caught in the lamp light: left %, top %, size in px. */
const DUST_MOTES: readonly (readonly [number, number, number])[] = [
  [38, 22, 3], [46, 34, 2], [55, 18, 4], [61, 41, 2], [43, 52, 3],
  [52, 47, 2], [58, 28, 3], [35, 40, 2], [66, 24, 2], [49, 12, 3],
];

/** Wide enough that the layer still covers the screen at the end of its travel. */
function measureLayerWidth(depth: number): number {
  return Math.ceil((1 + INTRO_PAN_TRAVEL_VIEWPORTS * depth) * 100 + 6);
}

function renderLayer(layer: SceneLayer): string {
  const pieces = layer.pieceOffsets.map((offset) => `<span class="${layer.pieceClass}" style="left:${offset}vw"></span>`).join("");
  const detailAttribute = layer.isDetail ? " data-intro-detail" : "";
  return `<div class="intro-layer intro-layer-${layer.name}" data-intro-layer="${layer.depth}"${detailAttribute} style="width:${measureLayerWidth(layer.depth)}vw">${pieces}</div>`;
}

export const LIBRARY_SCENE_MARKUP = SCENE_LAYERS.map(renderLayer).join("");

export const DUST_MARKUP = DUST_MOTES.map(
  ([left, top, size]) => `<span data-intro-mote class="intro-mote" style="left:${left}%;top:${top}%;width:${size}px;height:${size}px"></span>`,
).join("");
