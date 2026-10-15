"use client";

import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect } from "react";
import { isIntroPlaying, subscribeToIntroFinish } from "@/lib/intro/introLifecycle";
import { setBookPicker } from "@/lib/library/bookPicker";
import { applyShelfView, chooseShelfView, fallBackToFlatShelf } from "@/lib/library/chooseShelfView";
import { keepLibrary, loadLibrary, releaseLibrary, releaseLibraryLater, takeWalkSeen, type Library } from "@/lib/library/libraryStage";
import { AT_LIBRARY_ATTRIBUTE, TAKING_ATTRIBUTE } from "@/lib/library/shelfAttributes";
import { SHELF_SCENE_LOAD_TIMEOUT_MS } from "@/lib/motion/config";
import { reportError } from "@/lib/reportError";

/** Runs once the intro is out of the way: straight away, or when it finishes. */
function afterIntro(callback: () => void): () => void {
  if (!isIntroPlaying()) {
    callback();
    return () => {};
  }
  let isWaiting = true;
  const unsubscribe = subscribeToIntroFinish(() => {
    if (!isWaiting) return;
    isWaiting = false;
    unsubscribe();
    callback();
  });
  return () => {
    isWaiting = false;
    unsubscribe();
  };
}

// The home page's WebGL library. Where the device runs it well, the library
// the intro walked through stays on as the home page: the grand bookcase,
// waiting for a book to be chosen from the navbar. Anywhere else, or if it
// fails or takes too long, the flat bookcase is shown instead.
export function LibraryShelfDirector() {
  const router = useRouter();

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.setAttribute(AT_LIBRARY_ATTRIBUTE, "");
    return () => root.removeAttribute(AT_LIBRARY_ATTRIBUTE);
  }, []);

  useEffect(() => {
    const view = chooseShelfView();
    if (!isIntroPlaying()) applyShelfView(view.kind);
    if (view.kind !== "scene") return;
    const { quality } = view;

    let isShown = true;
    let library: Library | null = null;
    let timeout = 0;
    let unregisterPicker = () => {};
    keepLibrary();

    function fallBack(error?: unknown): void {
      if (error) reportError(error, "library scene");
      if (!isShown || library) return;
      releaseLibrary();
      fallBackToFlatShelf();
    }

    async function show(): Promise<void> {
      timeout = window.setTimeout(() => fallBack(), SHELF_SCENE_LOAD_TIMEOUT_MS);
      try {
        const loaded = await loadLibrary(quality);
        window.clearTimeout(timeout);
        if (!isShown) return;
        library = loaded;
        // Back from a book whose page has not finished replacing this one: the shelf is reset when it has.
        if (!document.documentElement.hasAttribute(TAKING_ATTRIBUTE)) loaded.view.reset();
        loaded.view.start({ glide: takeWalkSeen() });
        const { createScenePicker } = await import("@/lib/library/createScenePicker");
        if (!isShown) return;
        unregisterPicker = setBookPicker(
          createScenePicker(loaded, (href) => router.push(href)),
          "scene",
        );
      } catch (error) {
        window.clearTimeout(timeout);
        fallBack(error);
      }
    }

    const stopWaiting = afterIntro(() => void show());
    return () => {
      isShown = false;
      stopWaiting();
      window.clearTimeout(timeout);
      unregisterPicker();
      // A book being taken keeps the library drawing until its page is up.
      if (library && !document.documentElement.hasAttribute(TAKING_ATTRIBUTE)) library.view.stop();
      releaseLibraryLater();
    };
  }, [router]);

  return null;
}
