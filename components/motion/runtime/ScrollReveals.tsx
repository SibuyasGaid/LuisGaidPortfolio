"use client";

import type { RefObject } from "react";
import { detectDeviceCapabilities } from "@/lib/device/detectDeviceCapabilities";
import { createScrollReveals } from "@/lib/motion/createScrollReveals";
import { useGSAP } from "@/lib/motion/gsap";

interface ScrollRevealsProps {
  readonly scopeRef: RefObject<HTMLDivElement | null>;
}

// Mounted per page. When Next hides a page it has navigated away from, this
// unmounts and useGSAP reverts every tween and ScrollTrigger it created.
export default function ScrollReveals({ scopeRef }: ScrollRevealsProps) {
  useGSAP((_context, contextSafe) => {
    if (!contextSafe) return;

    let removeReveals = () => {};
    // Setup waits one frame for two reasons. On a client navigation this
    // component mounts in the same commit as the page wrapper, and React runs
    // a child's layout effect before attaching its parent's ref. Next also
    // resets the scroll position later in that commit, and positions must be
    // measured from the top for content below the fold to be held back.
    const setupFrame = requestAnimationFrame(
      contextSafe(() => {
        const scope = scopeRef.current;
        if (!scope) return;
        removeReveals = createScrollReveals(scope, { ...detectDeviceCapabilities(), contextSafe });
      }),
    );
    return () => {
      cancelAnimationFrame(setupFrame);
      removeReveals();
    };
  });
  return null;
}
