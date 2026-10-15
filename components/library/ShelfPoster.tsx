import { getImageProps } from "next/image";
import landscapePoster from "@/assets/library/shelf-landscape.webp";
import portraitPoster from "@/assets/library/shelf-portrait.webp";

// The grand bookcase as the WebGL library shows it at rest, rendered ahead of
// time (scripts/render-shelf-posters.mjs) for wide and tall screens and
// cropped to cover the screen exactly as the live scene is. It is the home
// page wherever the library does not run, and the first thing painted where
// it does, until the live scene fades up over it.

// Shown at cover size, which on a screen of the other shape is wider than the screen.
const LANDSCAPE_SIZES = "max(100vw, 177.78vh)";
const PORTRAIT_SIZES = "max(100vw, 56.25vh)";

interface ShelfPosterProps {
  /** On the home page it is the largest paint, so it loads first; elsewhere it waits until shown. */
  readonly isEager?: boolean;
}

export function ShelfPoster({ isEager = false }: ShelfPosterProps) {
  const {
    props: { srcSet: landscapeSrcSet },
  } = getImageProps({ alt: "", src: landscapePoster, sizes: LANDSCAPE_SIZES });
  const {
    props: { srcSet: portraitSrcSet, ...image },
  } = getImageProps({
    alt: "",
    src: portraitPoster,
    sizes: PORTRAIT_SIZES,
    loading: isEager ? "eager" : "lazy",
    fetchPriority: isEager ? "high" : "low",
  });
  return (
    <picture>
      <source media="(orientation: landscape)" srcSet={landscapeSrcSet} sizes={LANDSCAPE_SIZES} />
      <img {...image} alt="" srcSet={portraitSrcSet} sizes={PORTRAIT_SIZES} className="shelf-frame" />
    </picture>
  );
}
