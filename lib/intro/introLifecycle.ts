// Shared by the inline boot script (as a string) and the React intro code, so
// both agree on the attribute, the storage key and the finish event.

/**
 * play: first visit to the contents page, the library intro runs.
 * settle: every other hard load, the book lands with a short settle.
 * none: reduced motion, no entrance at all.
 * done: the intro has finished or been skipped.
 */
export type IntroState = "play" | "settle" | "none" | "done";

export const INTRO_STORAGE_KEY = "library:visited";
export const INTRO_FINISHED_EVENT = "library:intro-finished";
const INTRO_RUNNING_ATTRIBUTE = "data-intro-running";

/** If the animation code has not started by then (blocked or slow network), the intro steps aside. */
const INTRO_START_GRACE_MS = 3500;
/** Hard ceiling so the overlay can never trap the page. */
const INTRO_MAX_DURATION_MS = 12000;

// Runs in <head> before the first paint, so returning visitors never see the
// intro flash and skipping works before any React code has loaded.
export const INTRO_BOOT_SCRIPT = `(function(){
var root=document.documentElement,state="settle",hasVisited=false;
try{hasVisited=localStorage.getItem("${INTRO_STORAGE_KEY}")==="1";localStorage.setItem("${INTRO_STORAGE_KEY}","1")}catch(error){}
var prefersReducedMotion=!!(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches);
if(location.pathname==="/"&&!hasVisited){state="play"}else if(prefersReducedMotion){state="none"}
root.setAttribute("data-intro",state);window.__libraryIntroState=state;
if(state!=="play")return;
function finish(){if(root.getAttribute("data-intro")!=="play")return;root.setAttribute("data-intro","done");window.__libraryIntroState="done";document.dispatchEvent(new Event("${INTRO_FINISHED_EVENT}"))}
document.addEventListener("click",function(event){var target=event.target;if(target&&target.closest&&target.closest("[data-skip-intro]"))finish()});
document.addEventListener("keydown",function(event){if(event.key==="Escape")finish()});
setTimeout(function(){if(!root.hasAttribute("${INTRO_RUNNING_ATTRIBUTE}"))finish()},${INTRO_START_GRACE_MS});
setTimeout(finish,${INTRO_MAX_DURATION_MS});
})();`;

export function isIntroPlaying(): boolean {
  return document.documentElement.getAttribute("data-intro") === "play";
}

/** Stays true after the intro ends, so the finished scene is never torn down mid-fade. */
export function hasIntroStarted(): boolean {
  return isIntroPlaying() || document.documentElement.hasAttribute(INTRO_RUNNING_ATTRIBUTE);
}

export function subscribeToIntroFinish(onFinish: () => void): () => void {
  document.addEventListener(INTRO_FINISHED_EVENT, onFinish);
  return () => document.removeEventListener(INTRO_FINISHED_EVENT, onFinish);
}

export function markIntroRunning(): void {
  document.documentElement.setAttribute(INTRO_RUNNING_ATTRIBUTE, "");
}

/** Mirrors finish() in the boot script. */
export function finishIntro(): void {
  if (!isIntroPlaying()) return;
  document.documentElement.setAttribute("data-intro", "done");
  window.__libraryIntroState = "done";
  document.dispatchEvent(new Event(INTRO_FINISHED_EVENT));
}
