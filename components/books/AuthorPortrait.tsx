import Image, { type StaticImageData } from "next/image";
import authorPortrait from "@/assets/books/author-portrait.svg";
import { PROFILE } from "@/content/portfolio";

/** Engraved from a photograph by scripts/engrave-portrait.py: ink lines only, so the page's paper shows through. */
const PORTRAIT: StaticImageData = authorPortrait;

// The About book's plate: the author, engraved, under the opening lines.
export function AuthorPortrait() {
  return (
    <figure data-reveal className="opener-plate">
      <Image src={PORTRAIT} alt={`Portrait of ${PROFILE.fullName}, drawn as an engraving`} unoptimized className="h-auto w-full" />
      <figcaption className="mt-3 font-display text-lg italic text-ink-soft">{PROFILE.fullName}</figcaption>
    </figure>
  );
}
