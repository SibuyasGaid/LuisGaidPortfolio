import { chooseShelfView } from "@/lib/library/chooseShelfView";
import { preloadLibrary } from "@/lib/library/libraryStage";
import type { RenderQuality } from "@/lib/library/webgl/createLibraryScene";
import { REDUCED_MOTION_QUERY } from "@/lib/motion/config";

/**
 * walk: the welcome screen while the WebGL library loads, then the walk through it to the grand bookcase.
 * arrive: the same without the walk (reduced motion): the welcome gives way to the grand bookcase.
 * welcome: the welcome screen alone, which then gives way to the flat bookcase.
 */
export type IntroVariant =
  | { readonly kind: "walk"; readonly quality: RenderQuality }
  | { readonly kind: "arrive"; readonly quality: RenderQuality }
  | { readonly kind: "welcome" };

// Follows the home page: the library's WebGL scene where the device runs it
// well (see chooseShelfView), walked through unless motion is unwelcome.
export function chooseIntroVariant(): IntroVariant {
  const shelf = chooseShelfView();
  if (shelf.kind === "flat") return { kind: "welcome" };
  const isMotionReduced = window.matchMedia(REDUCED_MOTION_QUERY).matches;
  return { kind: isMotionReduced ? "arrive" : "walk", quality: shelf.quality };
}

/**
 * Starts downloading the WebGL library alongside the intro's own code rather
 * than after it, when it will be shown. The later import resolves from the
 * same download.
 */
export function preloadIntroScene(): void {
  if (chooseShelfView().kind === "scene") preloadLibrary();
}
