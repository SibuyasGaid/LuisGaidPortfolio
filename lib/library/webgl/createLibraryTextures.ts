import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Texture } from "three";
import { createSeededRandom, pickBetween, type Random } from "@/lib/random/seededRandom";

// Every surface in the intro is painted here on canvases at load time, so the
// library downloads no images at all.

const TEXTURE_SEED = 41;

/**
 * The spine atlas: a plain strip along the top for every face that is not a
 * spine, then one column per spine design. The base map is shading and cloth
 * that the book's own colour tints; the gilt map marks what is tooled in gold.
 */
export const SPINE_ATLAS = {
  size: 512,
  plainStripHeight: 16,
  patternCount: 4,
} as const;

export interface LibraryTextures {
  readonly spineBase: Texture;
  readonly spineGilt: Texture;
  readonly wood: Texture;
  readonly floor: Texture;
  readonly rug: Texture;
  readonly glow: Texture;
  readonly lightCone: Texture;
  readonly window: Texture;
}

function createCanvas(width: number, height: number): { canvas: HTMLCanvasElement; context: CanvasRenderingContext2D } {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("2D canvas is unavailable");
  return { canvas, context };
}

function toTexture(canvas: HTMLCanvasElement, isColour: boolean): CanvasTexture {
  const texture = new CanvasTexture(canvas);
  if (isColour) texture.colorSpace = SRGBColorSpace;
  return texture;
}

function drawRule(context: CanvasRenderingContext2D, x: number, width: number, y: number, thickness: number): void {
  context.fillRect(x, y, width, thickness);
}

// The base column: bookcloth lit from the left, rounded into shadow at both
// edges, with fine weave and, for the ribbed design, raised bands.
function drawSpineBase(context: CanvasRenderingContext2D, column: number, random: Random): void {
  const width = SPINE_ATLAS.size / SPINE_ATLAS.patternCount;
  const x = column * width;
  const top = SPINE_ATLAS.plainStripHeight;
  const height = SPINE_ATLAS.size - top;

  const rounding = context.createLinearGradient(x, 0, x + width, 0);
  rounding.addColorStop(0, "#5c5c5c");
  rounding.addColorStop(0.16, "#f2f2f2");
  rounding.addColorStop(0.4, "#dcdcdc");
  rounding.addColorStop(0.78, "#c4c4c4");
  rounding.addColorStop(1, "#5a5a5a");
  context.fillStyle = rounding;
  context.fillRect(x, top, width, height);

  context.fillStyle = "rgb(0 0 0 / 0.05)";
  for (let line = 0; line < 70; line++) {
    context.fillRect(x + random() * width, top, 1, height);
  }

  // Wear toward the head and tail of the spine.
  const wear = context.createLinearGradient(0, top, 0, top + height);
  wear.addColorStop(0, "rgb(0 0 0 / 0.28)");
  wear.addColorStop(0.06, "rgb(0 0 0 / 0)");
  wear.addColorStop(0.94, "rgb(0 0 0 / 0)");
  wear.addColorStop(1, "rgb(0 0 0 / 0.3)");
  context.fillStyle = wear;
  context.fillRect(x, top, width, height);

  if (column === 2) {
    for (const share of [0.2, 0.38, 0.62, 0.8]) {
      const y = top + height * share;
      context.fillStyle = "rgb(0 0 0 / 0.45)";
      drawRule(context, x, width, y + 5, 4);
      context.fillStyle = "rgb(255 255 255 / 0.35)";
      drawRule(context, x, width, y, 5);
    }
  }
  if (column === 1) {
    context.fillStyle = "rgb(0 0 0 / 0.22)";
    context.fillRect(x + width * 0.16, top + height * 0.22, width * 0.68, height * 0.15);
  }
}

// The gilt column: white where the spine is tooled in gold, black elsewhere.
function drawSpineGilt(context: CanvasRenderingContext2D, column: number): void {
  const width = SPINE_ATLAS.size / SPINE_ATLAS.patternCount;
  const x = column * width;
  const top = SPINE_ATLAS.plainStripHeight;
  const height = SPINE_ATLAS.size - top;
  const at = (share: number) => top + height * share;
  context.fillStyle = "#ffffff";

  if (column === 0) {
    for (const share of [0.1, 0.125, 0.875, 0.9]) drawRule(context, x, width, at(share), 3);
    drawRule(context, x + width * 0.28, width * 0.44, at(0.3), 4);
    drawRule(context, x + width * 0.34, width * 0.32, at(0.335), 3);
  } else if (column === 1) {
    const labelLeft = x + width * 0.16;
    const labelWidth = width * 0.68;
    drawRule(context, labelLeft, labelWidth, at(0.22), 2);
    drawRule(context, labelLeft, labelWidth, at(0.37), 2);
    context.fillRect(labelLeft, at(0.22), 2, height * 0.15);
    context.fillRect(labelLeft + labelWidth - 2, at(0.22), 2, height * 0.15);
    drawRule(context, x, width, at(0.92), 3);
  } else if (column === 2) {
    drawRule(context, x, width, at(0.06), 3);
    drawRule(context, x, width, at(0.94), 3);
    drawRule(context, x + width * 0.3, width * 0.4, at(0.28), 3);
  } else {
    drawRule(context, x + width * 0.3, width * 0.4, at(0.3), 3);
    context.beginPath();
    context.arc(x + width / 2, at(0.72), width * 0.07, 0, Math.PI * 2);
    context.fill();
  }
}

function createSpineTextures(random: Random): { base: CanvasTexture; gilt: CanvasTexture } {
  const base = createCanvas(SPINE_ATLAS.size, SPINE_ATLAS.size);
  const gilt = createCanvas(SPINE_ATLAS.size, SPINE_ATLAS.size);
  base.context.fillStyle = "#d6d6d6";
  base.context.fillRect(0, 0, SPINE_ATLAS.size, SPINE_ATLAS.size);
  gilt.context.fillStyle = "#000000";
  gilt.context.fillRect(0, 0, SPINE_ATLAS.size, SPINE_ATLAS.size);
  for (let column = 0; column < SPINE_ATLAS.patternCount; column++) {
    drawSpineBase(base.context, column, random);
    drawSpineGilt(gilt.context, column);
  }
  return { base: toTexture(base.canvas, true), gilt: toTexture(gilt.canvas, false) };
}

// Long grain with the odd darker streak, tinted by each surface's colour.
function drawGrain(context: CanvasRenderingContext2D, x: number, width: number, height: number, random: Random): void {
  for (let line = 0; line < width / 2; line++) {
    const lineX = x + random() * width;
    const alpha = pickBetween(random, 0.03, 0.16);
    context.strokeStyle = random() < 0.5 ? `rgb(0 0 0 / ${alpha})` : `rgb(255 235 205 / ${alpha * 0.6})`;
    context.lineWidth = pickBetween(random, 0.5, 2);
    context.beginPath();
    context.moveTo(lineX, 0);
    const sway = pickBetween(random, -6, 6);
    context.bezierCurveTo(lineX + sway, height * 0.33, lineX - sway, height * 0.66, lineX + sway * 0.5, height);
    context.stroke();
  }
}

function createWoodTexture(random: Random): CanvasTexture {
  const { canvas, context } = createCanvas(256, 256);
  context.fillStyle = "#b0a090";
  context.fillRect(0, 0, 256, 256);
  drawGrain(context, 0, 256, 256, random);
  const texture = toTexture(canvas, true);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  return texture;
}

// Floorboards running down the room: each board its own shade, butt joints
// staggered, a dark seam between neighbours.
function createFloorTexture(random: Random): CanvasTexture {
  const size = 1024;
  const boardCount = 8;
  const boardWidth = size / boardCount;
  const { canvas, context } = createCanvas(size, size);
  for (let board = 0; board < boardCount; board++) {
    const x = board * boardWidth;
    const shade = Math.round(pickBetween(random, 120, 165));
    context.fillStyle = `rgb(${shade} ${Math.round(shade * 0.82)} ${Math.round(shade * 0.66)})`;
    context.fillRect(x, 0, boardWidth, size);
    drawGrain(context, x, boardWidth, size, random);
    context.fillStyle = "rgb(0 0 0 / 0.55)";
    context.fillRect(x, 0, 2, size);
    const joint = random() * size;
    context.fillRect(x, joint, boardWidth, 2);
  }
  const texture = toTexture(canvas, true);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  return texture;
}

// The runner: burgundy wool with a lattice, a gold border and a dark edge.
function createRugTexture(): CanvasTexture {
  const width = 256;
  const height = 512;
  const { canvas, context } = createCanvas(width, height);
  context.fillStyle = "#5a1622";
  context.fillRect(0, 0, width, height);
  context.strokeStyle = "rgb(0 0 0 / 0.22)";
  context.lineWidth = 3;
  for (let offset = -height; offset < height * 2; offset += 48) {
    context.beginPath();
    context.moveTo(0, offset);
    context.lineTo(width, offset + width);
    context.moveTo(width, offset);
    context.lineTo(0, offset + width);
    context.stroke();
  }
  context.fillStyle = "#2a0810";
  context.fillRect(0, 0, 14, height);
  context.fillRect(width - 14, 0, 14, height);
  context.fillStyle = "#b8913a";
  context.fillRect(22, 0, 5, height);
  context.fillRect(width - 27, 0, 5, height);
  context.fillRect(34, 0, 2, height);
  context.fillRect(width - 36, 0, 2, height);
  const texture = toTexture(canvas, true);
  texture.wrapT = RepeatWrapping;
  return texture;
}

function createGlowTexture(): CanvasTexture {
  const { canvas, context } = createCanvas(128, 128);
  const glow = context.createRadialGradient(64, 64, 0, 64, 64, 64);
  glow.addColorStop(0, "rgb(255 255 255 / 1)");
  glow.addColorStop(0.25, "rgb(255 255 255 / 0.45)");
  glow.addColorStop(1, "rgb(255 255 255 / 0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, 128, 128);
  return toTexture(canvas, true);
}

// A shaft of light under each lamp: bright at the shade, gone by the floor.
function createLightConeTexture(): CanvasTexture {
  const { canvas, context } = createCanvas(8, 256);
  const shaft = context.createLinearGradient(0, 0, 0, 256);
  shaft.addColorStop(0, "#ffffff");
  shaft.addColorStop(0.25, "#6a6a6a");
  shaft.addColorStop(0.7, "#141414");
  shaft.addColorStop(1, "#000000");
  context.fillStyle = shaft;
  context.fillRect(0, 0, 8, 256);
  return toTexture(canvas, true);
}

// A tall arched window: moonlit glass behind glazing bars, transparent outside the arch.
function createWindowTexture(): CanvasTexture {
  const width = 256;
  const height = 512;
  const { canvas, context } = createCanvas(width, height);
  const archRadius = width / 2;
  context.beginPath();
  context.moveTo(0, height);
  context.lineTo(0, archRadius);
  context.arc(archRadius, archRadius, archRadius, Math.PI, 0);
  context.lineTo(width, height);
  context.closePath();
  context.fillStyle = "#1e130c";
  context.fill();
  context.save();
  context.clip();
  const glass = context.createLinearGradient(0, 0, 0, height);
  glass.addColorStop(0, "#7d93b8");
  glass.addColorStop(0.55, "#3c4c66");
  glass.addColorStop(1, "#1c2433");
  context.fillStyle = glass;
  context.fillRect(14, 14, width - 28, height - 28);
  context.fillStyle = "#1e130c";
  context.fillRect(width / 2 - 4, 0, 8, height);
  for (let bar = 1; bar < 6; bar++) context.fillRect(0, archRadius + ((height - archRadius) / 6) * bar - 3, width, 6);
  context.restore();
  return toTexture(canvas, true);
}

export function createLibraryTextures(): LibraryTextures {
  const random = createSeededRandom(TEXTURE_SEED);
  const spine = createSpineTextures(random);
  return {
    spineBase: spine.base,
    spineGilt: spine.gilt,
    wood: createWoodTexture(random),
    floor: createFloorTexture(random),
    rug: createRugTexture(),
    glow: createGlowTexture(),
    lightCone: createLightConeTexture(),
    window: createWindowTexture(),
  };
}
