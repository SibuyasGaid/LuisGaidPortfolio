import { INTRO_PROMPT_ATTRIBUTE } from "@/lib/intro/introLifecycle";
import { prepareSound, turnSoundOff } from "@/lib/sound/sound";

export interface EntryPrompt {
  cancel(): void;
}

interface EntryButtons {
  /** Enter the library, with sound unless it has been turned off. */
  readonly enter: HTMLElement;
  readonly enterSilently: HTMLElement;
}

/**
 * Once the library is ready and the welcome has had its moment, the card
 * offers the way in and the intro waits for the visitor to take it. Their
 * click is what lets sound play (browsers allow none before one), so the
 * door, the footsteps and the music come with the walk. "Enter without
 * sound" turns sound off first. onEnter starts the rest of the intro.
 */
export function promptEntry(buttons: EntryButtons, delaySeconds: number, onEnter: () => void): EntryPrompt {
  const root = document.documentElement;
  let hasEntered = false;

  const show = window.setTimeout(() => {
    root.setAttribute(INTRO_PROMPT_ATTRIBUTE, "open");
    prepareSound();
    buttons.enter.focus({ preventScroll: true });
  }, delaySeconds * 1000);

  function enter(isSilent: boolean): void {
    if (hasEntered) return;
    hasEntered = true;
    if (isSilent) turnSoundOff();
    root.setAttribute(INTRO_PROMPT_ATTRIBUTE, "entered");
    onEnter();
  }
  // The click itself wakes the sound (lib/sound/sound.ts listens for it).
  const enterWithSound = () => enter(false);
  const enterSilently = () => enter(true);
  buttons.enter.addEventListener("click", enterWithSound);
  buttons.enterSilently.addEventListener("click", enterSilently);

  return {
    cancel() {
      window.clearTimeout(show);
      buttons.enter.removeEventListener("click", enterWithSound);
      buttons.enterSilently.removeEventListener("click", enterSilently);
    },
  };
}
