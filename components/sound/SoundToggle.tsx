"use client";

import { useSyncExternalStore } from "react";
import { getSoundState, subscribeToSound, toggleSound, type SoundState } from "@/lib/sound/sound";

interface SoundToggleProps {
  readonly className: string;
  /** Shows the word "Sound" beside the bars; otherwise it is read out only. */
  readonly isLabelShown?: boolean;
}

const TITLES: Record<SoundState, string> = {
  playing: "Turn sound off",
  waiting: "Sound is on: it starts with your first click",
  off: "Turn sound on",
};

// Sound on or off. The bars dance while sound plays, stand still and glow
// softly while it is on but waiting for the visitor's first click (browsers
// play nothing before one), and lie flat while it is off. Without JavaScript
// there is no sound, so the CSS hides it.
export function SoundToggle({ className, isLabelShown = false }: SoundToggleProps) {
  // Sound is on unless a visitor turns it off, so the page is drawn that way before it knows.
  const state = useSyncExternalStore(subscribeToSound, getSoundState, () => "waiting" as const);
  return (
    <button
      type="button"
      data-sound-toggle
      data-sound-choice
      data-sound-state={state}
      aria-pressed={state !== "off"}
      title={TITLES[state]}
      onClick={toggleSound}
      className={className}
    >
      <span aria-hidden="true" className="sound-bars">
        <span />
        <span />
        <span />
        <span />
      </span>
      <span className={isLabelShown ? undefined : "sr-only"}>Sound</span>
    </button>
  );
}
