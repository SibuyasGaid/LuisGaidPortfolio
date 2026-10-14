import { PROJECT_CATEGORY_LABELS, type Project } from "@/content/portfolio";

interface ArchiveEntryProps {
  readonly project: Project;
}

export function ArchiveEntry({ project }: ArchiveEntryProps) {
  const titleId = `${project.id}-title`;
  return (
    <article id={project.id} aria-labelledby={titleId} data-reveal className="scroll-mt-28 py-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 id={titleId} className="font-display text-[1.5rem] font-semibold leading-tight text-ink">
          {project.title}
        </h3>
        <p className="font-caps text-[0.95rem] lowercase tracking-[0.12em] text-burgundy">
          {project.badge?.label ?? PROJECT_CATEGORY_LABELS[project.category]}
        </p>
      </div>
      <p className="mt-0.5 font-display text-lg italic text-ink-soft">
        {project.subtitle}
        {project.client ? ` for ${project.client}` : ""}
      </p>
      <p className="mt-2.5 text-[0.97rem] leading-relaxed text-ink">{project.solution}</p>
      <p className="mt-3 text-[0.8rem] tracking-wide text-ink-soft">
        <span className="sr-only">Built with: </span>
        {project.stack.join(" · ")}
      </p>
    </article>
  );
}
