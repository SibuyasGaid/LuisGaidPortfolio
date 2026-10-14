import type { ReactNode } from "react";

interface BookSpreadProps {
  readonly leftPage: ReactNode;
  readonly rightPage: ReactNode;
  readonly folios?: readonly [string, string];
}

export function BookSpread({ leftPage, rightPage, folios }: BookSpreadProps) {
  return (
    <div className="book surface-leather">
      <div className="book-pages surface-parchment">
        <div className="page page-left">
          {leftPage}
          {folios ? <Folio number={folios[0]} side="left" /> : null}
        </div>
        <div className="page page-right">
          {rightPage}
          {folios ? <Folio number={folios[1]} side="right" /> : null}
        </div>
      </div>
    </div>
  );
}

interface FolioProps {
  readonly number: string;
  readonly side: "left" | "right";
}

// Only shown on the two-page spread; on one-page layouts the numbers would land mid-page.
function Folio({ number, side }: FolioProps) {
  const position = side === "left" ? "left-[clamp(2.5rem,4vw,4.5rem)]" : "right-[clamp(2.5rem,4vw,4.5rem)]";
  return (
    <span
      aria-hidden="true"
      className={`absolute bottom-6 hidden font-display text-[0.95rem] tracking-[0.08em] text-ink-soft lg:block ${position}`}
    >
      {number}
    </span>
  );
}
