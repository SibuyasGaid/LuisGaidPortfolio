import { BookPage } from "@/components/book/BookPage";
import { ContactBook } from "@/components/books/ContactBook";
import { createBookMetadata } from "@/lib/books";

export const metadata = createBookMetadata("contact");

export default function ContactPage() {
  return (
    <BookPage bookId="contact">
      <ContactBook />
    </BookPage>
  );
}
