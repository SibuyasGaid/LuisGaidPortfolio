import type { BookId } from "@/content/portfolio";
import {
  BOOK_TRANSIT_ROUTE_TIMEOUT_MS,
  PAGE_TURN_ATTRIBUTE,
  PAGE_TURN_EASES,
  PAGE_TURN_SHADE,
  PAGE_TURN_TIMINGS,
  TWO_PAGE_QUERY,
} from "@/lib/motion/config";
import { gsap } from "@/lib/motion/gsap";
import { waitForPathname } from "@/lib/navigation/waitForPathname";
import { encloseBoxes, type OpenSpread, type ScreenBox, type ShelfLayer } from "@/lib/shelf/openSpread";
import { printPageCopy } from "@/lib/shelf/printPageCopy";
import { fitTitlePage, renderTitlePageText } from "@/lib/shelf/titlePage";
import { playCue } from "@/lib/sound/sound";

// Between the shelf and a book's page. Once a book off the shelf lies open
// (in the live scene, or as the CSS book over the poster), a flat copy of it
// takes its place and the reader zooms in: the copy grows until its pages lie
// exactly where the book's page has them, while the shelf behind slips out of
// focus into the soft copy of it that every page stands on. Then the title
// page turns over onto the content, and on its back is the book's own left
// page (printPageCopy), so it lands as that page. Leaving, that page lifts
// and the title page turns back over the content, and the reader steps back
// from the open book, which is handed back to be closed and shelved. Only
// transforms and opacity move.

export interface PageTurnPlayback {
  readonly finished: Promise<void>;
  /** Plays the rest quickly. */
  hurry(): void;
}

interface BookPage {
  readonly book: HTMLElement;
  readonly pages: HTMLElement;
}

/** Where the copy's parts lie once it has become the book's page. */
interface PageLayout {
  /** The book's paper, uncut by the screen. */
  readonly paper: ScreenBox;
  readonly board: ScreenBox;
  readonly left: ScreenBox;
  readonly right: ScreenBox;
  /** Two pages side by side; otherwise one, with the cover's inside off the screen to its left. */
  readonly isTwoUp: boolean;
  readonly pageRadius: number;
  readonly boardRadius: number;
}

/** Where they lie as the open book, before the zoom. */
interface SpreadLayout {
  readonly board: ScreenBox;
  readonly left: ScreenBox;
  readonly right: ScreenBox;
}

interface CopyParts {
  readonly root: HTMLElement;
  /** The cloth around the pages. */
  readonly board: HTMLElement;
  readonly endpaper: HTMLElement;
  /** The shadow the turning page casts on the page under it. */
  readonly under: HTMLElement;
  /** The title page, which turns over. */
  readonly leaf: HTMLElement;
  /**
   * The back of the title page. It, not the leaf, is what fades: fading the
   * leaf would flatten it, and its front would show through mirrored.
   */
  readonly back: HTMLElement;
  /** Whether the book's left page is printed on the back. */
  readonly hasPrintedBack: boolean;
  readonly text: HTMLElement;
  readonly frontShade: HTMLElement;
  readonly backShade: HTMLElement;
}

interface Player {
  play(timeline: gsap.core.Timeline): Promise<void>;
  hurry(): void;
}

const HURRIED_TIME_SCALE = 4;
/** How long to look for a book's page once its address shows, in frames. */
const PAGE_SEARCH_FRAMES = 90;
/** The turned page fades over this many degrees as it goes off the screen's edge, on one page. */
const OFF_EDGE_FADE_DEGREES = 70;

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function getTransitRoot(): HTMLElement | null {
  return document.querySelector<HTMLElement>("[data-transit-root]");
}

/** The transit root stops catching clicks once nothing is left in it. */
function releaseHost(host: HTMLElement): void {
  if (!host.children.length) host.removeAttribute("data-active");
}

function findBookPage(bookId: BookId): BookPage | null {
  for (const article of document.querySelectorAll<HTMLElement>(`main [data-book="${bookId}"]`)) {
    const book = article.querySelector<HTMLElement>(".book");
    const pages = book?.querySelector<HTMLElement>(".book-pages");
    // A page kept from an earlier visit, hidden by the router, has no boxes.
    if (book && pages && pages.getClientRects().length > 0) return { book, pages };
  }
  return null;
}

async function waitForBookPage(bookId: BookId, pathname: string): Promise<BookPage | null> {
  await waitForPathname(pathname, BOOK_TRANSIT_ROUTE_TIMEOUT_MS);
  for (let frame = 0; frame < PAGE_SEARCH_FRAMES; frame++) {
    if (findBookPage(bookId)) {
      // One more frame, for the router to bring the new page to its top.
      await nextFrame();
      return findBookPage(bookId);
    }
    await nextFrame();
  }
  return null;
}

function readRadius(element: HTMLElement): number {
  return parseFloat(getComputedStyle(element).borderTopLeftRadius) || 0;
}

function measurePage(page: BookPage): PageLayout {
  const pages = page.pages.getBoundingClientRect();
  const book = page.book.getBoundingClientRect();
  const pageRadius = readRadius(page.pages);
  // Cut to the screen, with the rounded corners at any cut kept out of sight.
  const overhang = pageRadius + 2;
  const top = Math.max(pages.top, -overhang);
  const bottom = Math.min(pages.bottom, window.innerHeight + overhang);
  const height = Math.max(bottom - top, 1);
  const isTwoUp = window.matchMedia(TWO_PAGE_QUERY).matches;
  const pageWidth = isTwoUp ? pages.width / 2 : pages.width;
  const right = { left: pages.right - pageWidth, top, width: pageWidth, height };
  const left = { left: right.left - pageWidth, top, width: pageWidth, height };
  const board = {
    left: book.left,
    top: top - (pages.top - book.top),
    width: book.width,
    height: height + (pages.top - book.top) + (book.bottom - pages.bottom),
  };
  const paper = { left: pages.left, top: pages.top, width: pages.width, height: pages.height };
  return { paper, board, left, right, isTwoUp, pageRadius, boardRadius: readRadius(page.book) };
}

function describeSpread(spread: OpenSpread): SpreadLayout {
  return { board: encloseBoxes([spread.left, spread.right]), left: spread.left, right: spread.right };
}

function placeBox(element: HTMLElement, box: ScreenBox): void {
  Object.assign(element.style, { left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px` });
}

function queryPart(root: HTMLElement, selector: string): HTMLElement {
  const element = root.querySelector<HTMLElement>(selector);
  if (!element) throw new Error(`Page turn is missing ${selector}`);
  return element;
}

/** What lies on the left of a book's page once its title page is turned: its left page, or the left half of its one wide page. */
function findLeftPage(page: BookPage): HTMLElement | null {
  return page.pages.querySelector<HTMLElement>(":scope > .page-left, :scope > .page-folio");
}

// The open book as it lies once it has become the page: cloth, the inside of
// the cover, and the title page with the book's left page printed on its back
// (where the two pages sit side by side; on one page its back goes off the
// screen and is plain paper), laid out at full size.
function buildCopy(host: HTMLElement, bookId: BookId, page: BookPage, layout: PageLayout): CopyParts {
  const root = document.createElement("div");
  root.className = "turn";
  root.dataset.book = bookId;
  root.innerHTML = `
    <div class="turn-board book-cover-surface" data-turn-board></div>
    <div class="turn-endpaper" data-turn-endpaper></div>
    <div class="turn-under" data-turn-under></div>
    <div class="turn-leaf" data-turn-leaf>
      <div class="turn-face title-page" data-turn-front>${renderTitlePageText(bookId)}<i class="turn-shade" data-turn-front-shade></i></div>
      <div class="turn-face turn-back" data-turn-back><i class="turn-shade" data-turn-back-shade></i></div>
    </div>`;
  host.append(root);

  const leftPage = layout.isTwoUp ? findLeftPage(page) : null;
  const parts: CopyParts = {
    root,
    board: queryPart(root, "[data-turn-board]"),
    endpaper: queryPart(root, "[data-turn-endpaper]"),
    under: queryPart(root, "[data-turn-under]"),
    leaf: queryPart(root, "[data-turn-leaf]"),
    back: queryPart(root, "[data-turn-back]"),
    hasPrintedBack: leftPage !== null,
    text: queryPart(root, ".title-page-text"),
    frontShade: queryPart(root, "[data-turn-front-shade]"),
    backShade: queryPart(root, "[data-turn-back-shade]"),
  };
  const front = queryPart(root, "[data-turn-front]");
  placeBox(parts.board, layout.board);
  placeBox(parts.endpaper, layout.left);
  placeBox(parts.under, layout.right);
  placeBox(parts.leaf, layout.right);
  front.style.setProperty("--page-w", `${layout.right.width}px`);

  const radius = layout.pageRadius;
  parts.board.style.borderRadius = `${layout.boardRadius}px`;
  parts.endpaper.style.borderRadius = `${radius}px 0 0 ${radius}px`;
  front.style.borderRadius = layout.isTwoUp ? `0 ${radius}px ${radius}px 0` : `${radius}px`;
  parts.back.style.borderRadius = layout.isTwoUp ? `${radius}px 0 0 ${radius}px` : `${radius}px`;
  // The page turns about the spine, seen from straight ahead of it.
  const visibleHeight = Math.min(layout.right.height, window.innerHeight - Math.max(layout.right.top, 0));
  root.style.perspectiveOrigin = `${layout.right.left}px ${Math.max(layout.right.top, 0) + visibleHeight / 2}px`;
  fitTitlePage(front, layout.right.width);
  if (leftPage) {
    // Its paper's grain lines up with the book's, and the left page is printed over it.
    parts.back.style.backgroundPosition = `${layout.paper.left - layout.left.left}px ${layout.paper.top - layout.left.top}px`;
    printPageCopy(parts.back, leftPage, layout.left);
  }
  return parts;
}

function lerp(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

function lerpBox(from: ScreenBox, to: ScreenBox, progress: number): ScreenBox {
  return {
    left: lerp(from.left, to.left, progress),
    top: lerp(from.top, to.top, progress),
    width: lerp(from.width, to.width, progress),
    height: lerp(from.height, to.height, progress),
  };
}

/** Moves an element laid out at home onto a box, by its transform. */
function moveOnto(element: HTMLElement, home: ScreenBox, box: ScreenBox): { readonly scaleX: number; readonly scaleY: number } {
  const scaleX = box.width / home.width;
  const scaleY = box.height / home.height;
  element.style.transform = `translate(${box.left - home.left}px, ${box.top - home.top}px) scale(${scaleX}, ${scaleY})`;
  return { scaleX, scaleY };
}

/** The copy part way between the open book (0) and the page (1). */
function placeCopy(parts: CopyParts, layout: PageLayout, spread: SpreadLayout, progress: number): void {
  moveOnto(parts.board, layout.board, lerpBox(spread.board, layout.board, progress));
  moveOnto(parts.endpaper, layout.left, lerpBox(spread.left, layout.left, progress));
  const leaf = moveOnto(parts.leaf, layout.right, lerpBox(spread.right, layout.right, progress));
  // The paper may stretch on its way to a page of another shape; the lettering keeps its proportions.
  parts.text.style.transform = `scale(1, ${leaf.scaleX / leaf.scaleY})`;
}

/** The title page turned by an angle in degrees: 0 lying on the right, 180 turned over onto the left. */
function turnLeaf(parts: CopyParts, layout: PageLayout, angle: number): void {
  parts.leaf.style.transform = `rotateY(${-angle}deg)`;
  const lift = Math.sin((angle * Math.PI) / 180);
  parts.frontShade.style.opacity = String(angle < 90 ? PAGE_TURN_SHADE * lift : 0);
  parts.backShade.style.opacity = String(angle < 90 ? 0 : PAGE_TURN_SHADE * lift);
  parts.under.style.opacity = String(1 - angle / 180);
  if (!layout.isTwoUp) parts.back.style.opacity = String(Math.min(1, Math.max(0, (180 - angle) / OFF_EDGE_FADE_DEGREES)));
}

/**
 * The printed back of the title page giving way to the book's own left page
 * (out), or taking its place (in). They are laid out alike, but text drawn
 * on a turned page is smoothed a little differently, so the two cross over
 * rather than swap at once. The back fades, not the leaf: fading the leaf
 * would flatten it.
 */
function crossOverPrint(parts: CopyParts, direction: "in" | "out"): gsap.core.Tween {
  const isIn = direction === "in";
  return gsap.fromTo(parts.back, { opacity: isIn ? 0 : 1 }, { opacity: isIn ? 1 : 0, duration: PAGE_TURN_TIMINGS.handoff, ease: "none" });
}

function findBackdropImage(): HTMLElement | null {
  return document.querySelector<HTMLElement>("[data-shelf-backdrop] .shelf-backdrop-image");
}

/** How much closer the soft shelf behind the pages is than the shelf's own view (globals.css). */
function readBackdropZoom(): number {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--shelf-backdrop-zoom")) || 1;
}

/**
 * The shelf going out of sight as the reader zooms into the book (in), or
 * coming back as they step away from it (out), zooming with them about the
 * middle of the screen. The soft shelf behind the pages zooms the same way.
 */
function zoomShelf(layers: readonly ShelfLayer[], direction: "in" | "out"): gsap.core.Timeline {
  const isIn = direction === "in";
  const scale = readBackdropZoom();
  const { zoom, shelfFadeShare } = PAGE_TURN_TIMINGS;
  const fade = zoom * shelfFadeShare;
  const timeline = gsap.timeline();
  for (const layer of layers) {
    timeline.fromTo(
      layer.element,
      { opacity: isIn ? layer.opacity : 0 },
      { opacity: isIn ? 0 : layer.opacity, duration: fade, ease: "power1.inOut" },
      isIn ? 0 : zoom - fade,
    );
    if (!layer.isZoomed) continue;
    const box = layer.element.getBoundingClientRect();
    gsap.set(layer.element, { transformOrigin: `${window.innerWidth / 2 - box.left}px ${window.innerHeight / 2 - box.top}px` });
    timeline.fromTo(layer.element, { scale: isIn ? 1 : scale }, { scale: isIn ? scale : 1, duration: zoom, ease: PAGE_TURN_EASES.zoom }, 0);
  }
  const backdrop = findBackdropImage();
  if (backdrop) {
    timeline.fromTo(backdrop, { scale: isIn ? 1 : scale }, { scale: isIn ? scale : 1, duration: zoom, ease: PAGE_TURN_EASES.zoom }, 0);
  }
  return timeline;
}

/** Lets the CSS lay the shelf's layers out again; those meant to stay in sight keep the opacity they were given. */
function settleShelf(layers: readonly ShelfLayer[], isInSight: boolean): void {
  for (const layer of layers) {
    const isOpacityKept = isInSight && layer.opacity !== 1;
    gsap.set(layer.element, { clearProps: isOpacityKept ? "transform,transformOrigin" : "opacity,transform,transformOrigin" });
  }
  const backdrop = findBackdropImage();
  if (backdrop) gsap.set(backdrop, { clearProps: "transform" });
}

function createPlayer(): Player {
  let timeScale = 1;
  let current: gsap.core.Timeline | null = null;
  return {
    play(timeline) {
      current = timeline;
      timeline.timeScale(timeScale);
      return new Promise((resolve) => {
        timeline.eventCallback("onComplete", () => resolve());
      });
    },
    hurry() {
      timeScale = HURRIED_TIME_SCALE;
      current?.timeScale(timeScale);
    },
  };
}

/**
 * From a book lying open off the shelf into its page, once the page is at
 * pathname: the zoom, then the turn. The copy fades in over the open book as
 * the zoom sets off (the scene's lamps colour the book a little differently),
 * then onCovered is called to hide the book; onShelfGone once the shelf is
 * out of sight.
 */
export function turnIntoPage(options: {
  readonly bookId: BookId;
  readonly pathname: string;
  readonly from: OpenSpread | null;
  readonly shelf: readonly ShelfLayer[];
  readonly onCovered: () => void;
  readonly onShelfGone: () => void;
}): PageTurnPlayback {
  const player = createPlayer();
  const root = document.documentElement;
  let parts: CopyParts | null = null;

  async function play(): Promise<void> {
    const page = await waitForBookPage(options.bookId, options.pathname);
    const host = getTransitRoot();
    if (!page || !host || !options.from) {
      // Nothing to zoom into: the shelf simply goes.
      options.onCovered();
      options.onShelfGone();
      settleShelf(options.shelf, false);
      return;
    }
    const layout = measurePage(page);
    const spread = describeSpread(options.from);
    const copy = buildCopy(host, options.bookId, page, layout);
    parts = copy;
    host.setAttribute("data-active", "");
    const zoom = { progress: 0 };
    const place = () => placeCopy(copy, layout, spread, zoom.progress);
    place();

    // Flat until the turn, so fading the whole copy in flattens nothing that matters.
    await player.play(
      gsap
        .timeline()
        .call(playCue, ["zoomIn", { duration: PAGE_TURN_TIMINGS.zoom }], 0)
        .to(zoom, { progress: 1, duration: PAGE_TURN_TIMINGS.zoom, ease: PAGE_TURN_EASES.zoom, onUpdate: place }, 0)
        .fromTo(copy.root, { opacity: 0 }, { opacity: 1, duration: PAGE_TURN_TIMINGS.handoff, ease: "none", clearProps: "opacity" }, 0)
        .call(options.onCovered, [], PAGE_TURN_TIMINGS.handoff)
        .add(zoomShelf(options.shelf, "in"), 0),
    );
    options.onShelfGone();
    settleShelf(options.shelf, false);

    // The page is under the copy now, exactly where the copy lies.
    root.setAttribute(PAGE_TURN_ATTRIBUTE, "turn");
    copy.board.style.visibility = "hidden";
    const turn = { angle: 0 };
    const step = () => turnLeaf(copy, layout, turn.angle);
    step();
    const timeline = gsap
      .timeline()
      .call(playCue, ["pageTurn", { duration: PAGE_TURN_TIMINGS.turn }], 0)
      .to(turn, { angle: 180, duration: PAGE_TURN_TIMINGS.turn, ease: PAGE_TURN_EASES.turn, onUpdate: step });
    if (copy.hasPrintedBack) {
      // Turned over, it lies as the book's left page, which it is a copy of, and gives way to it.
      timeline.set(copy.endpaper, { visibility: "hidden" }).add(crossOverPrint(copy, "out"));
    }
    await player.play(timeline);
  }

  const finished = play().finally(() => {
    parts?.root.remove();
    const host = getTransitRoot();
    if (host) releaseHost(host);
    root.removeAttribute(PAGE_TURN_ATTRIBUTE);
  });
  return { finished, hurry: player.hurry };
}

/**
 * From a book's page back to the book lying open off the shelf: the title
 * page turns back over the content, then the reader steps back from the open
 * book as the shelf comes into focus behind it. prepare gets the open book
 * ready where it will be handed back (still hidden) and says where its
 * spread lies; raiseShelf brings the shelf up behind the page once the page
 * is covered; onUncovered shows the open book under the copy as the copy
 * fades away over it.
 */
export function turnBackFromPage(options: {
  readonly bookId: BookId;
  readonly prepare: () => Promise<{ readonly spread: OpenSpread | null; readonly shelf: readonly ShelfLayer[] }>;
  readonly raiseShelf: () => void;
  readonly onUncovered: () => void;
}): PageTurnPlayback {
  const player = createPlayer();
  const root = document.documentElement;
  let parts: CopyParts | null = null;

  async function play(): Promise<void> {
    const page = findBookPage(options.bookId);
    const host = getTransitRoot();
    const preparing = options.prepare();
    if (!page || !host) {
      const { shelf } = await preparing;
      options.raiseShelf();
      options.onUncovered();
      settleShelf(shelf, true);
      return;
    }
    const layout = measurePage(page);
    const copy = buildCopy(host, options.bookId, page, layout);
    parts = copy;
    host.setAttribute("data-active", "");
    root.setAttribute(PAGE_TURN_ATTRIBUTE, "turn");
    copy.board.style.visibility = "hidden";
    const turn = { angle: 180 };
    const step = () => turnLeaf(copy, layout, turn.angle);
    step();
    const timeline = gsap.timeline();
    if (copy.hasPrintedBack) {
      // Turned over, the copy lies over the book's left page and takes its place, then lifts off the inside of the cover.
      copy.endpaper.style.visibility = "hidden";
      timeline.add(crossOverPrint(copy, "in")).set(copy.endpaper, { visibility: "visible" });
    }
    timeline
      .call(playCue, ["pageReturn", { duration: PAGE_TURN_TIMINGS.turn }])
      .to(turn, { angle: 0, duration: PAGE_TURN_TIMINGS.turn, ease: PAGE_TURN_EASES.turn, onUpdate: step });
    await player.play(timeline);

    // The copy covers the page: the page goes, and the shelf comes up behind it, out of sight for now.
    copy.board.style.visibility = "visible";
    copy.under.style.opacity = "0";
    root.setAttribute(PAGE_TURN_ATTRIBUTE, "hold");
    const { spread, shelf } = await preparing;
    gsap.set(
      shelf.map((layer) => layer.element),
      { opacity: 0 },
    );
    options.raiseShelf();
    const zoom = { progress: 1 };
    const place = () => {
      if (spread) placeCopy(copy, layout, describeSpread(spread), zoom.progress);
    };
    const { zoom: zoomDuration, handoff } = PAGE_TURN_TIMINGS;
    const stepBack = gsap
      .timeline()
      .call(playCue, ["zoomOut", { duration: zoomDuration }], 0)
      .add(zoomShelf(shelf, "out"), 0);
    if (spread) stepBack.to(zoom, { progress: 0, duration: zoomDuration, ease: PAGE_TURN_EASES.zoom, onUpdate: place }, 0);
    stepBack
      .call(options.onUncovered, [], spread ? zoomDuration - handoff : 0)
      .to(copy.root, { opacity: 0, duration: spread ? handoff : zoomDuration, ease: "none" }, spread ? zoomDuration - handoff : 0);
    await player.play(stepBack);
    settleShelf(shelf, true);
  }

  const finished = play().finally(() => {
    parts?.root.remove();
    const host = getTransitRoot();
    if (host) releaseHost(host);
    root.removeAttribute(PAGE_TURN_ATTRIBUTE);
  });
  return { finished, hurry: player.hurry };
}
