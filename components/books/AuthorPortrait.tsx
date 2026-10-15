import Image, { type StaticImageData } from "next/image";
import authorPortrait from "@/assets/books/author-portrait.svg";
import { PROFILE } from "@/content/portfolio";

/** Engraved from a photograph by scripts/engrave-portrait.py: ink lines only, so the page's paper shows through. */
const PORTRAIT: StaticImageData = authorPortrait;

// The About book's frontispiece: the author, as an engraved plate facing the title.
export function AuthorPortrait() {
  return (
    <figure data-reveal className="mx-auto w-full max-w-[19rem]">
      <Image src={PORTRAIT} alt={`Portrait of ${PROFILE.fullName}, drawn as an engraving`} unoptimized className="h-auto w-full" />
      <figcaption className="eyebrow mt-4 text-center text-ink-soft">{PROFILE.fullName}</figcaption>
    </figure>
  );
}
