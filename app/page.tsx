import { BookSpread } from "@/components/book/BookSpread";
import { TableOfContents } from "@/components/contents/TableOfContents";
import { TitlePage } from "@/components/contents/TitlePage";
import { LibraryIntro } from "@/components/intro/LibraryIntro";
import { RevealScope } from "@/components/motion/RevealScope";
import { CONTENTS_FOLIOS } from "@/lib/chapters";

export default function ContentsPage() {
  return (
    <>
      <LibraryIntro />
      {/* The intro's open book lands exactly on this spread before fading into it. */}
      <div data-intro-target data-inert-during-intro>
        <RevealScope>
          <BookSpread folios={CONTENTS_FOLIOS} leftPage={<TitlePage />} rightPage={<TableOfContents />} />
        </RevealScope>
      </div>
    </>
  );
}
