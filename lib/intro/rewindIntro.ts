import { queryIntroChrome } from "@/lib/intro/introChrome";
import { isIntroPlaying, startIntroRewind, subscribeToIntroFinish } from "@/lib/intro/introLifecycle";
import { getLoadedLibrary, takeWalkSeen } from "@/lib/library/libraryStage";
import { TAKING_ATTRIBUTE, TRANSIT_ATTRIBUTE } from "@/lib/library/shelfAttributes";
import { INTRO_REWIND } from "@/lib/motion/config";
import { gsap } from "@/lib/motion/gsap";

// The landing page's Rewind button. The navbar, heading and links fade away,
// the shelf's camera hands over to the intro, and the intro plays again from
// the door (see runIntro's rewind). When it ends or is skipped, the shelf
// takes the camera back, gliding from wherever the walk was left.
export function rewindIntro(): void {
  const root = document.documentElement;
  if (isIntroPlaying() || root.hasAttribute(TAKING_ATTRIBUTE) || root.hasAttribute(TRANSIT_ATTRIBUTE)) return;
  gsap.to(queryIntroChrome(), {
    opacity: 0,
    duration: INTRO_REWIND.chromeOut,
    ease: "power1.out",
    onComplete: () => {
      // The overlay shows the moment the intro is playing; its card and backdrop start unseen, for the rewind to bring back.
      gsap.set(document.querySelectorAll("[data-intro-welcome], [data-intro-backdrop]"), { opacity: 0 });
      gsap.set(document.querySelector("[data-skip-intro]"), { clearProps: "opacity" });
      getLoadedLibrary()?.view.stop();
      const unsubscribe = subscribeToIntroFinish(() => {
        unsubscribe();
        const library = getLoadedLibrary();
        if (!library) return;
        library.view.reset();
        library.view.start({ glide: takeWalkSeen() });
      });
      startIntroRewind();
    },
  });
}
