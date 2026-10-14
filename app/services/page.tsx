import { ChapterPage } from "@/components/book/ChapterPage";
import { ServicesChapter } from "@/components/chapters/ServicesChapter";
import { createChapterMetadata } from "@/lib/chapters";

export const metadata = createChapterMetadata("services");

export default function ServicesPage() {
  return (
    <ChapterPage chapterId="services">
      <ServicesChapter />
    </ChapterPage>
  );
}
