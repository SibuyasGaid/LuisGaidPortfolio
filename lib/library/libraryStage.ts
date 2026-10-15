import type { ShelfView } from "@/lib/library/createShelfView";
import { SCENE_READY_ATTRIBUTE } from "@/lib/library/shelfAttributes";
import type { LibraryScene, RenderQuality } from "@/lib/library/webgl/createLibraryScene";
import { REDUCED_MOTION_QUERY, SHELF_SCENE_IDLE_RELEASE_MS } from "@/lib/motion/config";

// One library for the whole visit. The intro builds it and walks through it,
// the home page keeps showing it, and it survives trips to the books and back
// (the home page's DOM is kept while hidden). Left unseen for a while, it is
// released to free the GPU, and built again if the reader returns.

export interface Library {
  readonly scene: LibraryScene;
  readonly view: ShelfView;
}

type ProgressListener = (share: number) => void;

let loading: Promise<Library> | null = null;
let loaded: Library | null = null;
let hasWalkBeenSeen = false;
let releaseTimer = 0;
const progressListeners = new Set<ProgressListener>();

function loadRuntime(): Promise<typeof import("@/lib/library/libraryRuntime")> {
  return import("@/lib/library/libraryRuntime");
}

/** Starts downloading the library's code early, so building it later waits on nothing. */
export function preloadLibrary(): void {
  void loadRuntime().catch(() => {});
}

export function getLibraryHost(): HTMLElement | null {
  return document.querySelector<HTMLElement>("[data-library-scene]");
}

/** The library if it is built and still held, for code that must not wait. */
export function getLoadedLibrary(): Library | null {
  return loaded;
}

async function build(quality: RenderQuality): Promise<Library> {
  const host = getLibraryHost();
  if (!host) throw new Error("The library has nowhere to draw");
  const runtime = await loadRuntime();
  const scene = await runtime.createLibraryScene(host, quality, (share) => {
    for (const listener of progressListeners) listener(share);
  });
  const view = runtime.createShelfView(scene, { isMotionAllowed: !window.matchMedia(REDUCED_MOTION_QUERY).matches });
  loaded = { scene, view };
  document.documentElement.setAttribute(SCENE_READY_ATTRIBUTE, "");
  return loaded;
}

/**
 * The library, built once however many callers ask. onProgress hears the
 * build's stages (from 0 to 1) if it is still under way.
 */
export function loadLibrary(quality: RenderQuality, onProgress?: ProgressListener): Promise<Library> {
  window.clearTimeout(releaseTimer);
  if (loaded) return Promise.resolve(loaded);
  if (onProgress) progressListeners.add(onProgress);
  loading ??= build(quality).finally(() => {
    progressListeners.clear();
  });
  const pending = loading;
  pending.catch(() => {
    if (loading === pending) loading = null;
  });
  return pending;
}

function release(): void {
  if (!loaded) return;
  loaded.view.dispose();
  loaded.scene.dispose();
  loaded = null;
  loading = null;
  document.documentElement.removeAttribute(SCENE_READY_ATTRIBUTE);
}

/** The home page is out of sight: let the library go if it stays that way. */
export function releaseLibraryLater(): void {
  window.clearTimeout(releaseTimer);
  releaseTimer = window.setTimeout(release, SHELF_SCENE_IDLE_RELEASE_MS);
}

/** The home page is back: keep the library. */
export function keepLibrary(): void {
  window.clearTimeout(releaseTimer);
}

/** The intro's walk has been on screen, so if it is cut short the camera should travel on rather than jump. */
export function markWalkSeen(): void {
  hasWalkBeenSeen = true;
}

/** Whether the walk was seen, asked once, when the home page takes the camera over. */
export function takeWalkSeen(): boolean {
  const wasSeen = hasWalkBeenSeen;
  hasWalkBeenSeen = false;
  return wasSeen;
}

/** Lets the library go now, after a failure. */
export function releaseLibrary(): void {
  window.clearTimeout(releaseTimer);
  release();
}
