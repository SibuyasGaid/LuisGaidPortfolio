import type { ReactNode } from "react";

interface SpreadProps {
  readonly format: "spread";
  readonly leftPage: ReactNode;
  readonly rightPage: ReactNode;
  readonly folios?: readonly [string, string];
  readonly cover?: ReactNode;
}

interface FolioProps {
  readonly format: "folio";
  readonly page: ReactNode;
  readonly cover?: ReactNode;
}

type OpenBookProps = SpreadProps | FolioProps;

// The open book frame. Colours come from the nearest [data-book] theme, and
// an optional cover swings open over the pages when the book is first shown.
export function OpenBook(props: OpenBookProps) {
  if (props.format === "folio") {
    return (
      <div className="book book-cover-surface" data-format="folio">
        <div className="book-pages">
          <div className="page page-folio">{props.page}</div>
        </div>
        {props.cover}
      </div>
    );
  }

  return (
    <div className="book book-cover-surface" data-format="spread">
      <div className="book-pages">
        <div className="page page-left">
          {props.leftPage}
          {props.folios ? <Folio number={props.folios[0]} side="left" /> : null}
        </div>
        <div className="page page-right">
          {props.rightPage}
          {props.folios ? <Folio number={props.folios[1]} side="right" /> : null}
        </div>
      </div>
      {props.cover}
    </div>
  );
}

interface FolioNumberProps {
  readonly number: string;
  readonly side: "left" | "right";
}

// Only shown on the two-page spread; on one-page layouts the numbers would land mid-page.
function Folio({ number, side }: FolioNumberProps) {
  const position = side === "left" ? "left-[clamp(3rem,4.5vw,5.5rem)]" : "right-[clamp(3rem,4.5vw,5.5rem)]";
  return (
    <span aria-hidden="true" className={`eyebrow absolute bottom-7 hidden tracking-[0.12em] text-ink-soft lg:block ${position}`}>
      {number}
    </span>
  );
}
