import { BookPage } from "@/components/book/BookPage";
import { AboutBook } from "@/components/books/AboutBook";
import { createBookMetadata } from "@/lib/books";

export const metadata = createBookMetadata("about");

export default function AboutPage() {
  return (
    <BookPage bookId="about">
      <AboutBook />
    </BookPage>
  );
}
