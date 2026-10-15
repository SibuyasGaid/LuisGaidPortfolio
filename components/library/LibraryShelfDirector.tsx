"use client";

import { useEffect, useLayoutEffect } from "react";
import { isIntroPlaying, subscribeToIntroFinish } from "@/lib/intro/introLifecycle";
import { applyShelfView, chooseShelfView, fallBackToFlatShelf } from "@/lib/library/chooseShelfView";
import { loadLibrary, releaseLibrary, takeWalkSeen, type Library } from "@/lib/library/libraryStage";
import { AT_LIBRARY_ATTRIBUTE, TAKING_ATTRIBUTE, TRANSIT_ATTRIBUTE } from "@/lib/library/shelfAttributes";
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

/** A book coming or going keeps the library drawing until it is done. */
function isBookMoving(): boolean {
  const root = document.documentElement;
  return root.hasAttribute(TAKING_ATTRIBUTE) || root.hasAttribute(TRANSIT_ATTRIBUTE);
}

// The home page's live library. Where the device runs it well, the library
// the intro walked through fades up over the poster of the same view and
// stays on as the home page; anywhere else, or if it fails, the poster is the
// home page. Moves between the shelf and the books belong to ShelfTransitions.
export function LibraryShelfDirector() {
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

    async function show(): Promise<void> {
      try {
        const loaded = await loadLibrary(quality);
        if (!isShown) return;
        library = loaded;
        if (!isBookMoving()) loaded.view.reset();
        loaded.view.start({ glide: takeWalkSeen() });
      } catch (error) {
        reportError(error, "library scene");
        if (!isShown) return;
        releaseLibrary();
        fallBackToFlatShelf();
      }
    }

    const stopWaiting = afterIntro(() => void show());
    return () => {
      isShown = false;
      stopWaiting();
      if (library && !isBookMoving()) library.view.stop();
    };
  }, []);

  return null;
}
