import { ArchiveEntry } from "@/components/chapters/ArchiveEntry";
import { ManuscriptCard } from "@/components/chapters/ManuscriptCard";
import { ARCHIVED_PROJECTS, FEATURED_PROJECTS } from "@/lib/projects";

export function WorkChapter() {
  return (
    <div className="space-y-20">
      <section aria-labelledby="work-featured-title">
        <h2 id="work-featured-title" className="small-caps-label">
          Featured
        </h2>
        <ol className="mt-6 space-y-10">
          {FEATURED_PROJECTS.map((project, index) => (
            <li key={project.id}>
              <ManuscriptCard project={project} number={index + 1} />
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="work-archive-title">
        <h2 id="work-archive-title" className="small-caps-label">
          From the archive
        </h2>
        <ul className="mt-4 divide-y divide-ink/12 border-y border-ink/12">
          {ARCHIVED_PROJECTS.map((project) => (
            <li key={project.id}>
              <ArchiveEntry project={project} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
