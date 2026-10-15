import { ProjectPlate } from "@/components/chapters/plate/ProjectPlate";
import { PROJECT_CATEGORY_LABELS, type Project } from "@/content/portfolio";

interface ProjectCardProps {
  readonly project: Project;
  readonly plateNumber: number;
}

export function ProjectCard({ project, plateNumber }: ProjectCardProps) {
  const titleId = `${project.id}-title`;
  const metaLabels = [PROJECT_CATEGORY_LABELS[project.category], project.badge?.label].filter(Boolean);

  // The reveal animates the wrapper so its transforms never fight the card's hover lift.
  return (
    <div data-reveal="sheet">
      <article id={project.id} aria-labelledby={titleId} className="paper-card lift-on-hover scroll-mt-28">
        <div className="overflow-hidden rounded-t-[calc(1rem-1px)]">
          <ProjectPlate project={project} plateNumber={plateNumber} />
        </div>
        <div className="px-6 pb-7 pt-6 sm:px-8 sm:pb-8 sm:pt-7">
          <p className="section-label">{metaLabels.join("  ·  ")}</p>
          <h3 id={titleId} className="mt-3 font-display text-[1.95rem] font-medium leading-[1.08] tracking-[-0.01em] text-ink sm:text-[2.25rem]">
            {project.title}
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
        </div>
      </article>
    </div>
  );
}
