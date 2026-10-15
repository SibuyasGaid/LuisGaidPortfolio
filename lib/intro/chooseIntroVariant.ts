import { detectDeviceCapabilities } from "@/lib/device/detectDeviceCapabilities";
import type { RenderQuality } from "@/lib/intro/webgl/createLibraryScene";
import { REDUCED_MOTION_QUERY } from "@/lib/motion/config";

/**
 * walk: the WebGL walk through the library, at a quality to suit the device.
 * welcome: the welcome screen alone, which then gives way to the site.
 */
export type IntroVariant = { readonly kind: "walk"; readonly quality: RenderQuality } | { readonly kind: "welcome" };

const LARGE_SCREEN_QUALITY: RenderQuality = { maxPixelRatio: 1.5, minPixelRatio: 0.75, antialias: true, castingLamps: 4, dustCount: 420 };
const SMALL_SCREEN_QUALITY: RenderQuality = { maxPixelRatio: 1.5, minPixelRatio: 0.75, antialias: false, castingLamps: 3, dustCount: 220 };
const SMALL_SCREEN_QUERY = "(max-width: 63.99rem), (pointer: coarse)";

// Asks for a context and hands it straight back, before anything is downloaded
// for it. A browser drawing WebGL in software (no usable GPU) refuses a context
// that must not carry a major performance caveat: there the walk would stall
// the whole page, so it is skipped.
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

function detectVariant(): IntroVariant {
  if (window.matchMedia(REDUCED_MOTION_QUERY).matches) return { kind: "welcome" };
  const device = detectDeviceCapabilities();
  if (device.isLowEndDevice || device.isSlowConnection || !supportsFastWebGL()) return { kind: "welcome" };
  const isSmallScreen = window.matchMedia(SMALL_SCREEN_QUERY).matches;
  return { kind: "walk", quality: isSmallScreen ? SMALL_SCREEN_QUALITY : LARGE_SCREEN_QUALITY };
}

let chosenVariant: IntroVariant | null = null;

// The WebGL library is only downloaded where it will run well and is wanted:
// never for reduced motion, low-end devices, Save-Data, slow connections or
// software rendering.
// Decided once per page, so every caller agrees.
export function chooseIntroVariant(): IntroVariant {
  chosenVariant ??= detectVariant();
  return chosenVariant;
}

/**
 * Starts downloading the WebGL library alongside the intro's own code rather
 * than after it, when the walk will be shown. The later import resolves from
 * the same download.
 */
export function preloadIntroScene(): void {
  if (chooseIntroVariant().kind === "walk") void import("@/lib/intro/webgl/createLibraryScene").catch(() => {});
}
