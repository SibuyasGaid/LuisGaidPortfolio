"use client";

import dynamic from "next/dynamic";
import { useEffect, useSyncExternalStore } from "react";
import { ErrorBoundary } from "@/components/errors/ErrorBoundary";
import { finishIntro, hasIntroStarted, isIntroPlaying, subscribeToIntroFinish } from "@/lib/intro/introLifecycle";

const IntroTimeline = dynamic(() => import("@/components/intro/runtime/IntroTimeline"), { ssr: false });

// While the intro plays, the page beneath it is inert: not focusable and not
// read out, so keyboard and screen reader users meet the Skip button first.
function holdPageBehindIntro(): () => void {
  const regions = Array.from(document.querySelectorAll<HTMLElement>("[data-inert-during-intro]"));
  for (const region of regions) region.inert = true;
  return () => {
    for (const region of regions) region.inert = false;
    if (document.activeElement?.closest("[data-intro-overlay]")) {
      document.getElementById("main")?.focus({ preventScroll: true });
    }
  };
}

export function IntroDirector() {
  const isPlaying = useSyncExternalStore(subscribeToIntroFinish, isIntroPlaying, () => false);
  const shouldMountTimeline = useSyncExternalStore(subscribeToIntroFinish, hasIntroStarted, () => false);

  useEffect(() => {
    if (!isPlaying) return;
    return holdPageBehindIntro();
  }, [isPlaying]);

  if (!shouldMountTimeline) return null;
  // Any failure in the animation code ends the intro rather than trapping the page.
  return (
    <ErrorBoundary fallback={null} onError={finishIntro}>
      <IntroTimeline />
    </ErrorBoundary>
  );
}
