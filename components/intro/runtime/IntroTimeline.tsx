"use client";

import { detectDeviceCapabilities } from "@/lib/device/detectDeviceCapabilities";
import {
  createDustDrift,
  createIntroTimeline,
  type IntroElements,
  type IntroVariant,
} from "@/lib/intro/createIntroTimeline";
import { finishIntro, isIntroPlaying, markIntroRunning, subscribeToIntroFinish } from "@/lib/intro/introLifecycle";
import { REDUCED_MOTION_QUERY } from "@/lib/motion/config";
import { gsap, useGSAP } from "@/lib/motion/gsap";

function queryElement(selector: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(selector);
}

function queryIntroElements(): IntroElements | null {
  const elements = {
    overlay: queryElement("[data-intro-overlay]"),
    scene: queryElement("[data-intro-scene]"),
    camera: queryElement("[data-intro-camera]"),
    wall: queryElement("[data-intro-wall]"),
    shelf: queryElement("[data-intro-shelf]"),
    foreground: queryElement("[data-intro-foreground]"),
    glow: queryElement("[data-intro-glow]"),
    dim: queryElement("[data-intro-dim]"),
    heroSpine: queryElement("[data-intro-hero-spine]"),
    volume: queryElement("[data-intro-volume]"),
    cover: queryElement("[data-intro-cover]"),
    realBook: queryElement("[data-intro-target] .book"),
  };
  const isComplete = Object.values(elements).every((element) => element !== null);
  return isComplete ? (elements as IntroElements) : null;
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
    const dust = variant === "full" ? createDustDrift(gsap.utils.toArray<HTMLElement>("[data-intro-mote]")) : [];

    // Skipping or finishing freezes the scene where it is; the overlay then
    // fades out over it, and the page's own unmount reverts everything later.
    const stopIntro = contextSafe(() => {
      timeline.kill();
      for (const tween of dust) tween.kill();
      gsap.set([elements.camera, elements.shelf, elements.wall, elements.foreground, elements.heroSpine, elements.volume, elements.cover], {
        willChange: "auto",
      });
    });
    return subscribeToIntroFinish(stopIntro);
  });
  return null;
}
