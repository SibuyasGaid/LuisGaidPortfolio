import { BookPage } from "@/components/book/BookPage";
import { WorkBook } from "@/components/books/WorkBook";
import { createBookMetadata } from "@/lib/books";

export const metadata = createBookMetadata("work");

export default function WorkPage() {
  return (
    <BookPage bookId="work">
      <WorkBook />
    </BookPage>
  );
}
