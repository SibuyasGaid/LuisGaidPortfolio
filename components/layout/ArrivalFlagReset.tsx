"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect } from "react";
import { BOOK_ARRIVAL_ATTRIBUTE } from "@/lib/motion/config";

// A book taken off the shelf arrives already open, so the shelf marks <html>
// to hold that page's own cover back. Any later navigation clears the mark
// before paint, so other books still open their covers as usual.
export function ArrivalFlagReset() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    const root = document.documentElement;
    const arrivalPath = root.getAttribute(BOOK_ARRIVAL_ATTRIBUTE);
    if (arrivalPath && arrivalPath !== pathname) root.removeAttribute(BOOK_ARRIVAL_ATTRIBUTE);
  }, [pathname]);

  return null;
}
