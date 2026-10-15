import { BookPage } from "@/components/book/BookPage";
import { StackBook } from "@/components/books/StackBook";
import { createBookMetadata } from "@/lib/books";

export const metadata = createBookMetadata("stack");

export default function StackPage() {
  return (
    <BookPage bookId="stack">
      <StackBook />
    </BookPage>
  );
}
