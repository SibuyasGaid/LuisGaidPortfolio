import { IntroDirector } from "@/components/intro/IntroDirector";
import { Monogram } from "@/components/ornaments/Monogram";
import { SoundToggle } from "@/components/sound/SoundToggle";
import { INTRO, PROFILE } from "@/content/portfolio";

// The first visit's opening. The welcome screen is server-rendered, so it is
// the first thing painted, and it holds while the WebGL library loads behind
// it (in the layout, under this overlay); then the backdrop lifts and the
// camera walks through the library to the grand bookcase, where the home page
// is. The inline boot script decides before the first paint whether any of
// this shows; without JavaScript it never does.
export function LibraryIntro() {
  return (
    <div className="library-intro" data-intro-overlay data-lenis-prevent role="region" aria-label="Welcome">
      <div className="intro-backdrop" data-intro-backdrop />
      <div className="intro-welcome" data-intro-welcome>
        <Monogram className="intro-welcome-mark" />
        <p className="intro-welcome-eyebrow eyebrow">{INTRO.welcome}</p>
        <p className="intro-welcome-name">{PROFILE.fullName}</p>
        <p className="intro-welcome-headline">{PROFILE.headline}</p>
        <div
          className="intro-progress"
          data-intro-progress
          role="progressbar"
          aria-label={INTRO.progressLabel}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <span className="intro-progress-fill" data-intro-progress-fill />
        </div>
        <p className="intro-welcome-status" data-intro-status aria-live="polite">
          {INTRO.statuses.opening}
        </p>
      </div>
      <div className="intro-controls" data-intro-controls>
        {/* The page behind is out of reach while the intro plays, so sound can be turned on here too. */}
        <SoundToggle className="intro-sound" isLabelShown />
        <button type="button" data-skip-intro className="intro-skip">
          {INTRO.skip}
          <kbd className="intro-skip-key">Esc</kbd>
        </button>
      </div>
      <IntroDirector />
    </div>
  );
}
