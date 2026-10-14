import { ChapterPage } from "@/components/book/ChapterPage";
import { WorkChapter } from "@/components/chapters/WorkChapter";
import { createChapterMetadata } from "@/lib/chapters";

export const metadata = createChapterMetadata("work");

export default function WorkPage() {
  return (
    <ChapterPage chapterId="work">
      <WorkChapter />
    </ChapterPage>
  );
}
