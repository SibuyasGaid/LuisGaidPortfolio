import { BOOKS, LIBRARY, type BookId } from "@/content/portfolio";
import type { BookPicker } from "@/lib/library/bookPicker";
import type { Library } from "@/lib/library/libraryStage";
import { AT_LIBRARY_ATTRIBUTE, LEAVING_ATTRIBUTE, TAKING_ATTRIBUTE, TRANSIT_ATTRIBUTE } from "@/lib/library/shelfAttributes";
import { BOOK_ARRIVAL_ATTRIBUTE, BOOK_TRANSIT_ROUTE_TIMEOUT_MS, SHELF_SCENE_FADE_SECONDS } from "@/lib/motion/config";
import { waitForPathname } from "@/lib/navigation/waitForPathname";

// The navbar's way into the WebGL library. Naming a book slides it forward
// and names it under the shelf; choosing one takes it off the shelf in the
// scene, loads its page underneath as the cover opens, then lets the library
// fade away to the page. Escape or a click hurries it along.

function describeBook(bookId: BookId | null): string {
  const book = BOOKS.find((candidate) => candidate.id === bookId);
  return book ? `Volume ${book.numeral} · ${book.title}` : LIBRARY.sceneInstruction;
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export function createScenePicker(library: Library, navigate: (href: string) => void): BookPicker {
  const root = document.documentElement;
  let isTaking = false;

  function showCaption(bookId: BookId | null): void {
    const caption = document.querySelector<HTMLElement>("[data-scene-caption]");
    if (caption) caption.textContent = describeBook(bookId);
  }

  async function take(bookId: BookId, href: string): Promise<void> {
    isTaking = true;
    showCaption(bookId);
    root.setAttribute(TAKING_ATTRIBUTE, "");
    const hurry = () => library.view.hurry();
    const hurryOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") hurry();
    };
    document.addEventListener("keydown", hurryOnEscape);
    // After the click that chose the book has finished, or it would count.
    const listenForClicks = window.setTimeout(() => document.addEventListener("click", hurry), 0);

    await library.view.take(bookId, () => {
      root.setAttribute(TRANSIT_ATTRIBUTE, "");
      root.setAttribute(BOOK_ARRIVAL_ATTRIBUTE, href);
      navigate(href);
    });
    await waitForPathname(href, BOOK_TRANSIT_ROUTE_TIMEOUT_MS);
    root.setAttribute(LEAVING_ATTRIBUTE, "");
    await wait(SHELF_SCENE_FADE_SECONDS.out * 1000);

    window.clearTimeout(listenForClicks);
    document.removeEventListener("keydown", hurryOnEscape);
    document.removeEventListener("click", hurry);
    root.removeAttribute(TAKING_ATTRIBUTE);
    root.removeAttribute(TRANSIT_ATTRIBUTE);
    root.removeAttribute(LEAVING_ATTRIBUTE);
    library.view.reset();
    showCaption(null);
    if (!root.hasAttribute(AT_LIBRARY_ATTRIBUTE)) library.view.stop();
    // Reading carries on at the book rather than nowhere.
    if (!document.activeElement || document.activeElement === document.body) {
      document.getElementById("main")?.focus({ preventScroll: true });
    }
    isTaking = false;
  }

  return {
    preview(bookId) {
      if (isTaking) return;
      library.view.preview(bookId);
      showCaption(bookId);
    },
    pick(bookId, href) {
      if (isTaking) return;
      void take(bookId, href);
    },
  };
}
