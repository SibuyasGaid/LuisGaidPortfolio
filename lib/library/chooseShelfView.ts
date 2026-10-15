import { detectDeviceCapabilities } from "@/lib/device/detectDeviceCapabilities";
import { SHELF_VIEW_ATTRIBUTE } from "@/lib/library/shelfAttributes";
import type { RenderQuality } from "@/lib/library/webgl/createLibraryScene";

/**
 * scene: the WebGL library, at a quality to suit the device.
 * flat: the poster of the same view, for every other device.
 */
export type ShelfView = { readonly kind: "scene"; readonly quality: RenderQuality } | { readonly kind: "flat" };

const LARGE_SCREEN_QUALITY: RenderQuality = { maxPixelRatio: 1.5, minPixelRatio: 0.75, antialias: true, castingLamps: 4, dustCount: 520 };
const SMALL_SCREEN_QUALITY: RenderQuality = { maxPixelRatio: 1.5, minPixelRatio: 0.75, antialias: false, castingLamps: 3, dustCount: 280 };
const SMALL_SCREEN_QUERY = "(max-width: 63.99rem), (pointer: coarse)";

/** Renderers that draw on the CPU, where the library would stall the whole page. */
const SOFTWARE_RENDERER_PATTERN = /swiftshader|llvmpipe|softpipe|software|basic render driver/i;

/** The context's renderer as the browser names it, unmasked where it allows. */
function readRenderer(context: WebGLRenderingContext | WebGL2RenderingContext): string {
  const info = context.getExtension("WEBGL_debug_renderer_info");
  return String(context.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : context.RENDERER) ?? "");
}

// Asks for a context and hands it straight back, before anything is downloaded
// for it. Without a usable GPU some browsers refuse a context that must not
// carry a major performance caveat, and others quietly draw in software;
// either way the poster of the library is used instead.
function supportsFastWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const options: WebGLContextAttributes = { failIfMajorPerformanceCaveat: true };
    const context = canvas.getContext("webgl2", options) ?? canvas.getContext("webgl", options);
    if (!context) return false;
    const isSoftware = SOFTWARE_RENDERER_PATTERN.test(readRenderer(context));
    context.getExtension("WEBGL_lose_context")?.loseContext();
    return !isSoftware;
  } catch {
    return false;
  }
}

function detectShelfView(): ShelfView {
  const device = detectDeviceCapabilities();
  if (device.isLowEndDevice || device.isSlowConnection || !supportsFastWebGL()) return { kind: "flat" };
  const isSmallScreen = window.matchMedia(SMALL_SCREEN_QUERY).matches;
  return { kind: "scene", quality: isSmallScreen ? SMALL_SCREEN_QUALITY : LARGE_SCREEN_QUALITY };
}

let chosenView: ShelfView | null = null;

// The WebGL library is only downloaded where it will run well: never for
// low-end devices, Save-Data, very slow connections or software rendering.
// Everywhere else the poster of the same view is the shelf.
// Decided once per page, so every caller agrees.
export function chooseShelfView(): ShelfView {
  chosenView ??= detectShelfView();
  return chosenView;
}

/** Marks which shelf this visit has, for the styles that differ. */
export function applyShelfView(kind: ShelfView["kind"]): void {
  document.documentElement.setAttribute(SHELF_VIEW_ATTRIBUTE, kind);
}

/** The library failed on this device: the poster is the shelf for the rest of the visit. */
export function fallBackToFlatShelf(): void {
  chosenView = { kind: "flat" };
  applyShelfView("flat");
}
