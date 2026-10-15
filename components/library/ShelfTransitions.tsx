"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { setBookPicker } from "@/lib/library/bookPicker";
import { chooseShelfView } from "@/lib/library/chooseShelfView";
import { createLibrarian, type Librarian } from "@/lib/library/createLibrarian";
import { getLoadedLibrary, loadLibrary } from "@/lib/library/libraryStage";

/** How long a book page waits, once idle, before the library is built behind it for the next move. */
const BACKGROUND_LOAD_DELAY_MS = 2500;

function whenIdle(callback: () => void): () => void {
  if (typeof window.requestIdleCallback === "function") {
    const handle = window.requestIdleCallback(callback, { timeout: 4000 });
    return () => window.cancelIdleCallback(handle);
  }
  const handle = window.setTimeout(callback, BACKGROUND_LOAD_DELAY_MS);
  return () => window.clearTimeout(handle);
}

// The librarian for the whole site (see createLibrarian): every link to a
// book or to the shelf asks it to play the move. On a book page, where the
// device runs the WebGL library, the library is quietly built in the
// background so leaving the book can play in the scene.
export function ShelfTransitions() {
  const router = useRouter();
  const pathname = usePathname();
  const librarianRef = useRef<Librarian | null>(null);
  const pathnameRef = useRef(pathname);
  const previousPathnameRef = useRef(pathname);

  useEffect(() => {
    const librarian = createLibrarian({
      navigate: (href) => router.push(href),
      getPathname: () => pathnameRef.current,
    });
    librarianRef.current = librarian;
    const unregister = setBookPicker(librarian);
    return () => {
      unregister();
      librarian.dispose();
      librarianRef.current = null;
    };
  }, [router]);

  useEffect(() => {
    pathnameRef.current = pathname;
    const previousPathname = previousPathnameRef.current;
    previousPathnameRef.current = pathname;
    if (previousPathname !== pathname) librarianRef.current?.arrive(previousPathname, pathname);
  }, [pathname]);

  useEffect(() => {
    if (pathname === "/") return;
    const view = chooseShelfView();
    if (view.kind !== "scene" || getLoadedLibrary()) return;
    let delay = 0;
    const cancelIdle = whenIdle(() => {
      delay = window.setTimeout(() => void loadLibrary(view.quality).catch(() => {}), BACKGROUND_LOAD_DELAY_MS);
    });
    return () => {
      cancelIdle();
      window.clearTimeout(delay);
    };
  }, [pathname]);

  return null;
}
