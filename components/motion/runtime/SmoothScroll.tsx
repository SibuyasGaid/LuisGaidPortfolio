"use client";

import Lenis from "lenis";
import { useEffect } from "react";
import { detectDeviceCapabilities } from "@/lib/device/detectDeviceCapabilities";
import { ANCHOR_SCROLL_OFFSET_PX, SMOOTH_SCROLL_LERP, SMOOTH_SCROLL_WHEEL_MULTIPLIER } from "@/lib/motion/config";
import { gsap, ScrollTrigger } from "@/lib/motion/gsap";

const DEFAULT_LAG_THRESHOLD_MS = 500;
const DEFAULT_LAG_ADJUSTED_MS = 33;

function startSmoothScrolling(): () => void {
  const lenis = new Lenis({
    lerp: SMOOTH_SCROLL_LERP,
    wheelMultiplier: SMOOTH_SCROLL_WHEEL_MULTIPLIER,
    anchors: { offset: ANCHOR_SCROLL_OFFSET_PX },
    stopInertiaOnNavigate: true,
  });
  // Lenis and ScrollTrigger share GSAP's ticker so they never read scroll positions a frame apart.
  const advanceLenis = (timeSeconds: number) => lenis.raf(timeSeconds * 1000);
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add(advanceLenis);
  gsap.ticker.lagSmoothing(0);

  return () => {
    gsap.ticker.remove(advanceLenis);
    gsap.ticker.lagSmoothing(DEFAULT_LAG_THRESHOLD_MS, DEFAULT_LAG_ADJUSTED_MS);
    lenis.destroy();
  };
}

function pauseMotionWhileHidden(): () => void {
  function syncWithVisibility(): void {
    if (document.hidden) gsap.globalTimeline.pause();
    else gsap.globalTimeline.resume();
  }
  document.addEventListener("visibilitychange", syncWithVisibility);
  return () => document.removeEventListener("visibilitychange", syncWithVisibility);
}

// Web fonts change line heights after they swap in, which moves every trigger.
function refreshTriggersAfterFontsLoad(): void {
  void document.fonts.ready.then(() => ScrollTrigger.refresh());
}

export default function SmoothScroll() {
  useEffect(() => {
    refreshTriggersAfterFontsLoad();
    const stopPausingWhileHidden = pauseMotionWhileHidden();
    if (detectDeviceCapabilities().isLowEndDevice) return stopPausingWhileHidden;

    const stopSmoothScrolling = startSmoothScrolling();
    return () => {
      stopSmoothScrolling();
      stopPausingWhileHidden();
    };
  }, []);

  return null;
}
