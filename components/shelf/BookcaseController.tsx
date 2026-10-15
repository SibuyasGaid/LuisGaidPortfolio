"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { BookId } from "@/content/portfolio";
import { getRovingTargetIndex } from "@/lib/a11y/getRovingTargetIndex";
import { detectDeviceCapabilities } from "@/lib/device/detectDeviceCapabilities";
import { setBookPicker } from "@/lib/library/bookPicker";
import { REDUCED_MOTION_QUERY } from "@/lib/motion/config";

type BookTransit = typeof import("@/lib/shelf/runBookTransit");

const IDLE_FALLBACK_MS = 1200;

function isPlainClick(event: MouseEvent): boolean {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

/** Wholly on screen (and not put away behind the WebGL library). */
function isInView(element: Element): boolean {
  const bounds = element.getBoundingClientRect();
  return bounds.width > 0 && bounds.top >= 0 && bounds.bottom <= window.innerHeight;
}

function canAnimateTransit(): boolean {
  return !window.matchMedia(REDUCED_MOTION_QUERY).matches && !detectDeviceCapabilities().isLowEndDevice;
}

function whenIdle(callback: () => void): () => void {
  if (typeof window.requestIdleCallback === "function") {
    const handle = window.requestIdleCallback(callback);
    return () => window.cancelIdleCallback(handle);
  }
  const handle = window.setTimeout(callback, IDLE_FALLBACK_MS);
  return () => window.clearTimeout(handle);
}

// One tab stop for the six titled books, which sit far apart among untitled
// ones; the arrow keys, Home and End move between them in shelf order.
function enableRovingFocus(bookcase: HTMLElement, books: readonly HTMLAnchorElement[]): () => void {
  books.forEach((book, index) => {
    book.tabIndex = index === 0 ? 0 : -1;
  });

  function focusBook(targetIndex: number): void {
    books.forEach((book, index) => {
      book.tabIndex = index === targetIndex ? 0 : -1;
    });
    books[targetIndex]?.focus();
  }

  function moveFocus(event: KeyboardEvent): void {
    const index = books.findIndex((book) => book === event.target);
    if (index === -1) return;
    const targetIndex = getRovingTargetIndex(event.key, index, books.length);
    if (targetIndex === null) return;
    event.preventDefault();
    focusBook(targetIndex);
  }

  bookcase.addEventListener("keydown", moveFocus);
  return () => {
    bookcase.removeEventListener("keydown", moveFocus);
    for (const book of books) book.removeAttribute("tabindex");
  };
}

// The titled books are plain links inside static markup. This turns a click on
// one, or choosing its book in the navbar, into an in-app navigation, played
// as the book coming off the shelf when motion is welcome and the book is in
// view. Without JavaScript the links simply load their pages.
export function BookcaseController() {
  const router = useRouter();

  useEffect(() => {
    const bookcase = document.querySelector<HTMLElement>("[data-bookcase]");
    if (!bookcase) return;
    const books = Array.from(bookcase.querySelectorAll<HTMLAnchorElement>("a[data-shelf-book]"));
    const stopRovingFocus = enableRovingFocus(bookcase, books);

    let transit: BookTransit | null = null;
    let isTransitRunning = false;
    const cancelIdleWork = whenIdle(() => {
      for (const book of books) router.prefetch(book.pathname);
      if (canAnimateTransit()) {
        import("@/lib/shelf/runBookTransit").then((module) => {
          transit = module;
        }, () => {});
      }
    });

    // From the navbar, a book scrolled out of sight just opens: watching it
    // leave the shelf only makes sense where it can be seen.
    function takeBook(link: HTMLAnchorElement, isChosenFromNavbar: boolean): void {
      if (isTransitRunning) return;
      const navigate = () => router.push(link.pathname);
      if (!transit || !canAnimateTransit() || (isChosenFromNavbar && !isInView(link))) {
        navigate();
        return;
      }
      isTransitRunning = true;
      transit.runBookTransit({ link, navigate }).finally(() => {
        isTransitRunning = false;
      });
    }

    function openBook(event: MouseEvent): void {
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[data-shelf-book]") : null;
      if (!link || !isPlainClick(event)) return;
      event.preventDefault();
      takeBook(link, false);
    }

    const findBook = (bookId: BookId) => books.find((book) => book.dataset.book === bookId);
    const unregisterPicker = setBookPicker(
      {
        preview(bookId) {
          for (const book of books) book.classList.toggle("is-previewed", book.dataset.book === bookId);
        },
        pick(bookId, href) {
          const link = findBook(bookId);
          if (link) takeBook(link, true);
          else router.push(href);
        },
      },
      "flat",
    );

    bookcase.addEventListener("click", openBook);
    return () => {
      cancelIdleWork();
      stopRovingFocus();
      unregisterPicker();
      for (const book of books) book.classList.remove("is-previewed");
      bookcase.removeEventListener("click", openBook);
    };
  }, [router]);

  return null;
}
