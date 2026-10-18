"use client";

import { useEffect } from "react";
import type { IntroElements } from "@/lib/intro/createIntroTimeline";
import { queryIntroChrome } from "@/lib/intro/introChrome";
import { finishIntro, isIntroPlaying, isIntroRewind, subscribeToIntroFinish } from "@/lib/intro/introLifecycle";
import { runIntro } from "@/lib/intro/runIntro";

// On a first visit the boot script handles Skip and Escape; a rewind has to.
function listenForSkip(): () => void {
  function skipOnClick(event: MouseEvent): void {
    if (event.target instanceof Element && event.target.closest("[data-skip-intro]")) finishIntro();
  }
  function skipOnEscape(event: KeyboardEvent): void {
    if (event.key === "Escape") finishIntro();
  }
  document.addEventListener("click", skipOnClick);
  document.addEventListener("keydown", skipOnEscape);
  return () => {
    document.removeEventListener("click", skipOnClick);
    document.removeEventListener("keydown", skipOnEscape);
  };
}

function queryIntroElements(): IntroElements | null {
  const find = (selector: string) => document.querySelector<HTMLElement>(selector);
  const overlay = find("[data-intro-overlay]");
  const backdrop = find("[data-intro-backdrop]");
  const welcome = find("[data-intro-welcome]");
  const progressBar = find("[data-intro-progress]");
  const progressFill = find("[data-intro-progress-fill]");
  const status = find("[data-intro-status]");
  const controls = find("[data-intro-controls]");
  const enter = find("[data-intro-enter]");
  const enterSilently = find("[data-intro-enter-silently]");
  const skip = find("[data-skip-intro]");
  const poster = find("[data-shelf-poster]");
  if (!overlay || !backdrop || !welcome || !progressBar || !progressFill || !status || !controls || !enter || !enterSilently || !skip || !poster) {
    return null;
  }
  return { overlay, backdrop, welcome, progressBar, progressFill, status, controls, enter, enterSilently, skip, poster, chrome: queryIntroChrome() };
}

// Loaded on a first visit once the page itself has hydrated, and again for
// each rewind from the landing page.
export default function IntroRuntime() {
  useEffect(() => {
    if (!isIntroPlaying()) return;
    const elements = queryIntroElements();
    if (!elements) {
      finishIntro();
      return;
    }
    const isRewind = isIntroRewind();
    const intro = runIntro(elements, { isRewind });
    const unsubscribe = subscribeToIntroFinish(intro.stop);
    const stopListening = isRewind ? listenForSkip() : () => {};
    // The rewind button is now behind the overlay; the keyboard carries on at Skip.
    if (isRewind) elements.skip.focus({ preventScroll: true });
    return () => {
      unsubscribe();
      stopListening();
      intro.stop();
    };
  }, []);
  return null;
}
