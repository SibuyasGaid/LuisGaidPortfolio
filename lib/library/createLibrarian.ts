import { BOOKS, LIBRARY, type BookId } from "@/content/portfolio";
import { getBookHref } from "@/lib/books";
import type { BookPicker, ShelfMove } from "@/lib/library/bookPicker";
import { getLoadedLibrary, type Library } from "@/lib/library/libraryStage";
import { chooseShelfReference, getSpineRect, placeOnScreen } from "@/lib/library/shelfFraming";
import { AT_LIBRARY_ATTRIBUTE, SETTLING_ATTRIBUTE, TAKING_ATTRIBUTE, TRANSIT_ATTRIBUTE } from "@/lib/library/shelfAttributes";
import {
  BOOK_ARRIVAL_ATTRIBUTE,
  BOOK_TRANSIT_ROUTE_TIMEOUT_MS,
  PAGE_TURN_ATTRIBUTE,
  REDUCED_MOTION_QUERY,
} from "@/lib/motion/config";
import { waitForPathname } from "@/lib/navigation/waitForPathname";
import { reportError } from "@/lib/reportError";
import type { TransitReturn } from "@/lib/shelf/bookTransit";
import type { ShelfLayer } from "@/lib/shelf/openSpread";
import { playCue } from "@/lib/sound/sound";

// The site's librarian: every move between the shelf and the books goes
// through here. From the shelf, a chosen book is taken off it and opened; the
// reader zooms into it and its title page turns over onto its page. Leaving a
// book, its title page turns back, the reader steps back from it, and it is
// closed and put back in its slot; then the next book is taken (or the shelf
// is simply shown). Where the WebGL library is running the book moves in the
// scene; anywhere else a CSS book plays it over the poster of the same view,
// so they look alike. The zoom and the page turn are the same in both.

export interface Librarian extends BookPicker {
  /** The route changed; arriving at the shelf from a book by the browser's Back, the book is put back. */
  arrive(previousPathname: string, pathname: string): void;
  dispose(): void;
}

interface ShelfMoves {
  readonly bookTransit: typeof import("@/lib/shelf/bookTransit");
  readonly pageTurn: typeof import("@/lib/shelf/pageTurn");
}

const SETTLE_MS = 700;
/** The poster behind a move is given this long to be ready before the move carries on without it. */
const POSTER_READY_TIMEOUT_MS = 1200;

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

function isMotionReduced(): boolean {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/** Where a book's spine stands on the screen as it is now. */
function locateSlot(bookId: BookId): DOMRect {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const reference = chooseShelfReference(width / height);
  return placeOnScreen(getSpineRect(bookId, reference), reference, width, height);
}

/** The WebGL library, if it is built and ready to play a move (it is only ever built where it runs well). */
function findScene(): Library | null {
  return getLoadedLibrary();
}

function getLibraryLayer(): HTMLElement | null {
  return document.querySelector<HTMLElement>("[data-library-scene]");
}

/** The library layer (live scene and poster), which rises over the page for a move and zooms with the reader. */
function getLibraryLayers(): ShelfLayer[] {
  const element = getLibraryLayer();
  return element ? [{ element, opacity: 1, isZoomed: true }] : [];
}

/** The poster in the library layer, loaded and decoded so it shows the moment the layer rises (until then it waits, unloaded). */
function readyShelfPoster(): Promise<void> {
  const image = document.querySelector<HTMLImageElement>("[data-library-scene] .shelf-poster img");
  if (!image) return Promise.resolve();
  image.loading = "eager";
  return Promise.race([image.decode().catch(() => {}), wait(POSTER_READY_TIMEOUT_MS)]);
}

export function createLibrarian(options: { readonly navigate: (href: string) => void; readonly getPathname: () => string }): Librarian {
  const root = document.documentElement;
  let moves: ShelfMoves | null = null;
  let isMoving = false;
  let isHurried = false;
  let hurryMove: (() => void) | null = null;
  /** Chosen while another move was playing: it plays next. */
  let queuedMove: ShelfMove | null = null;
  let previewedBook: BookId | null = null;

  function loadMoves(): Promise<ShelfMoves> {
    if (moves) return Promise.resolve(moves);
    return Promise.all([import("@/lib/shelf/bookTransit"), import("@/lib/shelf/pageTurn")]).then(([bookTransit, pageTurn]) => {
      moves = { bookTransit, pageTurn };
      return moves;
    });
  }

  function showCaption(bookId: BookId | null): void {
    const caption = document.querySelector<HTMLElement>("[data-scene-caption]");
    if (caption) caption.textContent = describeBook(bookId);
  }

  function markPreviewedHotspot(bookId: BookId | null): void {
    for (const hotspot of document.querySelectorAll<HTMLElement>("[data-shelf-book]")) {
      hotspot.toggleAttribute("data-previewed", hotspot.dataset.shelfBook === bookId);
    }
  }

  /** What hurrying does at this stage of the move; once hurried, every stage after it hurries too. */
  function follow(hurry: () => void): void {
    hurryMove = hurry;
    if (isHurried) hurry();
  }

  function hurryAll(): void {
    isHurried = true;
    hurryMove?.();
  }

  // The book's page loads under the library, which rises over the page it leaves, hidden until the page turn reaches it.
  function open(href: string): void {
    root.setAttribute(BOOK_ARRIVAL_ATTRIBUTE, href);
    root.setAttribute(PAGE_TURN_ATTRIBUTE, "hold");
    root.setAttribute(TRANSIT_ATTRIBUTE, "");
    options.navigate(href);
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
    const loading = loadMoves();
    follow(() => library.view.hurry());
    library.view.start();
    await library.view.take(bookId, () => open(href));
    const { pageTurn } = await loading;
    const turn = pageTurn.turnIntoPage({
      bookId,
      pathname: href,
      from: library.view.measureOpen(),
      shelf: getLibraryLayers(),
      onCovered: () => {
        library.view.setOpenBookShown(false);
        library.view.stop();
      },
      onShelfGone: () => {
        root.removeAttribute(TRANSIT_ATTRIBUTE);
        library.view.reset();
      },
    });
    follow(turn.hurry);
    await turn.finished;
  }

  async function takeOverPoster(bookId: BookId, href: string): Promise<void> {
    const { bookTransit, pageTurn } = await loadMoves();
    void readyShelfPoster();
    const take = bookTransit.takeBookOff({ bookId, slot: locateSlot(bookId), onOpen: () => open(href) });
    if (!take) {
      open(href);
      return;
    }
    follow(take.hurry);
    await take.finished;
    const turn = pageTurn.turnIntoPage({
      bookId,
      pathname: href,
      from: take.book.measureOpen(),
      shelf: [...getLibraryLayers(), ...take.book.shelfLayers],
      onCovered: take.book.hide,
      onShelfGone: () => root.removeAttribute(TRANSIT_ATTRIBUTE),
    });
    follow(turn.hurry);
    await turn.finished;
    bookTransit.clearTransit();
  }

  async function putBackInScene(library: Library, bookId: BookId, isOverPage: boolean): Promise<void> {
    if (isOverPage) {
      const { pageTurn } = await loadMoves();
      const turn = pageTurn.turnBackFromPage({
        bookId,
        prepare: async () => {
          library.view.showOpen(bookId);
          library.view.setOpenBookShown(false);
          return { spread: library.view.measureOpen(), shelf: getLibraryLayers() };
        },
        raiseShelf: () => root.setAttribute(TRANSIT_ATTRIBUTE, ""),
        onUncovered: () => library.view.setOpenBookShown(true),
      });
      follow(turn.hurry);
      await turn.finished;
    } else {
      library.view.showOpen(bookId);
    }
    library.view.start();
    follow(() => library.view.hurry());
    await library.view.putBack();
  }

  async function putBackOverPoster(bookId: BookId, isOverPage: boolean): Promise<void> {
    const { bookTransit, pageTurn } = await loadMoves();
    const slot = locateSlot(bookId);
    // Filled in by the page turn's prepare, or straight away with no page to turn back.
    const returning: { book: TransitReturn | null } = { book: null };
    if (isOverPage) {
      const turn = pageTurn.turnBackFromPage({
        bookId,
        prepare: async () => {
          returning.book = bookTransit.openBookToReturn({ bookId, slot, isShown: false });
          await readyShelfPoster();
          return {
            spread: returning.book?.book.measureOpen() ?? null,
            shelf: [...getLibraryLayers(), ...(returning.book?.book.shelfLayers ?? [])],
          };
        },
        raiseShelf: () => root.setAttribute(TRANSIT_ATTRIBUTE, ""),
        onUncovered: () => returning.book?.book.show(),
      });
      follow(turn.hurry);
      await turn.finished;
    } else {
      returning.book = bookTransit.openBookToReturn({ bookId, slot, isShown: true });
    }
    if (!returning.book) return;
    const playback = returning.book.putBack();
    follow(playback.hurry);
    await playback.finished;
  }

  // A move that failed part way leaves the page as it would be with no move at all.
  function recover(): void {
    for (const attribute of [TAKING_ATTRIBUTE, TRANSIT_ATTRIBUTE, SETTLING_ATTRIBUTE, PAGE_TURN_ATTRIBUTE]) root.removeAttribute(attribute);
    moves?.bookTransit.clearTransit();
    const layer = getLibraryLayer();
    if (layer) layer.style.removeProperty("opacity");
    if (layer) layer.style.removeProperty("transform");
    if (root.hasAttribute(AT_LIBRARY_ATTRIBUTE)) getLoadedLibrary()?.view.reset();
  }

  async function play(move: () => Promise<void>): Promise<void> {
    isMoving = true;
    isHurried = false;
    const hurryOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") hurryAll();
    };
    document.addEventListener("keydown", hurryOnEscape);
    // After the click that started the move, or it would count.
    const listenForClicks = window.setTimeout(() => document.addEventListener("click", hurryAll), 0);
    try {
      await move();
    } catch (error) {
      reportError(error, "shelf move");
      recover();
    } finally {
      window.clearTimeout(listenForClicks);
      document.removeEventListener("keydown", hurryOnEscape);
      document.removeEventListener("click", hurryAll);
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

  // From the shelf: the book comes off it, opens, and turns into its page.
  async function takeFromShelf(bookId: BookId, href: string): Promise<void> {
    showCaption(bookId);
    markPreviewedHotspot(null);
    root.setAttribute(TAKING_ATTRIBUTE, "");
    const library = findScene();
    if (library) await takeInScene(library, bookId, href);
    else await takeOverPoster(bookId, href);
    root.removeAttribute(TAKING_ATTRIBUTE);
    showCaption(null);
  }

  // From a book: it turns back into the open book and is put back, then the next one is taken or the shelf shown.
  async function leaveBook(bookId: BookId, next: ShelfMove): Promise<void> {
    const library = findScene();
    if (library) await putBackInScene(library, bookId, true);
    else await putBackOverPoster(bookId, true);
    if (next.bookId) {
      if (library) await takeInScene(library, next.bookId, next.href);
      else await takeOverPoster(next.bookId, next.href);
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
      if (bookId) {
        void loadMoves();
        playCue("bookPreview");
      }
      const library = findScene();
      if (library) library.view.preview(bookId);
      else markPreviewedHotspot(bookId);
    },
    move(move) {
      // With reduced motion, links simply go where they lead.
      if (isMotionReduced()) return false;
      // Mid-move, the move under way hurries to its end and this one follows.
      if (isMoving) {
        queuedMove = move;
        hurryAll();
        return true;
      }
      return startMove(move);
    },
    arrive(previousPathname, pathname) {
      const previousBook = findBookAt(previousPathname);
      if (isMoving || isMotionReduced() || pathname !== "/" || !previousBook) return;
      void play(() => returnAfterBack(previousBook));
    },
    dispose() {
      markPreviewedHotspot(null);
    },
  };
}
