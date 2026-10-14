import { ChapterPage } from "@/components/book/ChapterPage";
import { ContactChapter } from "@/components/chapters/ContactChapter";
import { createChapterMetadata } from "@/lib/chapters";

export const metadata = createChapterMetadata("contact");

export default function ContactPage() {
  return (
    <ChapterPage chapterId="contact">
      <ContactChapter />
    </ChapterPage>
  );
}
