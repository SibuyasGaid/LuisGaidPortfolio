import type { ReactNode } from "react";
import { BookSpread } from "@/components/book/BookSpread";
import { ChapterFooter } from "@/components/book/ChapterFooter";
import { ChapterOpener } from "@/components/book/ChapterOpener";
import { RunningHead } from "@/components/book/RunningHead";
import { ChapterFallback } from "@/components/errors/ChapterFallback";
import { ErrorBoundary } from "@/components/errors/ErrorBoundary";
import { RevealScope } from "@/components/motion/RevealScope";
import type { ChapterId } from "@/content/portfolio";
import { getChapter, getChapterFolios } from "@/lib/chapters";

interface ChapterPageProps {
  readonly chapterId: ChapterId;
  readonly children: ReactNode;
}

export function ChapterPage({ chapterId, children }: ChapterPageProps) {
  const chapter = getChapter(chapterId);
  const titleId = `${chapterId}-title`;
  return (
    <RevealScope>
      <article aria-labelledby={titleId}>
        <BookSpread
          folios={getChapterFolios(chapterId)}
          leftPage={<ChapterOpener chapter={chapter} titleId={titleId} />}
          rightPage={
            <>
              <RunningHead title={chapter.title} />
              <ErrorBoundary fallback={<ChapterFallback chapterTitle={chapter.title} />}>{children}</ErrorBoundary>
              <ChapterFooter chapterId={chapterId} />
            </>
          }
        />
      </article>
    </RevealScope>
  );
}
