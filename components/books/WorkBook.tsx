import { ArchiveEntry } from "@/components/books/ArchiveEntry";
import { ProjectCard } from "@/components/books/ProjectCard";
import { ProjectDialogFallback } from "@/components/books/ProjectDialogFallback";
import { PROJECT_CATEGORY_LABELS, WORK_NOTE } from "@/content/portfolio";
import { ARCHIVE_SHELVES, FEATURED_PROJECTS } from "@/lib/projects";

// The monograph: full-width plates that alternate sides, then the archive in
// two columns, a section for each kind of work. Every project opens a dialog
// with its full details.
export function WorkBook() {
  return (
    <div className="space-y-24">
      <section aria-labelledby="work-featured-title">
        {/* Why the book holds fewer projects than I've built, and why most have no link. */}
        <aside aria-labelledby="work-note-title" className="field-notes mb-14 max-w-[46rem]">
          <h2 id="work-note-title" className="eyebrow text-[color:var(--book-accent)]">
            {WORK_NOTE.title}
          </h2>
          <div className="mt-2.5 space-y-2 text-[0.97rem] leading-relaxed text-ink">
            {WORK_NOTE.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </aside>
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
        <div className="mt-6 space-y-14">
          {ARCHIVE_SHELVES.map(({ category, projects }) => (
            <section key={category} aria-labelledby={`work-archive-${category}`}>
              <h3 id={`work-archive-${category}`} className="font-display text-[1.6rem] font-medium italic text-ink-soft">
                {PROJECT_CATEGORY_LABELS[category]}
              </h3>
              <ul className="mt-3 grid gap-x-14 border-t border-ink/10 lg:grid-cols-2">
                {projects.map((project) => (
                  <li key={project.id} className="border-b border-ink/10">
                    <ArchiveEntry project={project} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </section>
      <ProjectDialogFallback />
    </div>
  );
}
