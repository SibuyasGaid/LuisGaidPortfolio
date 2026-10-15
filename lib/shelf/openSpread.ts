/** A box on screen, in CSS pixels from the viewport's top left. */
export interface ScreenBox {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

/** Where an open book's two pages lie on screen. */
export interface OpenSpread {
  /** The inside of the front cover. */
  readonly left: ScreenBox;
  /** The title page. */
  readonly right: ScreenBox;
}

/** Something drawn over the shelf, which comes into sight and goes out of it with the shelf. */
export interface ShelfLayer {
  readonly element: HTMLElement;
  /** Its opacity while the shelf is in sight. */
  readonly opacity: number;
  /** Zoomed about the middle of the screen with the shelf; false for full-screen shading that need not move. */
  readonly isZoomed: boolean;
}

/** The smallest box around the given ones. */
export function encloseBoxes(boxes: readonly ScreenBox[]): ScreenBox {
  const left = Math.min(...boxes.map((box) => box.left));
  const top = Math.min(...boxes.map((box) => box.top));
  const right = Math.max(...boxes.map((box) => box.left + box.width));
  const bottom = Math.max(...boxes.map((box) => box.top + box.height));
  return { left, top, width: right - left, height: bottom - top };
}
