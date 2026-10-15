import { gsap } from "@/lib/motion/gsap";

export interface WelcomeProgress {
  /** Moves the bar to a stage, optionally creeping on toward a cap while the next stage loads. */
  advance(share: number, status: string, creepTo?: number): void;
}

const STEP_SECONDS = 0.45;
const CREEP_SECONDS = 7;

// Drives the welcome screen's progress bar. Until this runs the bar shows a
// gentle waiting shimmer from the CSS; from here it reports real stages.
export function createWelcomeProgress(bar: HTMLElement, fill: HTMLElement, status: HTMLElement): WelcomeProgress {
  const progress = { share: 0 };
  let creep: gsap.core.Tween | null = null;
  bar.setAttribute("data-progress-active", "");

  function draw(): void {
    fill.style.transform = `scaleX(${progress.share})`;
    bar.setAttribute("aria-valuenow", String(Math.round(progress.share * 100)));
  }

  return {
    advance(share, label, creepTo) {
      creep?.kill();
      if (status.textContent !== label) status.textContent = label;
      const target = Math.max(progress.share, share);
      gsap.to(progress, { share: target, duration: STEP_SECONDS, ease: "power2.out", onUpdate: draw, overwrite: true });
      if (creepTo !== undefined && creepTo > target) {
        creep = gsap.to(progress, { share: creepTo, duration: CREEP_SECONDS, delay: STEP_SECONDS, ease: "power1.out", onUpdate: draw });
      }
    },
  };
}
