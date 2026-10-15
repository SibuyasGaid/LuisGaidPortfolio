import { BookcaseController } from "@/components/shelf/BookcaseController";
import { LIBRARY } from "@/content/portfolio";
import { BOOKCASE_MARKUP } from "@/lib/shelf/renderBookcaseMarkup";

// The home page: a full bookcase with the six titled books among the rest.
// Hovering or focusing a titled book eases it forward and names it below the
// shelf; choosing it takes it off the shelf and opens it.
export function Bookcase() {
  return (
    <nav aria-label="Library shelf" className="bookcase">
      <div className="bookcase-cabinet">
        <div data-bookcase className="bookcase-rows" dangerouslySetInnerHTML={{ __html: BOOKCASE_MARKUP }} />
      </div>
      <p className="bookcase-instruction">{LIBRARY.shelfInstruction}</p>
      <BookcaseController />
    </nav>
  );
}
