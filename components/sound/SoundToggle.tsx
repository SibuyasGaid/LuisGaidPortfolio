"use client";

import { useSyncExternalStore } from "react";
import { isSoundAudible, subscribeToSound, toggleSound } from "@/lib/sound/sound";

interface SoundToggleProps {
  readonly className: string;
  /** Shows the word "Sound" beside the bars; otherwise it is read out only. */
  readonly isLabelShown?: boolean;
}

// Sound on or off. The bars dance while sound is playing and lie flat while
// it is off, or still waiting for the visitor's first click. Without
// JavaScript there is no sound, so the CSS hides it.
export function SoundToggle({ className, isLabelShown = false }: SoundToggleProps) {
  const isAudible = useSyncExternalStore(subscribeToSound, isSoundAudible, () => false);
  return (
    <button
      type="button"
      data-sound-toggle
      aria-pressed={isAudible}
      title={isAudible ? "Turn sound off" : "Turn sound on"}
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
