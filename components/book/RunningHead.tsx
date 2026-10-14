import { PROFILE } from "@/content/portfolio";

interface RunningHeadProps {
  readonly title: string;
}

// The running head at the top of a book's right-hand page; decorative, since
// the chapter heading already names the page.
export function RunningHead({ title }: RunningHeadProps) {
  return (
    <div
      aria-hidden="true"
      className="mb-12 hidden items-center justify-between border-b border-ink/15 pb-3 small-caps text-[0.72rem] tracking-[0.16em] text-ink-soft lg:flex"
    >
      <span>{PROFILE.fullName}</span>
      <span>{title}</span>
    </div>
  );
}
