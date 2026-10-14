import {
  DESKTOP_MEDIA_QUERY,
  LOW_END_REVEAL_ANIMATION,
  PARALLAX_SCRUB_SECONDS,
  READING_PROGRESS_SCRUB_SECONDS,
  REVEAL_ANIMATIONS,
  REVEAL_STAGGER_SECONDS,
  REVEAL_START,
  SCROLL_LINE_SCRUB_SECONDS,
  type RevealVariant,
} from "@/lib/motion/config";
import { gsap, ScrollTrigger } from "@/lib/motion/gsap";

/** Wraps callbacks that run later (like ScrollTrigger callbacks) so their tweens are still reverted with the page. */
type ContextSafe = <Callback extends (...args: never[]) => unknown>(callback: Callback) => Callback;

interface ScrollRevealOptions {
  readonly isLowEndDevice: boolean;
  readonly contextSafe: ContextSafe;
}

// Anything already on screen when the page sets up is left alone. Hiding it
// would flash content the visitor can already see, and would delay the
// largest paint. Only content still below the fold waits for its entrance.
function isBelowViewport(element: Element): boolean {
  return element.getBoundingClientRect().top > window.innerHeight;
}

function isRevealVariant(value: string | undefined): value is RevealVariant {
  return value !== undefined && value in REVEAL_ANIMATIONS;
}

function groupByVariant(elements: readonly HTMLElement[]): Map<RevealVariant, HTMLElement[]> {
  const groups = new Map<RevealVariant, HTMLElement[]>();
  for (const element of elements) {
    const variant = isRevealVariant(element.dataset.reveal) ? element.dataset.reveal : "rise";
    groups.set(variant, [...(groups.get(variant) ?? []), element]);
  }
  return groups;
}

function revealOnEnter(scope: HTMLElement, { isLowEndDevice, contextSafe }: ScrollRevealOptions): void {
  const pendingElements = gsap.utils.toArray<HTMLElement>("[data-reveal]", scope).filter(isBelowViewport);

  for (const [variant, elements] of groupByVariant(pendingElements)) {
    const animation = isLowEndDevice ? LOW_END_REVEAL_ANIMATION : REVEAL_ANIMATIONS[variant];
    gsap.set(elements, animation.from);
    ScrollTrigger.batch(elements, {
      start: REVEAL_START,
      once: true,
      onEnter: contextSafe((batch: Element[]) => {
        // clearProps hands styling back to CSS and drops the compositing layer once settled.
        gsap.to(batch, { ...animation.to, stagger: REVEAL_STAGGER_SECONDS, clearProps: "opacity,transform" });
      }),
    });
  }
}

function drawScrollLines(scope: HTMLElement): void {
  const lines = gsap.utils.toArray<HTMLElement>("[data-scroll-line]", scope).filter(isBelowViewport);
  for (const line of lines) {
    gsap.fromTo(
      line,
      { scaleY: 0 },
      {
        scaleY: 1,
        ease: "none",
        scrollTrigger: { trigger: line, start: "top 85%", end: "bottom 60%", scrub: SCROLL_LINE_SCRUB_SECONDS },
      },
    );
  }
}

function trackReadingProgress(scope: HTMLElement): void {
  const progressBar = document.querySelector<HTMLElement>("[data-reading-progress]");
  if (!progressBar) return;
  gsap.fromTo(
    progressBar,
    { scaleX: 0 },
    {
      scaleX: 1,
      ease: "none",
      scrollTrigger: { trigger: scope, start: 0, end: "bottom bottom", scrub: READING_PROGRESS_SCRUB_SECONDS },
    },
  );
}

// The watermark numerals drift slower than the page on the two-page spread.
// Returns a cleanup because matchMedia sets up and tears down by itself.
function driftWatermarks(scope: HTMLElement): () => void {
  const media = gsap.matchMedia();
  media.add(DESKTOP_MEDIA_QUERY, () => {
    for (const watermark of gsap.utils.toArray<HTMLElement>("[data-parallax]", scope)) {
      const speed = Number(watermark.dataset.parallax) || 0;
      gsap.to(watermark, {
        y: () => speed * window.innerHeight,
        ease: "none",
        scrollTrigger: {
          trigger: scope,
          start: "top top",
          end: "bottom bottom",
          scrub: PARALLAX_SCRUB_SECONDS,
          invalidateOnRefresh: true,
        },
      });
    }
  });
  return () => media.revert();
}

export function createScrollReveals(scope: HTMLElement, options: ScrollRevealOptions): () => void {
  revealOnEnter(scope, options);
  drawScrollLines(scope);
  trackReadingProgress(scope);
  if (options.isLowEndDevice) return () => {};
  return driftWatermarks(scope);
}
