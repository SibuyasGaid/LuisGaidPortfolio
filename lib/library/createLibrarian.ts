import { BOOKS, LIBRARY, type BookId } from "@/content/portfolio";
import { getBookHref } from "@/lib/books";
import type { BookPicker, ShelfMove } from "@/lib/library/bookPicker";
import { chooseShelfView } from "@/lib/library/chooseShelfView";
import { getLoadedLibrary, type Library } from "@/lib/library/libraryStage";
import { chooseShelfReference, getSpineRect, placeOnScreen } from "@/lib/library/shelfFraming";
import { AT_LIBRARY_ATTRIBUTE, LEAVING_ATTRIBUTE, SETTLING_ATTRIBUTE, TAKING_ATTRIBUTE, TRANSIT_ATTRIBUTE } from "@/lib/library/shelfAttributes";
import { BOOK_ARRIVAL_ATTRIBUTE, BOOK_TRANSIT_ROUTE_TIMEOUT_MS, SHELF_SCENE_FADE_SECONDS } from "@/lib/motion/config";
import { waitForPathname } from "@/lib/navigation/waitForPathname";
import type { TransitPlayback } from "@/lib/shelf/bookTransit";

// The site's librarian: every move between the shelf and the books goes
// through here. From the shelf, a chosen book is taken off it and opened into
// its page. Leaving a book, it is closed and put back in its slot first, then
// the next book is taken (or the shelf is simply shown). Where the WebGL
// library is running the moves play in the scene; anywhere else a CSS book
// plays them over the poster of the same view, so they look alike.

export interface Librarian extends BookPicker {
  /** The route changed; arriving at the shelf from a book by the browser's Back, the book is put back. */
  arrive(previousPathname: string, pathname: string): void;
  dispose(): void;
}

type BookTransitModule = typeof import("@/lib/shelf/bookTransit");

const FADE_IN_MS = 450;
const SETTLE_MS = 700;

function findBookAt(pathname: string): BookId | null {
  return BOOKS.find((book) => getBookHref(book.id) === pathname)?.id ?? null;
}

function describeBook(bookId: BookId | null): string {
  const book = BOOKS.find((candidate) => candidate.id === bookId);
  return book ? `Volume ${book.numeral} · ${book.title}` : LIBRARY.sceneInstruction;
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

/** Where a book's spine stands on the screen as it is now. */
function locateSlot(bookId: BookId): DOMRect {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const reference = chooseShelfReference(width / height);
  return placeOnScreen(getSpineRect(bookId, reference), reference, width, height);
}

/** The WebGL library, if it is the shelf here and is ready to play a move. */
function findScene(): Library | null {
  return chooseShelfView().kind === "scene" ? getLoadedLibrary() : null;
}

export function createLibrarian(options: { readonly navigate: (href: string) => void; readonly getPathname: () => string }): Librarian {
  const root = document.documentElement;
  let transits: BookTransitModule | null = null;
  let isMoving = false;
  let hurryMove: (() => void) | null = null;
  /** Chosen while another move was playing: it plays next. */
  let queuedMove: ShelfMove | null = null;
  let previewedBook: BookId | null = null;

  const loadTransits = () => import("@/lib/shelf/bookTransit").then((loaded) => (transits = loaded));

  function showCaption(bookId: BookId | null): void {
    const caption = document.querySelector<HTMLElement>("[data-scene-caption]");
    if (caption) caption.textContent = describeBook(bookId);
  }

  function markPreviewedHotspot(bookId: BookId | null): void {
    for (const hotspot of document.querySelectorAll<HTMLElement>("[data-shelf-book]")) {
      hotspot.toggleAttribute("data-previewed", hotspot.dataset.shelfBook === bookId);
    }
  }

  function open(href: string): void {
    root.setAttribute(BOOK_ARRIVAL_ATTRIBUTE, href);
    options.navigate(href);
  }

  // The library layer over the page it is leaving: shown, then faded up.
  async function raiseLibrary(): Promise<void> {
    root.setAttribute(LEAVING_ATTRIBUTE, "");
    root.setAttribute(TRANSIT_ATTRIBUTE, "");
    await nextFrame();
    root.removeAttribute(LEAVING_ATTRIBUTE);
    await wait(FADE_IN_MS);
  }

  async function lowerLibrary(): Promise<void> {
    root.setAttribute(LEAVING_ATTRIBUTE, "");
    await wait(SHELF_SCENE_FADE_SECONDS.out * 1000);
    root.removeAttribute(TRANSIT_ATTRIBUTE);
    root.removeAttribute(LEAVING_ATTRIBUTE);
  }

  // Back on the shelf: the heading and shading rise into place again.
  async function settleShelf(): Promise<void> {
    root.removeAttribute(TAKING_ATTRIBUTE);
    root.setAttribute(SETTLING_ATTRIBUTE, "");
    showCaption(null);
    await wait(SETTLE_MS);
    root.removeAttribute(SETTLING_ATTRIBUTE);
  }

  async function takeInScene(library: Library, bookId: BookId, href: string): Promise<void> {
    hurryMove = () => library.view.hurry();
    library.view.start();
    await library.view.take(bookId, () => {
      root.setAttribute(TRANSIT_ATTRIBUTE, "");
      open(href);
    });
    await waitForPathname(href, BOOK_TRANSIT_ROUTE_TIMEOUT_MS);
    await lowerLibrary();
    library.view.reset();
    if (!root.hasAttribute(AT_LIBRARY_ATTRIBUTE)) library.view.stop();
  }

  async function takeOverPoster(bookId: BookId, href: string, isOverPage: boolean): Promise<void> {
    const bookTransit = transits ?? (await loadTransits());
    const playback: TransitPlayback = bookTransit.takeBookOff({
      bookId,
      slot: locateSlot(bookId),
      pathname: href,
      onOpen: () => {
        // The book is open over its own backdrop by now, so the poster can go.
        if (isOverPage) void lowerLibrary();
        open(href);
      },
    });
    hurryMove = playback.hurry;
    await playback.finished;
  }

  async function putBackInScene(library: Library, bookId: BookId, isOverPage: boolean): Promise<void> {
    library.view.start();
    library.view.showOpen(bookId);
    if (isOverPage) await raiseLibrary();
    hurryMove = () => library.view.hurry();
    await library.view.putBack();
  }

  async function putBackOverPoster(bookId: BookId, isOverPage: boolean): Promise<void> {
    const bookTransit = transits ?? (await loadTransits());
    if (isOverPage) void raiseLibrary();
    const playback = bookTransit.putBookBack({ bookId, slot: locateSlot(bookId), isFadingIn: isOverPage });
    hurryMove = playback.hurry;
    await playback.finished;
  }

  async function play(move: () => Promise<void>): Promise<void> {
    isMoving = true;
    const hurry = () => hurryMove?.();
    const hurryOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") hurry();
    };
    document.addEventListener("keydown", hurryOnEscape);
    // After the click that started the move, or it would count.
    const listenForClicks = window.setTimeout(() => document.addEventListener("click", hurry), 0);
    try {
      await move();
    } finally {
      window.clearTimeout(listenForClicks);
      document.removeEventListener("keydown", hurryOnEscape);
      document.removeEventListener("click", hurry);
      hurryMove = null;
      isMoving = false;
      // Reading carries on at the page rather than nowhere.
      if (!document.activeElement || document.activeElement === document.body) {
        document.getElementById("main")?.focus({ preventScroll: true });
      }
      const next = queuedMove;
      queuedMove = null;
      if (next && !startMove(next) && next.href !== options.getPathname()) options.navigate(next.href);
    }
  }

  // From the shelf: the book comes off it and opens into its page.
  async function takeFromShelf(bookId: BookId, href: string): Promise<void> {
    showCaption(bookId);
    markPreviewedHotspot(null);
    root.setAttribute(TAKING_ATTRIBUTE, "");
    const library = findScene();
    if (library) await takeInScene(library, bookId, href);
    else await takeOverPoster(bookId, href, false);
    root.removeAttribute(TAKING_ATTRIBUTE);
    showCaption(null);
  }

  // From a book: it is put back, then the next one is taken or the shelf shown.
  async function leaveBook(bookId: BookId, next: ShelfMove): Promise<void> {
    const library = findScene();
    if (library) await putBackInScene(library, bookId, true);
    else await putBackOverPoster(bookId, true);
    if (next.bookId) {
      if (library) await takeInScene(library, next.bookId, next.href);
      else await takeOverPoster(next.bookId, next.href, true);
      return;
    }
    root.setAttribute(TAKING_ATTRIBUTE, "");
    options.navigate(next.href);
    await waitForPathname(next.href, BOOK_TRANSIT_ROUTE_TIMEOUT_MS);
    root.removeAttribute(TRANSIT_ATTRIBUTE);
    await settleShelf();
  }

  // Back at the shelf by the browser's Back: the book is already off the page, open before the reader, and goes home.
  async function returnAfterBack(bookId: BookId): Promise<void> {
    root.setAttribute(TAKING_ATTRIBUTE, "");
    showCaption(bookId);
    const library = findScene();
    if (library) await putBackInScene(library, bookId, false);
    else await putBackOverPoster(bookId, false);
    await settleShelf();
  }

  function startMove(move: ShelfMove): boolean {
    const pathname = options.getPathname();
    const currentBook = findBookAt(pathname);
    previewedBook = null;
    if (pathname === "/" && move.bookId) {
      void play(() => takeFromShelf(move.bookId as BookId, move.href));
      return true;
    }
    if (currentBook && currentBook !== move.bookId && (move.bookId || move.href === "/")) {
      void play(() => leaveBook(currentBook, move));
      return true;
    }
    return false;
  }

  return {
    preview(bookId) {
      if (isMoving || options.getPathname() !== "/" || bookId === previewedBook) return;
      previewedBook = bookId;
      showCaption(bookId);
      const library = findScene();
      if (library) library.view.preview(bookId);
      else markPreviewedHotspot(bookId);
    },
    move(move) {
      // Mid-move, the move under way hurries to its end and this one follows.
      if (isMoving) {
        queuedMove = move;
        hurryMove?.();
        return true;
      }
      return startMove(move);
    },
    arrive(previousPathname, pathname) {
      const previousBook = findBookAt(previousPathname);
      if (isMoving || pathname !== "/" || !previousBook) return;
      void play(() => returnAfterBack(previousBook));
    },
    dispose() {
      markPreviewedHotspot(null);
    },
  };
}
