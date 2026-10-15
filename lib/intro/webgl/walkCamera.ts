import { Vector3, type PerspectiveCamera } from "three";
import { AISLE, CAMERA_PATH } from "@/lib/intro/webgl/libraryLayout";

/** Where the walk is at one moment. */
export interface WalkState {
  /** 0 at the start of the walk, 1 where it stops. */
  readonly progress: number;
  /** 0 standing still, 1 in full stride: scales the footsteps. */
  readonly stride: number;
  /** Seconds since the walk began, for the rhythm of the steps. */
  readonly elapsed: number;
}

const STEP_FREQUENCY_HZ = 1.8;
/** How far the eye rises with each step, and sways from foot to foot, in metres. */
const STEP_RISE = 0.022;
const STEP_SWAY = 0.011;
/** A glance toward the shelves halfway down the aisle. */
const GLANCE_RADIANS = 0.06;
/** The walker starts turning their eyes toward the end bookcase this far before the aisle ends. */
const TURN_LEAD = 5;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function smoothstep(value: number): number {
  const clamped = clamp01(value);
  return clamped * clamped * (3 - 2 * clamped);
}

const ahead = new Vector3();
const finalTarget = new Vector3(CAMERA_PATH.finalTarget.x, CAMERA_PATH.finalTarget.y, CAMERA_PATH.finalTarget.z);

/** Puts the camera where a walker's eyes would be, looking where they would look. */
export function poseCamera(camera: PerspectiveCamera, state: WalkState): void {
  const z = CAMERA_PATH.startZ + (CAMERA_PATH.stopZ - CAMERA_PATH.startZ) * state.progress;
  const phase = state.elapsed * STEP_FREQUENCY_HZ * Math.PI * 2;
  const rise = ((1 - Math.cos(phase)) / 2) * STEP_RISE * state.stride;
  const sway = Math.sin(phase / 2) * STEP_SWAY * state.stride;
  camera.position.set(sway, CAMERA_PATH.eyeHeight + rise, z);

  const turnStart = -AISLE.length + TURN_LEAD;
  const turn = smoothstep((turnStart - z) / (turnStart - CAMERA_PATH.stopZ));
  ahead.set(0, CAMERA_PATH.eyeHeight - 0.08, z - 10).lerp(finalTarget, turn);

  const aisleShare = (CAMERA_PATH.startZ - turnStart) / (CAMERA_PATH.startZ - CAMERA_PATH.stopZ);
  const glance = Math.sin(Math.PI * clamp01(state.progress / aisleShare)) * GLANCE_RADIANS * (1 - turn);
  ahead.sub(camera.position).applyAxisAngle(camera.up, glance).add(camera.position);
  camera.lookAt(ahead);
}
