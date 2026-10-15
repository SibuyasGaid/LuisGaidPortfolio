import { BookPage } from "@/components/book/BookPage";
import { ExperienceBook } from "@/components/books/ExperienceBook";
import { createBookMetadata } from "@/lib/books";

export const metadata = createBookMetadata("experience");

export default function ExperiencePage() {
  return (
    <BookPage bookId="experience">
      <ExperienceBook />
    </BookPage>
  );
}
