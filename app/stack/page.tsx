import { ChapterPage } from "@/components/book/ChapterPage";
import { StackChapter } from "@/components/chapters/StackChapter";
import { createChapterMetadata } from "@/lib/chapters";

export const metadata = createChapterMetadata("stack");

export default function StackPage() {
  return (
    <ChapterPage chapterId="stack">
      <StackChapter />
    </ChapterPage>
  );
}
