import type { Metadata } from "next";
import { CHAPTERS, type Chapter, type ChapterId } from "@/content/portfolio";

export function getChapterHref(chapterId: ChapterId): `/${ChapterId}` {
  return `/${chapterId}`;
}

export function getChapter(chapterId: ChapterId): Chapter {
  const chapter = CHAPTERS.find((candidate) => candidate.id === chapterId);
  if (!chapter) throw new Error(`Unknown chapter: ${chapterId}`);
  return chapter;
}

export function getAdjacentChapters(chapterId: ChapterId): {
  previous: Chapter | null;
  next: Chapter | null;
} {
  const index = CHAPTERS.findIndex((chapter) => chapter.id === chapterId);
  return {
    previous: CHAPTERS[index - 1] ?? null,
    next: CHAPTERS[index + 1] ?? null,
  };
}

// Decorative page numbers: the contents spread is front matter in roman
// numerals, and each chapter spread follows with an even left page.
export const CONTENTS_FOLIOS = ["ii", "iii"] as const;

export function getChapterFolios(chapterId: ChapterId): readonly [string, string] {
  const leftPageNumber = (CHAPTERS.findIndex((chapter) => chapter.id === chapterId) + 1) * 2;
  return [String(leftPageNumber), String(leftPageNumber + 1)];
}

export function createChapterMetadata(chapterId: ChapterId): Metadata {
  const chapter = getChapter(chapterId);
  return {
    title: chapter.title,
    description: chapter.introduction,
    alternates: { canonical: getChapterHref(chapterId) },
  };
}
