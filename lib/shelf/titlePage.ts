import { BOOKS, type BookId } from "@/content/portfolio";
import { escapeHtml } from "@/lib/escapeHtml";

// A book's title page as the live library paints it (createTitledBookArt),
// in HTML: for the CSS book taken off the poster, and for the copy of the
// open book that turns into the book's page. Laid out in .title-page-text.

/** The widest each line may run, as a share of the page's width, before it is set smaller to fit. */
const MAX_LINE_SHARES = { label: 0.72, title: 0.76, subtitle: 0.76 } as const;

type FittedLine = keyof typeof MAX_LINE_SHARES;

function isFittedLine(value: string | undefined): value is FittedLine {
  return value !== undefined && value in MAX_LINE_SHARES;
}

export function renderTitlePageText(bookId: BookId): string {
  const book = BOOKS.find((candidate) => candidate.id === bookId);
  if (!book) throw new Error(`Unknown book: ${bookId}`);
  return `
    <span class="title-page-text">
      <span class="title-page-label" data-fit="label">${escapeHtml(`Volume ${book.numeral} · ${book.kind}`)}</span>
      <span class="title-page-title" data-fit="title">${escapeHtml(book.title)}</span>
      <span class="title-page-subtitle" data-fit="subtitle">${escapeHtml(book.subtitle)}</span>
      <span class="title-page-rule"></span>
    </span>`;
}

/** Sets any line too long for a page this wide smaller, as the painted title pages do. Layout widths, so transforms do not matter. */
export function fitTitlePage(page: HTMLElement, pageWidth: number): void {
  for (const line of page.querySelectorAll<HTMLElement>("[data-fit]")) {
    const share = line.dataset.fit;
    if (!isFittedLine(share)) continue;
    const maxWidth = pageWidth * MAX_LINE_SHARES[share];
    const width = line.offsetWidth;
    if (width <= maxWidth || width === 0) continue;
    const fontSize = parseFloat(getComputedStyle(line).fontSize);
    line.style.fontSize = `${(fontSize * maxWidth) / width}px`;
  }
}
