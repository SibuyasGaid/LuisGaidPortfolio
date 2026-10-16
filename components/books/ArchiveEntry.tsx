import { getProjectDialogId, ProjectDialog } from "@/components/books/ProjectDialog";
import type { Project } from "@/content/portfolio";

interface ArchiveEntryProps {
  readonly project: Project;
}

export function ArchiveEntry({ project }: ArchiveEntryProps) {
  const titleId = `${project.id}-title`;
  return (
    <>
      <article id={project.id} aria-labelledby={titleId} data-reveal className="project-entry relative scroll-mt-28 py-7">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div>
            <h4 id={titleId} className="font-display text-[1.55rem] font-medium leading-tight text-ink">
              <button
                type="button"
                commandfor={getProjectDialogId(project)}
                command="show-modal"
                aria-haspopup="dialog"
                className="project-open"
              >
                {project.title}
              </button>
            </h4>
            <p className="mt-0.5 text-sm text-ink-soft">{project.subtitle}</p>
          </div>
          {/* The section already names the kind of work; the chip says how far it went. */}
          {project.badge ? <span className="stack-chip">{project.badge.label}</span> : null}
        </div>
        <p className="mt-3 text-[0.97rem] leading-relaxed text-ink">{project.solution}</p>
        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
          <p className="text-xs tracking-wide text-ink-soft">
            <span className="sr-only">Built with: </span>
            {project.stack.join(" · ")}
          </p>
          <p aria-hidden="true" className="project-open-hint">
            Details <span className="nudge-arrow">→</span>
          </p>
        </div>
      </article>
      <ProjectDialog project={project} />
    </>
  );
}
