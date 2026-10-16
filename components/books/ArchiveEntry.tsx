import type { Project } from "@/content/portfolio";

interface ArchiveEntryProps {
  readonly project: Project;
}

export function ArchiveEntry({ project }: ArchiveEntryProps) {
  const titleId = `${project.id}-title`;
  return (
    <article id={project.id} aria-labelledby={titleId} data-reveal className="scroll-mt-28 py-7">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div>
          <h4 id={titleId} className="font-display text-[1.55rem] font-medium leading-tight text-ink">
            {project.title}
          </h4>
          <p className="mt-0.5 text-sm text-ink-soft">{project.subtitle}</p>
        </div>
        {/* The section already names the kind of work; the chip says how far it went. */}
        {project.badge ? <span className="stack-chip">{project.badge.label}</span> : null}
      </div>
      <p className="mt-3 text-[0.97rem] leading-relaxed text-ink">{project.solution}</p>
      <p className="mt-3 text-xs tracking-wide text-ink-soft">
        <span className="sr-only">Built with: </span>
        {project.stack.join(" · ")}
      </p>
    </article>
  );
}
