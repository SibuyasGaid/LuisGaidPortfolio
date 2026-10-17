"use client";

import { useEffect } from "react";
import { startSoundRuntime } from "@/lib/sound/sound";

// Mounted once, in the layout: the audio wakes at the first click (with sound
// on), buttons tap, and dialogs rustle open and shut. See lib/sound/sound.ts.
export function SoundRuntime() {
  useEffect(() => startSoundRuntime(), []);
  return null;
}
