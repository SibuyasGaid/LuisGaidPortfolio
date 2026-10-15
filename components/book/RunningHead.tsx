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
      className="eyebrow mb-14 hidden items-center justify-between border-b border-ink/10 pb-4 text-ink-soft/80 lg:flex"
    >
      <span>{PROFILE.fullName}</span>
      <span>{title}</span>
    </div>
  );
}
