import { ChapterPage } from "@/components/book/ChapterPage";
import { AboutChapter } from "@/components/chapters/AboutChapter";
import { createChapterMetadata } from "@/lib/chapters";

export const metadata = createChapterMetadata("about");

export default function AboutPage() {
  return (
    <ChapterPage chapterId="about">
      <AboutChapter />
    </ChapterPage>
  );
}
