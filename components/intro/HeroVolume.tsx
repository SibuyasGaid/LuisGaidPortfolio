import { Monogram } from "@/components/ornaments/Monogram";
import { BOOK_COVER } from "@/content/portfolio";

// The PORTFOLIO book once it is off the shelf: a cover that swings open on its
// hinge over blank pages. The pages stay blank on purpose; the real page fades
// in underneath, so the text appears to ink itself onto them.
export function HeroVolume() {
  return (
    <div data-intro-volume className="intro-volume" aria-hidden="true">
      <div className="intro-volume-page intro-volume-page-right" />
      <div data-intro-cover className="intro-cover">
        <div className="intro-cover-front">
          <Monogram className="intro-cover-monogram" />
          <p className="intro-cover-title">{BOOK_COVER.coverTitle}</p>
          <p className="intro-cover-subtitle">{BOOK_COVER.spineTitle}</p>
        </div>
        <div className="intro-cover-back">
          <div className="intro-volume-page intro-volume-page-left" />
        </div>
      </div>
    </div>
  );
}
