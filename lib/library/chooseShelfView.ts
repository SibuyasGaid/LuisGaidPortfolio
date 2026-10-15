import { detectDeviceCapabilities } from "@/lib/device/detectDeviceCapabilities";
import { SHELF_VIEW_ATTRIBUTE, SHELF_VIEW_STORAGE_KEY } from "@/lib/library/shelfAttributes";
import type { RenderQuality } from "@/lib/library/webgl/createLibraryScene";

/**
 * scene: the WebGL library, at a quality to suit the device.
 * flat: the bookcase drawn in HTML and CSS, for every other device.
 */
export type ShelfView = { readonly kind: "scene"; readonly quality: RenderQuality } | { readonly kind: "flat" };

const LARGE_SCREEN_QUALITY: RenderQuality = { maxPixelRatio: 1.5, minPixelRatio: 0.75, antialias: true, castingLamps: 4, dustCount: 520 };
const SMALL_SCREEN_QUALITY: RenderQuality = { maxPixelRatio: 1.5, minPixelRatio: 0.75, antialias: false, castingLamps: 3, dustCount: 280 };
const SMALL_SCREEN_QUERY = "(max-width: 63.99rem), (pointer: coarse)";

// Asks for a context and hands it straight back, before anything is downloaded
// for it. A browser drawing WebGL in software (no usable GPU) refuses a context
// that must not carry a major performance caveat: there the library would
// stall the whole page, so the flat bookcase is used.
function supportsFastWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const options: WebGLContextAttributes = { failIfMajorPerformanceCaveat: true };
    const context = canvas.getContext("webgl2", options) ?? canvas.getContext("webgl", options);
    context?.getExtension("WEBGL_lose_context")?.loseContext();
    return context !== null;
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
// low-end devices, Save-Data, slow connections or software rendering.
// Decided once per page, so every caller agrees.
export function chooseShelfView(): ShelfView {
  chosenView ??= detectShelfView();
  return chosenView;
}

/** Shows the chosen home page and remembers the choice for the next visit's first paint. */
export function applyShelfView(kind: ShelfView["kind"]): void {
  document.documentElement.setAttribute(SHELF_VIEW_ATTRIBUTE, kind);
  try {
    localStorage.setItem(SHELF_VIEW_STORAGE_KEY, kind);
  } catch {
    // Private browsing: the next visit decides again.
  }
}

/** The library failed on this device: the flat bookcase from now on. */
export function fallBackToFlatShelf(): void {
  chosenView = { kind: "flat" };
  applyShelfView("flat");
}
