import { ChapterPage } from "@/components/book/ChapterPage";
import { ExperienceChapter } from "@/components/chapters/ExperienceChapter";
import { createChapterMetadata } from "@/lib/chapters";

export const metadata = createChapterMetadata("experience");

export default function ExperiencePage() {
  return (
    <ChapterPage chapterId="experience">
      <ExperienceChapter />
    </ChapterPage>
  );
}
