/** The page's navbar, heading, shading, shelf links and foot: held back while the intro plays, risen into place as it lands. */
export const INTRO_CHROME_SELECTORS = [
  "[data-masthead]",
  ".library-scene-shade",
  ".library-hero",
  ".library-foot",
  ".shelf-hotspots",
  "[data-colophon]",
] as const;

export function queryIntroChrome(): HTMLElement[] {
  return INTRO_CHROME_SELECTORS.map((selector) => document.querySelector<HTMLElement>(selector)).filter((element) => element !== null);
}
