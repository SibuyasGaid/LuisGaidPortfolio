"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { BookId } from "@/content/portfolio";
import { getRovingTargetIndex } from "@/lib/a11y/getRovingTargetIndex";
import { getBookPicker } from "@/lib/library/bookPicker";

function isPlainClick(event: MouseEvent): boolean {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

// The links over the titled books: one tab stop for all six (the arrow keys,
// Home and End move between them), naming a book shows where it stands, and
// choosing one takes it off the shelf. Without JavaScript they simply link.
export function ShelfHotspotsController() {
  const router = useRouter();

  useEffect(() => {
    const frame = document.querySelector<HTMLElement>("[data-shelf-hotspots]");
    if (!frame) return;
    const hotspots = Array.from(frame.querySelectorAll<HTMLAnchorElement>("a[data-shelf-book]"));
    const bookOf = (element: EventTarget | null) =>
      element instanceof Element ? (element.closest<HTMLAnchorElement>("a[data-shelf-book]") ?? null) : null;
    hotspots.forEach((hotspot, index) => {
      hotspot.tabIndex = index === 0 ? 0 : -1;
    });

    function moveFocus(event: KeyboardEvent): void {
      const index = hotspots.findIndex((hotspot) => hotspot === event.target);
      if (index === -1) return;
      const targetIndex = getRovingTargetIndex(event.key, index, hotspots.length);
      if (targetIndex === null) return;
      event.preventDefault();
      hotspots.forEach((hotspot, hotspotIndex) => {
        hotspot.tabIndex = hotspotIndex === targetIndex ? 0 : -1;
      });
      hotspots[targetIndex]?.focus();
    }

    function preview(event: Event): void {
      const hotspot = bookOf(event.target);
      const isLeaving = event.type === "pointerout" || event.type === "focusout";
      getBookPicker()?.preview(hotspot && !isLeaving ? (hotspot.dataset.shelfBook as BookId) : null);
    }

    function choose(event: MouseEvent): void {
      const hotspot = bookOf(event.target);
      if (!hotspot || !isPlainClick(event)) return;
      event.preventDefault();
      const move = { bookId: hotspot.dataset.shelfBook as BookId, href: hotspot.pathname };
      if (!getBookPicker()?.move(move)) router.push(move.href);
    }

    frame.addEventListener("keydown", moveFocus);
    frame.addEventListener("pointerover", preview);
    frame.addEventListener("pointerout", preview);
    frame.addEventListener("focusin", preview);
    frame.addEventListener("focusout", preview);
    frame.addEventListener("click", choose);
    return () => {
      frame.removeEventListener("keydown", moveFocus);
      frame.removeEventListener("pointerover", preview);
      frame.removeEventListener("pointerout", preview);
      frame.removeEventListener("focusin", preview);
      frame.removeEventListener("focusout", preview);
      frame.removeEventListener("click", choose);
      for (const hotspot of hotspots) hotspot.removeAttribute("tabindex");
    };
  }, [router]);

  return null;
}
