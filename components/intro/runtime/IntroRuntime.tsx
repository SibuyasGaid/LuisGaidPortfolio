"use client";

import { useEffect } from "react";
import type { IntroElements } from "@/lib/intro/createIntroTimeline";
import { finishIntro, isIntroPlaying, subscribeToIntroFinish } from "@/lib/intro/introLifecycle";
import { runIntro } from "@/lib/intro/runIntro";

const CHROME_SELECTORS = ["[data-masthead]", ".library-scene-shade", ".library-hero", "[data-scene-caption]", ".shelf-hotspots", "[data-colophon]"] as const;

function queryIntroElements(): IntroElements | null {
  const find = (selector: string) => document.querySelector<HTMLElement>(selector);
  const overlay = find("[data-intro-overlay]");
  const backdrop = find("[data-intro-backdrop]");
  const welcome = find("[data-intro-welcome]");
  const progressBar = find("[data-intro-progress]");
  const progressFill = find("[data-intro-progress-fill]");
  const status = find("[data-intro-status]");
  const skip = find("[data-skip-intro]");
  const poster = find("[data-shelf-poster]");
  if (!overlay || !backdrop || !welcome || !progressBar || !progressFill || !status || !skip || !poster) return null;
  const chrome = CHROME_SELECTORS.map(find).filter((element) => element !== null);
  return { overlay, backdrop, welcome, progressBar, progressFill, status, skip, poster, chrome };
}

// Loaded only on a first visit, once the page itself has hydrated.
export default function IntroRuntime() {
  useEffect(() => {
    if (!isIntroPlaying()) return;
    const elements = queryIntroElements();
    if (!elements) {
      finishIntro();
      return;
    }
    const intro = runIntro(elements);
    const unsubscribe = subscribeToIntroFinish(intro.stop);
    return () => {
      unsubscribe();
      intro.stop();
    };
  }, []);
  return null;
}
