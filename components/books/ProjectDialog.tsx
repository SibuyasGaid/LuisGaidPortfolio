import { PROJECT_LINK_LABELS } from "@/components/books/plate/ProjectPlate";
import { PROJECT_CATEGORY_LABELS, type Project } from "@/content/portfolio";

interface ProjectDialogProps {
  readonly project: Project;
}

/** The id of a project's details dialog, for the buttons that open it. */
export function getProjectDialogId(project: Project): string {
  return `${project.id}-details`;
}

// A project's full entry, opened over the page from its card or archive
// entry. Buttons open and close it with HTML invoker commands, so it works
// before (and without) any script; a click on the backdrop or Escape closes it.
export function ProjectDialog({ project }: ProjectDialogProps) {
  const dialogId = getProjectDialogId(project);
  const titleId = `${dialogId}-title`;
  const metaLabels = [PROJECT_CATEGORY_LABELS[project.category], project.badge?.label].filter(Boolean);

  return (
    <dialog id={dialogId} aria-labelledby={titleId} closedby="any" data-lenis-prevent className="project-dialog">
      {/* No height of its own, so the close button stays in the corner while the rest scrolls under it. */}
      <div className="sticky top-0 z-10 flex h-0 justify-end">
        <button type="button" commandfor={dialogId} command="close" className="project-dialog-close">
          <span aria-hidden="true">×</span>
          <span className="sr-only">Close {project.title}</span>
        </button>
      </div>

      <header className="plate-surface relative px-7 pb-8 pt-9 sm:px-10 sm:pt-10">
        <p className="eyebrow pr-12 text-brass-light">{metaLabels.join("  ·  ")}</p>
        <h2
          id={titleId}
          className="mt-3 font-display text-[2rem] font-medium leading-[1.08] tracking-[-0.01em] text-parchment-light sm:text-[2.5rem]"
        >
          {project.title}
        </h2>
        <p className="mt-1.5 font-display text-lg italic text-parchment/85">{project.subtitle}</p>
      </header>

      <div className="px-7 pb-9 pt-7 sm:px-10 sm:pb-10 sm:pt-8">
        <dl className="space-y-5">
          {project.problem ? (
            <div>
              <dt className="eyebrow text-ink-soft">The problem</dt>
              <dd className="mt-1.5 leading-relaxed text-ink">{project.problem}</dd>
            </div>
          ) : null}
          <div>
            <dt className="eyebrow text-ink-soft">What I built</dt>
            <dd className="mt-1.5 leading-relaxed text-ink">{project.solution}</dd>
          </div>
        </dl>

        {project.features.length > 0 ? (
          <>
            <h3 className="section-label mt-8">Features</h3>
            <ul className="diamond-list mt-3 space-y-2 leading-relaxed text-ink">
              {project.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </>
        ) : null}

        {project.stack.length > 0 ? (
          <>
            <h3 className="section-label mt-8">Built with</h3>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {project.stack.map((tool) => (
                <li key={tool} className="stack-chip">
                  {tool}
                </li>
              ))}
            </ul>
          </>
        ) : null}

        {project.link ? (
          <a href={project.link.href} target="_blank" rel="noreferrer" className="button-primary mt-9">
            {PROJECT_LINK_LABELS[project.link.kind].visible}
            <span aria-hidden="true" className="nudge-arrow">
              {PROJECT_LINK_LABELS[project.link.kind].icon}
            </span>
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        ) : null}
      </div>
    </dialog>
  );
}
