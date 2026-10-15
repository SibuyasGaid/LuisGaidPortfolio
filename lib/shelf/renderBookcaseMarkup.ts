import { type Book } from "@/content/portfolio";
import { getBook, getBookHref } from "@/lib/books";
import { escapeHtml } from "@/lib/escapeHtml";
import { arrangeBookcase, type FillerBook, type LyingStack, type ShelfItem, type TitledBook } from "@/lib/shelf/arrangeBookcase";

// The bookcase as one HTML string. Around 170 decorative books would each cost
// React a node to hydrate; as static markup they cost nothing after the first
// paint. The six titled books are ordinary links inside it, so the shelf still
// works without JavaScript.

function renderFiller(book: FillerBook): string {
  const leanStyle = book.lean ? `;--lean:${book.lean}deg` : "";
  const leanClass = book.lean ? " is-leaning" : "";
  return `<span class="shelf-book is-filler${leanClass}" data-pattern="${book.pattern}" style="--w:${book.width};--h:${book.height};--c:${book.color}${leanStyle}"></span>`;
}

function renderCaption(book: Book): string {
  return (
    `<span class="shelf-caption" aria-hidden="true">` +
    `<span class="eyebrow text-brass-light">Volume ${escapeHtml(book.numeral)} · ${escapeHtml(book.kind)}</span>` +
    `<span class="shelf-caption-title">${escapeHtml(book.title)} <em>${escapeHtml(book.subtitle)}</em></span>` +
    `</span>`
  );
}

// The spine carries the short title, set as large as the spine allows; the
// full title, kind and subtitle ride along as data for the cover.
function renderTitled(item: TitledBook): string {
  const book = getBook(item.bookId);
  const volume = `Volume ${book.numeral} · ${book.kind}`;
  return (
    `<a href="${getBookHref(book.id)}" class="shelf-book is-titled" data-book="${book.id}" data-shelf-book ` +
    `data-title="${escapeHtml(book.title)}" data-subtitle="${escapeHtml(book.subtitle)}" data-volume="${escapeHtml(volume)}" ` +
    `style="--w:${item.width};--h:${item.height};--chars:${book.navLabel.length}">` +
    `<span class="shelf-book-body">` +
    `<span class="shelf-spine-numeral" aria-hidden="true">${escapeHtml(book.numeral)}</span>` +
    `<span class="shelf-spine-title" aria-hidden="true">${escapeHtml(book.navLabel)}</span>` +
    `<span class="sr-only">${escapeHtml(book.title)}: ${escapeHtml(book.subtitle)}</span>` +
    `</span></a>` +
    renderCaption(book)
  );
}

function renderStack(stack: LyingStack): string {
  const books = stack.books
    .map((book) => `<span class="shelf-lying-book" style="--w:${book.width};--t:${book.thickness};--c:${book.color}"></span>`)
    .join("");
  return `<span class="shelf-stack">${books}</span>`;
}

function renderItem(item: ShelfItem): string {
  switch (item.kind) {
    case "filler":
      return renderFiller(item);
    case "titled":
      return renderTitled(item);
    case "stack":
      return renderStack(item);
    case "bookend":
      return `<span class="shelf-bookend"></span>`;
  }
}

export const BOOKCASE_MARKUP = arrangeBookcase().map(renderItem).join("");
