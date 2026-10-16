import { getProjectDialogId, ProjectDialog } from "@/components/books/ProjectDialog";
import { ProjectPlate } from "@/components/books/plate/ProjectPlate";
import { PROJECT_CATEGORY_LABELS, type Project } from "@/content/portfolio";

interface ProjectCardProps {
  readonly project: Project;
  readonly plateNumber: number;
  /** On wide screens plates alternate sides down the page, like a monograph. */
  readonly isPlateOnRight: boolean;
}

export function ProjectCard({ project, plateNumber, isPlateOnRight }: ProjectCardProps) {
  const titleId = `${project.id}-title`;
  const metaLabels = [PROJECT_CATEGORY_LABELS[project.category], project.badge?.label].filter(Boolean);
  const plateCorners = isPlateOnRight ? "lg:order-2 lg:rounded-r-[calc(1rem-1px)]" : "lg:rounded-l-[calc(1rem-1px)]";

  // The reveal animates the wrapper so its transforms never fight the card's
  // hover lift. The dialog sits outside the card, so hovering it can't lift the card.
  return (
    <>
      <div data-reveal="sheet">
        <article
          id={project.id}
          aria-labelledby={titleId}
          className="project-entry paper-card lift-on-hover grid scroll-mt-28 lg:grid-cols-[1.15fr_1fr]"
        >
          <div className={`overflow-hidden rounded-t-[calc(1rem-1px)] lg:rounded-none ${plateCorners}`}>
            <ProjectPlate project={project} plateNumber={plateNumber} />
          </div>
          <div className="px-6 pb-7 pt-6 sm:px-8 sm:pb-8 sm:pt-7 lg:px-10 lg:py-10">
            <p className="section-label">{metaLabels.join("  ·  ")}</p>
            <h3 id={titleId} className="mt-3 font-display text-[1.95rem] font-medium leading-[1.08] tracking-[-0.01em] text-ink sm:text-[2.25rem]">
              <button
                type="button"
                commandfor={getProjectDialogId(project)}
                command="show-modal"
                aria-haspopup="dialog"
                className="project-open"
              >
                {project.title}
              </button>
            </h3>
            <p className="mt-1.5 font-display text-lg italic text-ink-soft">{project.subtitle}</p>

            <dl className="mt-6 space-y-5">
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

            <ul aria-label="Built with" className="mt-6 flex flex-wrap gap-1.5">
              {project.stack.map((tool) => (
                <li key={tool} className="stack-chip">
                  {tool}
                </li>
              ))}
            </ul>

            {/* The title is the button; this only shows the whole card opens. */}
            <p aria-hidden="true" className="project-open-hint mt-7">
              Features and details <span className="nudge-arrow">→</span>
            </p>
          </div>
        </article>
      </div>
      <ProjectDialog project={project} />
    </>
  );
}
