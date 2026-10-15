import Link from "next/link";
import { SERVICES } from "@/content/portfolio";
import { getProject } from "@/lib/projects";

function formatEntryNumber(index: number): string {
  return String(index + 1).padStart(2, "0");
}

// The field guide: numbered entries, each with what you get and a boxed set of
// field notes naming the tools and where the work can be seen.
export function ServicesBook() {
  return (
    <ol className="space-y-16">
      {SERVICES.map((service, index) => (
        <li key={service.id} id={service.id} data-reveal className="scroll-mt-28">
          <h2 className="flex items-end gap-5 border-b border-ink/15 pb-4 font-display text-[1.9rem] font-medium leading-[1.05] text-ink sm:text-[2.3rem]">
            <span aria-hidden="true" className="text-[3.25rem] leading-[0.8] text-[color:var(--book-accent)] sm:text-[4rem]">
              {formatEntryNumber(index)}
            </span>
            {service.title}
          </h2>
          <p className="body-copy mt-5">{service.summary}</p>

          <h3 className="section-label mt-7">What you get</h3>
          <ul className="diamond-list mt-3 space-y-2 leading-relaxed text-ink">
            {service.deliverables.map((deliverable) => (
              <li key={deliverable}>{deliverable}</li>
            ))}
          </ul>

          <div className="field-notes mt-8">
            <p aria-hidden="true" className="eyebrow text-[color:var(--book-accent)]">
              Field notes
            </p>
            <dl className="mt-3 space-y-4 text-[0.95rem]">
              <div>
                <dt className="eyebrow text-ink-soft">Tools</dt>
                <dd className="mt-2 flex flex-wrap gap-1.5">
                  {service.tools.map((tool) => (
                    <span key={tool} className="stack-chip">
                      {tool}
                    </span>
                  ))}
                </dd>
              </div>
              <div>
                <dt className="eyebrow text-ink-soft">See it in</dt>
                <dd className="mt-2">
                  <ul className="flex flex-wrap gap-x-5 gap-y-1.5">
                    {service.proofProjectIds.map((projectId) => (
                      <li key={projectId}>
                        <Link href={`/work#${projectId}`} className="ink-link font-medium">
                          {getProject(projectId).title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            </dl>
          </div>
        </li>
      ))}
    </ol>
  );
}
