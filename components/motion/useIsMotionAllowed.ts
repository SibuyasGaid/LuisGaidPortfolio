"use client";

import { useSyncExternalStore } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToMotionPreference(onChange: () => void): () => void {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function readIsMotionAllowed(): boolean {
  return !window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

// Motion is off during server rendering, so animation code is only ever
// downloaded by browsers that want it.
export function useIsMotionAllowed(): boolean {
  return useSyncExternalStore(subscribeToMotionPreference, readIsMotionAllowed, () => false);
}
