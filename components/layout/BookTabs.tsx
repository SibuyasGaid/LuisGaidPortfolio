"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { BOOKS } from "@/content/portfolio";
import { getBookHref } from "@/lib/books";
import { REDUCED_MOTION_QUERY } from "@/lib/motion/config";

function subscribeToNothing(): () => void {
  return () => {};
}

// False on the server and during hydration, true afterwards. Until then every
// tab stays in the Tab order, so the bar works without JavaScript.
function useIsHydrated(): boolean {
  return useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
}

function getTargetIndex(key: string, currentIndex: number, count: number): number | null {
  if (key === "ArrowRight") return (currentIndex + 1) % count;
  if (key === "ArrowLeft") return (currentIndex - 1 + count) % count;
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  return null;
}

// Centres the open book's tab when the bar is too narrow to show every tab.
function scrollTabIntoView(list: HTMLElement, tab: HTMLElement): void {
  if (list.scrollWidth <= list.clientWidth) return;
  const isReducedMotion = window.matchMedia(REDUCED_MOTION_QUERY).matches;
  list.scrollTo({
    left: tab.offsetLeft - (list.clientWidth - tab.offsetWidth) / 2,
    behavior: isReducedMotion ? "auto" : "smooth",
  });
}

// The sticky bar for moving between books. One tab is in the Tab order at a
// time (the open book's, by default) and the arrow keys move between the rest.
export function BookTabs() {
  const pathname = usePathname();
  const isHydrated = useIsHydrated();
  const activeIndex = BOOKS.findIndex((book) => getBookHref(book.id) === pathname);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [trackedPathname, setTrackedPathname] = useState(pathname);
  const listRef = useRef<HTMLUListElement>(null);
  const tabRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  // A new page hands the roving tab stop back to the open book.
  if (trackedPathname !== pathname) {
    setTrackedPathname(pathname);
    setFocusedIndex(null);
  }

  const rovingIndex = focusedIndex ?? Math.max(activeIndex, 0);

  useEffect(() => {
    const list = listRef.current;
    const tab = tabRefs.current[activeIndex];
    if (list && tab) scrollTabIntoView(list, tab);
  }, [activeIndex]);

  function moveFocus(event: KeyboardEvent<HTMLAnchorElement>, index: number): void {
    const targetIndex = getTargetIndex(event.key, index, BOOKS.length);
    if (targetIndex === null) return;
    event.preventDefault();
    setFocusedIndex(targetIndex);
    tabRefs.current[targetIndex]?.focus();
  }

  return (
    <nav aria-label="Books" className="min-w-0 flex-1">
      <ul ref={listRef} className="book-tabs">
        {BOOKS.map((book, index) => (
          <li key={book.id} className="shrink-0">
            <Link
              ref={(element) => {
                tabRefs.current[index] = element;
              }}
              href={getBookHref(book.id)}
              data-book={book.id}
              aria-current={index === activeIndex ? "page" : undefined}
              tabIndex={isHydrated ? (index === rovingIndex ? 0 : -1) : undefined}
              onKeyDown={(event) => moveFocus(event, index)}
              onFocus={() => setFocusedIndex(index)}
              className="book-tab"
            >
              <span aria-hidden="true" className="book-tab-swatch" />
              {book.title}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
