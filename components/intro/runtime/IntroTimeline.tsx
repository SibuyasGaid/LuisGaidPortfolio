"use client";

import { detectDeviceCapabilities } from "@/lib/device/detectDeviceCapabilities";
import {
  createDustDrift,
  createIntroTimeline,
  releaseIntroElements,
  type IntroElements,
  type IntroVariant,
} from "@/lib/intro/createIntroTimeline";
import { finishIntro, isIntroPlaying, markIntroRunning, subscribeToIntroFinish } from "@/lib/intro/introLifecycle";
import { INTRO_DUST_START_DELAY_SECONDS, REDUCED_MOTION_QUERY } from "@/lib/motion/config";
import { gsap, useGSAP } from "@/lib/motion/gsap";

function queryIntroElements(): IntroElements | null {
  const scene = document.querySelector<HTMLElement>("[data-intro-scene]");
  const camera = document.querySelector<HTMLElement>("[data-intro-camera]");
  const world = document.querySelector<HTMLElement>("[data-intro-world]");
  const stage = document.querySelector<HTMLElement>("[data-shelf-stage]");
  if (!scene || !camera || !world || !stage) return null;
  const segments = gsap.utils.toArray<HTMLElement>("[data-intro-segment]");
  return { scene, camera, world, segments, stage };
}

function chooseIntroVariant(): IntroVariant {
  if (window.matchMedia(REDUCED_MOTION_QUERY).matches) return "crossfade";
  return detectDeviceCapabilities().isLowEndDevice ? "brief" : "full";
}

export default function IntroTimeline() {
  useGSAP((_context, contextSafe) => {
    if (!contextSafe || !isIntroPlaying()) return;
    const elements = queryIntroElements();
    if (!elements) {
      finishIntro();
      return;
    }

    markIntroRunning();
    const variant = chooseIntroVariant();
    const timeline = createIntroTimeline(elements, variant);
    // The dust starts a moment later, keeping it out of the task that builds the timeline.
    let dust: gsap.core.Tween[] = [];
    const startDust = gsap.delayedCall(
      INTRO_DUST_START_DELAY_SECONDS,
      contextSafe(() => {
        if (variant === "full") dust = createDustDrift(gsap.utils.toArray<HTMLElement>("[data-intro-mote]"));
      }),
    );

    // Skipping or finishing freezes the scene where it is while the overlay
    // fades out over it, and hands the shelf straight back to the CSS.
    const stopIntro = contextSafe(() => {
      timeline.kill();
      startDust.kill();
      for (const tween of dust) tween.kill();
      releaseIntroElements(elements);
    });
    return subscribeToIntroFinish(stopIntro);
  });
  return null;
}
