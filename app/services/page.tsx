import { BookPage } from "@/components/book/BookPage";
import { ServicesBook } from "@/components/books/ServicesBook";
import { createBookMetadata } from "@/lib/books";

export const metadata = createBookMetadata("services");

export default function ServicesPage() {
  return (
    <BookPage bookId="services">
      <ServicesBook />
    </BookPage>
  );
}
