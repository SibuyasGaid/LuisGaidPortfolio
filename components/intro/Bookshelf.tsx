import { SHELF_MARKUP } from "@/lib/intro/renderShelfMarkup";

export function Bookshelf() {
  return <div data-intro-shelf className="intro-shelf" dangerouslySetInnerHTML={{ __html: SHELF_MARKUP }} />;
}
