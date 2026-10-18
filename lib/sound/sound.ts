import type { SoundEngine } from "@/lib/sound/engine";
import type { CueOptions, SoundCue } from "@/lib/sound/soundCues";
import { reportError } from "@/lib/reportError";

// The library's sound: what the visitor chose, and the audio itself. Browsers
// let a page make sound only after the visitor has clicked or pressed a key,
// so with sound on the audio wakes at their first click; the music fades in
// from there. Everything that makes sound (the code below and the engine it
// loads) stays off the page until then, apart from this small module.

type SoundPreference = "on" | "off";

/**
 * playing: on, and audible.
 * waiting: on, and waiting for the visitor's first click or key press (browsers allow no sound before one).
 * off: turned off.
 */
export type SoundState = "playing" | "waiting" | "off";

const STORAGE_KEY = "library:sound";
/** Sound plays from the visitor's first click unless they have turned it off. */
const IS_SOUND_ON_BY_DEFAULT = true;
/** A cue asked for while the audio was still waking plays late, if it is no older than this. */
const QUEUED_CUE_MAX_AGE_MS = 400;
/** The same cue again within this long (a move hurried to its end) plays once. */
const REPEAT_GAP_MS = 90;
/** Turned off, the audio is suspended once its fade out has finished. */
const SUSPEND_AFTER_FADE_MS = 700;
/** The engine loads this long after the page, ready for the first click, unless a click comes first. */
const PRELOAD_DELAY_MS = 4000;
/** Events that count as the visitor's own action, the only ones that can start audio. */
const GESTURES = ["pointerdown", "pointerup", "keydown", "touchend"] as const;
/** Pressing one of these makes a small tap. */
const CONTROLS = "a[href], button, summary, [role='button'], input[type='submit']";

interface QueuedCue {
  readonly cue: SoundCue;
  readonly options: CueOptions | undefined;
  readonly askedAt: number;
}

let preference: SoundPreference | null = null;
let context: AudioContext | null = null;
let engine: SoundEngine | null = null;
let engineModule: Promise<typeof import("@/lib/sound/engine")> | null = null;
let isWaitingForGesture = false;
let suspendTimer = 0;
const queuedCues: QueuedCue[] = [];
const lastPlayedAt = new Map<SoundCue, number>();
const listeners = new Set<() => void>();

function readPreference(): SoundPreference {
  if (preference) return preference;
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage blocked: the default stands for this visit.
  }
  preference = stored === "on" || stored === "off" ? stored : IS_SOUND_ON_BY_DEFAULT ? "on" : "off";
  return preference;
}

function savePreference(next: SoundPreference): void {
  preference = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Remembered for this visit only.
  }
}

function notifyListeners(): void {
  for (const listener of listeners) listener();
}

function isRunning(): boolean {
  return context?.state === "running";
}

function loadEngineModule(): Promise<typeof import("@/lib/sound/engine")> {
  engineModule ??= import("@/lib/sound/engine");
  return engineModule;
}

function playQueuedCues(): void {
  if (!engine || !isRunning()) return;
  const now = performance.now();
  for (const { cue, options, askedAt } of queuedCues.splice(0)) {
    if (now - askedAt <= QUEUED_CUE_MAX_AGE_MS) engine.play(cue, options);
  }
}

function startEngine(audio: AudioContext): void {
  loadEngineModule()
    .then(({ createSoundEngine }) => {
      if (engine || context !== audio) return;
      engine = createSoundEngine(audio);
      engine.setOn(readPreference() === "on");
      playQueuedCues();
    })
    .catch((error: unknown) => reportError(error, "sound engine"));
}

function handleGesture(event: Event): void {
  // The sound button decides for itself, or its own press would count as turning sound on.
  if (event.target instanceof Element && event.target.closest("[data-sound-toggle]")) return;
  if (readPreference() === "off") {
    stopWaitingForGesture();
    return;
  }
  wakeAudio();
}

function waitForGesture(): void {
  if (isWaitingForGesture) return;
  isWaitingForGesture = true;
  for (const gesture of GESTURES) document.addEventListener(gesture, handleGesture, { capture: true, passive: true });
}

function stopWaitingForGesture(): void {
  if (!isWaitingForGesture) return;
  isWaitingForGesture = false;
  for (const gesture of GESTURES) document.removeEventListener(gesture, handleGesture, { capture: true });
}

function handleStateChange(): void {
  notifyListeners();
  if (isRunning()) {
    stopWaitingForGesture();
    playQueuedCues();
  } else if (readPreference() === "on" && !document.hidden) {
    // Interrupted (a call, another app taking the audio): the next click brings it back.
    waitForGesture();
  }
}

/** Starts the audio, or starts it again. Only works inside the visitor's own click or key press. */
function wakeAudio(): void {
  if (!context) {
    context = new AudioContext({ latencyHint: "interactive" });
    context.addEventListener("statechange", handleStateChange);
    startEngine(context);
  }
  if (isRunning()) return;
  // iOS only lets audio out once something has been played inside the gesture itself.
  const silence = context.createBufferSource();
  silence.buffer = context.createBuffer(1, 1, context.sampleRate);
  silence.connect(context.destination);
  silence.start();
  void context.resume().catch(() => {});
}

function followVisibility(): void {
  if (!context) return;
  if (document.hidden) {
    void context.suspend();
    return;
  }
  if (readPreference() === "off") return;
  context
    .resume()
    .catch(() => {})
    .finally(() => {
      if (!isRunning()) waitForGesture();
    });
}

function preloadEngine(): void {
  if ("requestIdleCallback" in window) window.requestIdleCallback(() => void loadEngineModule(), { timeout: 2000 });
  else void loadEngineModule();
}

function playControlTap(event: MouseEvent): void {
  if (!(event.target instanceof Element)) return;
  const control = event.target.closest(CONTROLS);
  if (!control || control.closest("[data-sound-toggle]")) return;
  const command = control.getAttribute("command");
  // A dialog closing makes its own sound, however it was closed.
  if (command === "close") return;
  playCue(command === "show-modal" ? "paperOpen" : "tap");
}

function playDialogClose(event: Event): void {
  if (event.target instanceof HTMLDialogElement) playCue("paperClose");
}

export function subscribeToSound(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Whether sound is on and actually playing (it waits for a first click). */
export function isSoundAudible(): boolean {
  return readPreference() === "on" && isRunning();
}

export function getSoundState(): SoundState {
  if (readPreference() === "off") return "off";
  return isRunning() ? "playing" : "waiting";
}

/** Plays a cue now (or after options.delay), if sound is on. Safe to call from anywhere, any time. */
export function playCue(cue: SoundCue, options?: CueOptions): void {
  if (readPreference() === "off" || !context) return;
  const now = performance.now();
  if (now - (lastPlayedAt.get(cue) ?? -Infinity) < REPEAT_GAP_MS) return;
  lastPlayedAt.set(cue, now);
  if (engine && isRunning()) engine.play(cue, options);
  else queuedCues.push({ cue, options, askedAt: now });
}

/** The sound button: off if it is playing, otherwise on (and, since this is a click, it starts playing). */
export function toggleSound(): void {
  window.clearTimeout(suspendTimer);
  if (isSoundAudible()) {
    savePreference("off");
    stopWaitingForGesture();
    engine?.setOn(false);
    suspendTimer = window.setTimeout(() => {
      if (readPreference() === "off") void context?.suspend();
    }, SUSPEND_AFTER_FADE_MS);
  } else {
    savePreference("on");
    wakeAudio();
    engine?.setOn(true);
    playCue("chime");
  }
  notifyListeners();
}

/** Listens for the first click (with sound on), button presses, dialogs, and the tab being hidden. */
export function startSoundRuntime(): () => void {
  if (!("AudioContext" in window)) return () => {};
  const preloadTimer = readPreference() === "on" ? window.setTimeout(preloadEngine, PRELOAD_DELAY_MS) : 0;
  if (readPreference() === "on" && !isRunning()) waitForGesture();
  document.addEventListener("click", playControlTap);
  document.addEventListener("close", playDialogClose, true);
  document.addEventListener("visibilitychange", followVisibility);
  return () => {
    window.clearTimeout(preloadTimer);
    stopWaitingForGesture();
    document.removeEventListener("click", playControlTap);
    document.removeEventListener("close", playDialogClose, true);
    document.removeEventListener("visibilitychange", followVisibility);
  };
}
