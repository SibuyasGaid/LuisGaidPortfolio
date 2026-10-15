import type { ScreenBox } from "@/lib/shelf/openSpread";

// A still copy of a book's page, printed on the back of the turning title
// page so that, turned over, it lands as exactly the page it stands in for,
// and can give way to it without a trace. The copy is inert (nothing in it
// can be focused, and it drops the page's ids so none are doubled), its
// images are drawn as soon as it is shown, and anything the page holds in
// place with sticky positioning is set where it shows on screen now.

/**
 * Sets each part the page holds in place with sticky positioning where it
 * shows within the page now, without sticking. Measured from each one's own
 * page, so it holds wherever the copy happens to be on screen (but not while
 * it is scaled or turned).
 */
function pinStuckParts(page: HTMLElement, copy: HTMLElement): void {
  const parts = page.querySelectorAll<HTMLElement>("*");
  const copiedParts = copy.querySelectorAll<HTMLElement>("*");
  const pageTop = page.getBoundingClientRect().top;
  const copyTop = copy.getBoundingClientRect().top;
  parts.forEach((part, index) => {
    const copiedPart = copiedParts[index];
    if (!copiedPart || getComputedStyle(part).position !== "sticky") return;
    copiedPart.style.position = "relative";
    copiedPart.style.top = "0";
    const shown = part.getBoundingClientRect().top - pageTop;
    const laidOut = copiedPart.getBoundingClientRect().top - copyTop;
    copiedPart.style.translate = `0 ${shown - laidOut}px`;
  });
}

/**
 * Prints a copy of page into face, set so that it shows where the page does
 * once face lies where it lands, with its top left corner at origin on
 * screen. face must not be scaled or turned about its horizontal while this
 * runs (turned about its vertical, as the back of a page is, is fine).
 */
export function printPageCopy(face: HTMLElement, page: HTMLElement, origin: Pick<ScreenBox, "left" | "top">): void {
  const copy = page.cloneNode(true);
  if (!(copy instanceof HTMLElement)) return;
  copy.inert = true;
  copy.removeAttribute("id");
  for (const element of copy.querySelectorAll("[id]")) element.removeAttribute("id");
  for (const image of copy.querySelectorAll("img")) {
    image.loading = "eager";
    image.decoding = "sync";
  }
  const box = page.getBoundingClientRect();
  Object.assign(copy.style, {
    position: "absolute",
    left: `${box.left - origin.left}px`,
    top: `${box.top - origin.top}px`,
    width: `${box.width}px`,
    height: `${box.height}px`,
    margin: "0",
  });
  // Under the face's shading, which is its last child.
  face.prepend(copy);
  pinStuckParts(page, copy);
}
