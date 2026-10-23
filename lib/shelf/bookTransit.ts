import { BOOKS, type BookId } from "@/content/portfolio";
import { escapeHtml } from "@/lib/escapeHtml";
import {
  BOOK_COVER_ASPECT,
  BOOK_TRANSIT_EASES,
  BOOK_TRANSIT_HEIGHT_SHARE,
  BOOK_TRANSIT_OPEN_DEGREES,
  BOOK_TRANSIT_PULL_PX,
  BOOK_TRANSIT_SHELF_DIM,
  BOOK_TRANSIT_SPREAD_WIDTH_SHARE,
  BOOK_TRANSIT_TIMINGS,
  BOOK_TRANSIT_TIP_DEGREES,
  MOVE_HURRY_TIME_SCALE,
} from "@/lib/motion/config";
import { gsap } from "@/lib/motion/gsap";
import type { OpenSpread, ScreenBox, ShelfLayer } from "@/lib/shelf/openSpread";
import { fitTitlePage, renderTitlePageText } from "@/lib/shelf/titlePage";
import { playCue } from "@/lib/sound/sound";

// A titled book as a solid object drawn in CSS 3D: a spine, covers, page
// edges and a hinged front cover. Where the WebGL library does not run, this
// is how a book leaves the shelf (over the poster of the bookcase): it slides
// out of its slot tipped by its top edge, turns to show its cover as it comes
// to the middle of the screen and opens on its title page, where the page
// turn (pageTurn.ts) takes over. Put back, it starts open where the page turn
// leaves it, closes, turns its spine to the shelf and slides home. Everything
// it moves is a transform or an opacity.

export interface TransitPlayback {
  /** Settles once the book lies open, or is back in its slot. */
  readonly finished: Promise<void>;
  /** Hurries on to the end: the book opens, or slides into its slot, at a few times the pace. */
  hurry(): void;
}

/** The CSS book as the page turn sees it. */
export interface TransitBook {
  /** Where its open spread lies on screen. */
  measureOpen(): OpenSpread;
  /** The shelf's dimming and the gap the book left, which come and go with the shelf. */
  readonly shelfLayers: readonly ShelfLayer[];
  hide(): void;
  show(): void;
}

export interface TransitTake extends TransitPlayback {
  readonly book: TransitBook;
}

export interface TransitReturn {
  readonly book: TransitBook;
  /** Closes the book and slides it back into its slot. */
  putBack(): TransitPlayback;
}

interface TransitGeometry {
  readonly height: number;
  readonly width: number;
  readonly thickness: number;
  readonly left: number;
  readonly top: number;
  readonly startScale: number;
  readonly travelX: number;
  readonly travelY: number;
  readonly isSpreadCentred: boolean;
}

interface TransitParts {
  readonly book: HTMLElement;
  readonly page: HTMLElement;
  readonly coverInside: HTMLElement;
  /** Every face but the spine: hidden while the book is in its slot. */
  readonly hiddenFaces: readonly HTMLElement[];
  readonly backdrop: HTMLElement;
  /** The dark slot the book leaves on the shelf. */
  readonly gap: HTMLElement;
  readonly cover: HTMLElement;
  readonly spineShade: HTMLElement;
  readonly coverShade: HTMLElement;
  readonly insideShade: HTMLElement;
  readonly sheen: HTMLElement;
}

const MONOGRAM_SVG = `<svg viewBox="0 0 40 40" aria-hidden="true" class="transit-monogram"><circle cx="20" cy="20" r="19" fill="none" stroke="currentColor" stroke-width="0.75"/><circle cx="20" cy="20" r="16.5" fill="none" stroke="currentColor" stroke-width="0.4" opacity="0.6"/><text x="20" y="24.5" text-anchor="middle" fill="currentColor" style="font-family:var(--font-display);font-weight:600;font-size:12.5px;letter-spacing:0.04em">CLG</text></svg>`;

// The box is built at the size it will have in the middle of the screen and
// scaled down onto the spine, so it is sharp where it matters: open, up close.
function measureGeometry(spineRect: DOMRect): TransitGeometry {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const heightByViewport = viewportHeight * BOOK_TRANSIT_HEIGHT_SHARE;
  const isSpreadCentred = heightByViewport * BOOK_COVER_ASPECT * 2 <= viewportWidth * BOOK_TRANSIT_SPREAD_WIDTH_SHARE;
  // On narrow screens the title page is centred and the cover swings off to the left.
  const height = isSpreadCentred
    ? heightByViewport
    : Math.min(heightByViewport, (viewportWidth * BOOK_TRANSIT_SPREAD_WIDTH_SHARE) / BOOK_COVER_ASPECT);
  const thickness = height * (spineRect.width / spineRect.height);
  const spineCentreX = spineRect.left + spineRect.width / 2;
  const spineCentreY = spineRect.top + spineRect.height / 2;
  return {
    height,
    width: height * BOOK_COVER_ASPECT,
    thickness,
    left: spineCentreX - thickness / 2,
    top: spineCentreY - height / 2,
    startScale: spineRect.height / height,
    travelX: viewportWidth / 2 - spineCentreX,
    travelY: viewportHeight / 2 - spineCentreY,
    isSpreadCentred,
  };
}

function renderBookMarkup(bookId: BookId): string {
  const book = BOOKS.find((candidate) => candidate.id === bookId);
  if (!book) throw new Error(`Unknown book: ${bookId}`);
  const numeral = escapeHtml(book.numeral);
  const title = escapeHtml(book.title);
  const volumeLabel = escapeHtml(`Volume ${book.numeral} · ${book.kind}`);
  return `
    <div class="transit-backdrop"></div>
    <div class="transit-gap"></div>
    <div class="transit-book" data-book="${escapeHtml(bookId)}">
      <div class="transit-face transit-edge"></div>
      <div class="transit-face transit-back-cover"></div>
      <div class="transit-face transit-top"></div>
      <div class="transit-face transit-bottom"></div>
      <div class="transit-face transit-page title-page">${renderTitlePageText(bookId)}</div>
      <div class="transit-face transit-spine">
        <span class="transit-spine-numeral">${numeral}</span>
        <span class="transit-spine-title">${escapeHtml(book.navLabel)}</span>
        <i class="transit-shade" data-transit-spine-shade></i>
      </div>
      <div class="transit-cover" data-transit-cover>
        <div class="transit-cover-front">
          ${MONOGRAM_SVG}
          <span class="transit-cover-title">${title}</span>
          <span class="transit-cover-kind">${volumeLabel}</span>
          <i class="transit-sheen" data-transit-sheen></i>
          <i class="transit-shade" data-transit-cover-shade></i>
        </div>
        <div class="transit-cover-inside"><i class="transit-shade" data-transit-inside-shade></i></div>
      </div>
    </div>`;
}

function queryPart(root: HTMLElement, selector: string): HTMLElement {
  const element = root.querySelector<HTMLElement>(selector);
  if (!element) throw new Error(`Book transit is missing ${selector}`);
  return element;
}

function buildBook(root: HTMLElement, bookId: BookId, slot: DOMRect, geometry: TransitGeometry): TransitParts {
  root.innerHTML = renderBookMarkup(bookId);
  const book = queryPart(root, ".transit-book");
  book.style.setProperty("--h", `${geometry.height}px`);
  book.style.setProperty("--w", `${geometry.width}px`);
  book.style.setProperty("--d", `${geometry.thickness}px`);
  book.style.left = `${geometry.left}px`;
  book.style.top = `${geometry.top}px`;
  const gap = queryPart(root, ".transit-gap");
  Object.assign(gap.style, { left: `${slot.left}px`, top: `${slot.top}px`, width: `${slot.width}px`, height: `${slot.height}px` });
  const page = queryPart(root, ".transit-page");
  fitTitlePage(page, geometry.width - 4);
  return {
    book,
    page,
    coverInside: queryPart(root, ".transit-cover-inside"),
    hiddenFaces: Array.from(
      root.querySelectorAll<HTMLElement>(".transit-face:not(.transit-spine), .transit-cover-front, .transit-cover-inside"),
    ),
    backdrop: queryPart(root, ".transit-backdrop"),
    gap,
    cover: queryPart(root, "[data-transit-cover]"),
    spineShade: queryPart(root, "[data-transit-spine-shade]"),
    coverShade: queryPart(root, "[data-transit-cover-shade]"),
    insideShade: queryPart(root, "[data-transit-inside-shade]"),
    sheen: queryPart(root, "[data-transit-sheen]"),
  };
}

function getTransitRoot(): HTMLElement | null {
  return document.querySelector<HTMLElement>("[data-transit-root]");
}

/** Empties the transit root: the book, the shelf's dimming and the gap. */
export function clearTransit(): void {
  const root = getTransitRoot();
  if (!root) return;
  root.replaceChildren();
  root.removeAttribute("data-active");
}

function toScreenBox(element: HTMLElement): ScreenBox {
  const { left, top, width, height } = element.getBoundingClientRect();
  return { left, top, width, height };
}

function describeBook(parts: TransitParts): TransitBook {
  return {
    measureOpen: () => ({ left: toScreenBox(parts.coverInside), right: toScreenBox(parts.page) }),
    shelfLayers: [
      { element: parts.backdrop, opacity: BOOK_TRANSIT_SHELF_DIM, isZoomed: false },
      { element: parts.gap, opacity: 1, isZoomed: true },
    ],
    hide: () => gsap.set(parts.book, { visibility: "hidden" }),
    show: () => gsap.set(parts.book, { visibility: "visible" }),
  };
}

/** The book in its slot: scaled down onto the spine and nudged forward so the spine face sits where the real one is. */
function placeInSlot(parts: TransitParts, geometry: TransitGeometry): void {
  gsap.set(parts.book, {
    transformOrigin: `50% 50% ${-geometry.width / 2}px`,
    scale: geometry.startScale,
    z: (geometry.width / 2) * (1 - geometry.startScale),
  });
  gsap.set(parts.cover, { transformOrigin: "0% 50%", rotationY: 90 });
  gsap.set(parts.hiddenFaces, { opacity: 0 });
}

/** The book open before the reader, as a take leaves it. */
function placeOpen(parts: TransitParts, geometry: TransitGeometry): void {
  gsap.set(parts.book, {
    transformOrigin: `50% 50% ${-geometry.width / 2}px`,
    x: geometry.travelX + (geometry.isSpreadCentred ? geometry.width / 2 : 0),
    y: geometry.travelY,
    z: (geometry.width - geometry.thickness) / 2,
    scale: 1,
    rotationY: -90,
  });
  gsap.set(parts.cover, { transformOrigin: "0% 50%", rotationY: BOOK_TRANSIT_OPEN_DEGREES });
  gsap.set(parts.hiddenFaces, { opacity: 1 });
  gsap.set([parts.spineShade, parts.coverShade, parts.sheen], { opacity: 0 });
  gsap.set(parts.insideShade, { opacity: 0 });
  gsap.set(parts.gap, { opacity: 1 });
}

/**
 * Takes a book off the shelf from its spine's place on screen and opens it
 * before the reader. onOpen is called as the cover opens, to load the book's
 * page; finished settles once it lies open, where the page turn takes over.
 */
export function takeBookOff(options: { readonly bookId: BookId; readonly slot: DOMRect; readonly onOpen: () => void }): TransitTake | null {
  const root = getTransitRoot();
  if (!root) return null;
  const geometry = measureGeometry(options.slot);
  const parts = buildBook(root, options.bookId, options.slot, geometry);
  const timings = BOOK_TRANSIT_TIMINGS;
  let hasOpened = false;

  function open(): void {
    if (hasOpened) return;
    hasOpened = true;
    options.onOpen();
  }

  placeInSlot(parts, geometry);
  gsap.set(parts.gap, { opacity: 0 });
  root.setAttribute("data-active", "");

  const timeline = gsap.timeline();
  timeline
    .addLabel("pull")
    .call(playCue, ["bookSlide", { duration: timings.pull }], "pull")
    .to(parts.gap, { opacity: 1, duration: 0.12, ease: "none" }, "pull")
    .to(
      parts.book,
      {
        z: `+=${BOOK_TRANSIT_PULL_PX}`,
        y: -geometry.height * geometry.startScale * 0.05,
        rotationX: BOOK_TRANSIT_TIP_DEGREES,
        duration: timings.pull,
        ease: BOOK_TRANSIT_EASES.pull,
      },
      "pull",
    )
    // Turning away from the lamp darkens the spine; the cover comes out of the
    // shelf's shadow into the light, catching a glint as it passes the lamp.
    .addLabel("turn", `pull+=${timings.pull - 0.05}`)
    .call(playCue, ["bookTurn", { duration: timings.turn }], "turn")
    .to(
      parts.book,
      {
        x: geometry.travelX,
        y: geometry.travelY,
        z: (geometry.width - geometry.thickness) / 2,
        scale: 1,
        rotationX: 0,
        rotationY: -90,
        duration: timings.turn,
        ease: BOOK_TRANSIT_EASES.turn,
      },
      "turn",
    )
    .to(parts.hiddenFaces, { opacity: 1, duration: timings.turn * 0.3, ease: "power1.out" }, `turn+=${timings.turn * 0.3}`)
    // The shelf dims behind the book but stays in sight.
    .fromTo(parts.backdrop, { opacity: 0 }, { opacity: BOOK_TRANSIT_SHELF_DIM, duration: timings.turn * 0.8, ease: "power1.inOut" }, "pull")
    .fromTo(parts.spineShade, { opacity: 0 }, { opacity: 0.6, duration: timings.turn, ease: "power1.in" }, "turn")
    .fromTo(parts.coverShade, { opacity: 0.55 }, { opacity: 0, duration: timings.turn, ease: "power1.out" }, "turn")
    .fromTo(parts.sheen, { opacity: 0 }, { opacity: 0.45, duration: timings.turn * 0.5, ease: "sine.in" }, "turn+=0.15")
    .to(parts.sheen, { opacity: 0, duration: timings.turn * 0.45, ease: "sine.out" }, `turn+=${0.15 + timings.turn * 0.5}`)
    .addLabel("open", `turn+=${timings.turn - 0.08}`)
    .call(playCue, ["coverOpen", { duration: timings.open }], "open")
    .to(parts.cover, { rotationY: BOOK_TRANSIT_OPEN_DEGREES, duration: timings.open, ease: BOOK_TRANSIT_EASES.open }, "open")
    .fromTo(parts.insideShade, { opacity: 0.45 }, { opacity: 0, duration: timings.open, ease: "power1.out" }, "open")
    .call(open, [], `open+=${timings.open * 0.35}`);
  if (geometry.isSpreadCentred) {
    timeline.to(parts.book, { x: geometry.travelX + geometry.width / 2, duration: timings.open, ease: BOOK_TRANSIT_EASES.open }, "open");
  }

  const finished = new Promise<void>((resolve) => {
    timeline.eventCallback("onComplete", () => {
      open();
      resolve();
    });
  });
  return {
    finished,
    book: describeBook(parts),
    hurry() {
      timeline.timeScale(MOVE_HURRY_TIME_SCALE);
    },
  };
}

/**
 * The book lying open before the reader, where the page turn hands it back
 * (hidden until then, unless isShown), ready to be put back on the shelf:
 * it closes, turns its spine to the shelf and slides into its slot as the
 * shelf's dimming lifts.
 */
export function openBookToReturn(options: { readonly bookId: BookId; readonly slot: DOMRect; readonly isShown: boolean }): TransitReturn | null {
  const root = getTransitRoot();
  if (!root) return null;
  const geometry = measureGeometry(options.slot);
  const parts = buildBook(root, options.bookId, options.slot, geometry);
  const book = describeBook(parts);
  placeOpen(parts, geometry);
  gsap.set(parts.backdrop, { opacity: BOOK_TRANSIT_SHELF_DIM });
  // Hidden, the shelf's dimming and the gap wait for the shelf to come into sight with them.
  if (!options.isShown) {
    book.hide();
    gsap.set([parts.backdrop, parts.gap], { opacity: 0 });
  }
  root.setAttribute("data-active", "");

  return {
    book,
    putBack() {
      const timings = BOOK_TRANSIT_TIMINGS;
      book.show();
      const timeline = gsap.timeline();
      timeline
        .addLabel("close")
        .call(playCue, ["coverClose", { duration: timings.open * 0.85 }], "close")
        .to(parts.cover, { rotationY: 0, duration: timings.open * 0.85, ease: BOOK_TRANSIT_EASES.open }, "close")
        .to(parts.insideShade, { opacity: 0.45, duration: timings.open * 0.85, ease: "power1.in" }, "close")
        .addLabel("turn", `close+=${timings.open * 0.75}`)
        .call(playCue, ["bookTurn", { duration: timings.turn }], "turn")
        .to(
          parts.book,
          {
            x: 0,
            y: -geometry.height * geometry.startScale * 0.05,
            z: (geometry.width / 2) * (1 - geometry.startScale) + BOOK_TRANSIT_PULL_PX,
            scale: geometry.startScale,
            rotationX: BOOK_TRANSIT_TIP_DEGREES,
            rotationY: 0,
            duration: timings.turn,
            ease: BOOK_TRANSIT_EASES.turn,
          },
          "turn",
        )
        .to(parts.backdrop, { opacity: 0, duration: timings.turn + timings.pull, ease: "power1.inOut" }, "turn")
        .to(parts.cover, { rotationY: 90, duration: 0.01 }, `turn+=${timings.turn * 0.7}`)
        .to(parts.hiddenFaces, { opacity: 0, duration: timings.turn * 0.25, ease: "power1.in" }, `turn+=${timings.turn * 0.7}`)
        .fromTo(parts.spineShade, { opacity: 0.6 }, { opacity: 0, duration: timings.turn, ease: "power1.out" }, "turn")
        .addLabel("push", `turn+=${timings.turn}`)
        .call(playCue, ["bookHome", { duration: timings.pull }], "push")
        .to(
          parts.book,
          { y: 0, z: (geometry.width / 2) * (1 - geometry.startScale), rotationX: 0, duration: timings.pull, ease: "power2.inOut" },
          "push",
        )
        .to(parts.gap, { opacity: 0, duration: 0.12, ease: "none" }, `push+=${timings.pull - 0.08}`);
      const finished = new Promise<void>((resolve) => {
        timeline.eventCallback("onComplete", () => {
          clearTransit();
          resolve();
        });
      });
      return {
        finished,
        hurry() {
          timeline.timeScale(MOVE_HURRY_TIME_SCALE);
        },
      };
    },
  };
}
