"use client";

import { useLayoutEffect } from "react";

// In development, React's Strict Mode remount resets <html> to the attributes
// it renders itself, dropping the intro state the boot script set. This puts
// it back before paint. In production it simply re-applies the same value.
export function IntroStateKeeper() {
  useLayoutEffect(() => {
    const state = window.__libraryIntroState;
    if (state) document.documentElement.setAttribute("data-intro", state);
  }, []);
  return null;
}
