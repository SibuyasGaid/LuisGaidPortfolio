"use client";

import { INTRO } from "@/content/portfolio";

// The rewind and the intro's runtime, which a returning reader has not loaded
// yet: fetched as the button is pointed at or focused, so the press is instant.
function loadRewind() {
  return Promise.all([import("@/lib/intro/rewindIntro"), import("@/components/intro/runtime/IntroRuntime")]);
}

// Plays the intro again. Without JavaScript there is no intro, so the CSS hides it.
export function RewindIntroButton() {
  return (
    <button
      type="button"
      className="rewind-intro"
      onPointerEnter={() => void loadRewind()}
      onFocus={() => void loadRewind()}
      onClick={() => void loadRewind().then(([rewind]) => rewind.rewindIntro())}
    >
      <svg aria-hidden="true" viewBox="0 0 20 20" className="rewind-intro-icon">
        <path d="M9.5 5.5 3.5 10l6 4.5zM16.5 5.5l-6 4.5 6 4.5z" fill="currentColor" />
      </svg>
      {INTRO.rewind}
    </button>
  );
}
