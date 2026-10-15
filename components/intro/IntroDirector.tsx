"use client";

import dynamic from "next/dynamic";
import { useEffect, useSyncExternalStore } from "react";
import { ErrorBoundary } from "@/components/errors/ErrorBoundary";
import { preloadIntroScene } from "@/lib/intro/chooseIntroVariant";
import { finishIntro, getIntroRunId, hasIntroStarted, isIntroPlaying, subscribeToIntroChange } from "@/lib/intro/introLifecycle";

const IntroRuntime = dynamic(() => import("@/components/intro/runtime/IntroRuntime"), { ssr: false });

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
  const isPlaying = useSyncExternalStore(subscribeToIntroChange, isIntroPlaying, () => false);
  const shouldMountTimeline = useSyncExternalStore(subscribeToIntroChange, hasIntroStarted, () => false);
  // Each rewind mounts the runtime afresh, so its effect runs the intro again.
  const runId = useSyncExternalStore(subscribeToIntroChange, getIntroRunId, () => 0);

  useEffect(() => {
    if (!isPlaying) return;
    preloadIntroScene();
    return holdPageBehindIntro();
  }, [isPlaying]);

  if (!shouldMountTimeline) return null;
  // Any failure in the animation code ends the intro rather than trapping the page.
  return (
    <ErrorBoundary fallback={null} onError={finishIntro}>
      <IntroRuntime key={runId} />
    </ErrorBoundary>
  );
}
