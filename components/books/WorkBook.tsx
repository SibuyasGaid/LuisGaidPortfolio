import { ArchiveEntry } from "@/components/books/ArchiveEntry";
import { ProjectCard } from "@/components/books/ProjectCard";
import { ARCHIVED_PROJECTS, FEATURED_PROJECTS } from "@/lib/projects";

// The monograph: full-width plates that alternate sides, then a two-column archive.
export function WorkBook() {
  return (
    <div className="space-y-24">
      <section aria-labelledby="work-featured-title">
        <h2 id="work-featured-title" className="section-label">
          Featured plates
        </h2>
        <ol className="mt-8 space-y-12">
          {FEATURED_PROJECTS.map((project, index) => (
            <li key={project.id}>
              <ProjectCard project={project} plateNumber={index + 1} isPlateOnRight={index % 2 === 1} />
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="work-archive-title">
        <h2 id="work-archive-title" className="section-label">
          From the archive
        </h2>
        <ul className="mt-4 grid gap-x-14 border-t border-ink/10 lg:grid-cols-2">
          {ARCHIVED_PROJECTS.map((project) => (
            <li key={project.id} className="border-b border-ink/10">
              <ArchiveEntry project={project} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
