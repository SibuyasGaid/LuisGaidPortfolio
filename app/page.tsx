import { BookSpread } from "@/components/book/BookSpread";
import { TableOfContents } from "@/components/contents/TableOfContents";
import { TitlePage } from "@/components/contents/TitlePage";
import { RevealScope } from "@/components/motion/RevealScope";
import { CONTENTS_FOLIOS } from "@/lib/chapters";

export default function ContentsPage() {
  return (
    <RevealScope>
      <BookSpread folios={CONTENTS_FOLIOS} leftPage={<TitlePage />} rightPage={<TableOfContents />} />
    </RevealScope>
  );
}
