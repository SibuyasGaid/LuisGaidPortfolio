import { ProjectFigure } from "@/components/chapters/ProjectFigure";
import { PROJECT_CATEGORY_LABELS, type Project } from "@/content/portfolio";

interface ManuscriptCardProps {
  readonly project: Project;
  readonly number: number;
}

export function ManuscriptCard({ project, number }: ManuscriptCardProps) {
  const titleId = `${project.id}-title`;
  const metaLabels = [PROJECT_CATEGORY_LABELS[project.category], project.badge?.label].filter(Boolean);

  return (
    <article id={project.id} aria-labelledby={titleId} data-reveal="sheet" className="manuscript scroll-mt-28">
      <header>
        <p className="small-caps text-[0.72rem] tracking-[0.14em] text-burgundy">
          No. {String(number).padStart(2, "0")}
          <span aria-hidden="true" className="mx-2 text-brass">
            ·
          </span>
          {metaLabels.join(", ")}
        </p>
        <h3 id={titleId} className="mt-3 font-display text-[1.85rem] font-semibold leading-[1.1] text-ink sm:text-[2.1rem]">
          {project.outcome ?? project.title}
        </h3>
        <p className="mt-2 font-display text-lg italic text-ink-soft">
          {project.outcome ? `${project.title}, ` : ""}
          {project.subtitle}
          {project.client ? ` for ${project.client}` : ""}
        </p>
      </header>

      {project.image ? (
        <div className="mt-6">
          <ProjectFigure image={project.image} />
        </div>
      ) : null}

      <dl className="mt-6 space-y-5">
        {project.problem ? (
          <div>
            <dt className="small-caps-label">The problem</dt>
            <dd className="mt-1.5 leading-relaxed text-ink">{project.problem}</dd>
          </div>
        ) : null}
        <div>
          <dt className="small-caps-label">What I built</dt>
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

      {project.links.length > 0 ? (
        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-ink/12 pt-4">
          {project.links.map((link) => (
            <li key={link.href}>
              <a href={link.href} className="ink-link text-sm font-semibold" target="_blank" rel="noreferrer">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
