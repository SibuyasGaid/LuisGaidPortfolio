import Link from "next/link";
import { SERVICES, type Service } from "@/content/portfolio";
import { getProject } from "@/lib/projects";

const CORE_SERVICES = SERVICES.filter((service) => service.isCore);
const OTHER_SERVICES = SERVICES.filter((service) => !service.isCore);

function formatEntryNumber(index: number): string {
  return String(index + 1).padStart(2, "0");
}

interface ServiceEntryProps {
  readonly service: Service;
  /** Its place in the book, counted across both sections. */
  readonly index: number;
}

// One numbered entry: what the service is, what you get, and a boxed set of
// field notes naming the tools and where the work can be seen. A core service
// is set out on its own card, with a larger heading.
function ServiceEntry({ service, index }: ServiceEntryProps) {
  return (
    <div className={service.isCore ? "paper-card service-core" : undefined}>
      <h3
        className={`flex items-end gap-5 border-b border-ink/15 pb-4 font-display font-medium leading-[1.05] text-ink ${
          service.isCore ? "text-[2.1rem] sm:text-[2.6rem]" : "text-[1.9rem] sm:text-[2.3rem]"
        }`}
      >
        <span
          aria-hidden="true"
          className={`leading-[0.8] text-[color:var(--book-accent)] ${service.isCore ? "text-[3.6rem] sm:text-[4.5rem]" : "text-[3.25rem] sm:text-[4rem]"}`}
        >
          {formatEntryNumber(index)}
        </span>
        {service.title}
      </h3>
      <p className={service.isCore ? "body-copy mt-5 text-[1.125rem]" : "body-copy mt-5"}>{service.summary}</p>

      <h4 className="section-label mt-7">What you get</h4>
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
    </div>
  );
}

// The field guide: the core services first, each on its own card, then the
// rest of what I do, numbered on from them.
export function ServicesBook() {
  return (
    <div className="space-y-20">
      <section aria-labelledby="services-core-title">
        <h2 id="services-core-title" className="section-label">
          Core services
        </h2>
        <ol className="mt-6 space-y-10">
          {CORE_SERVICES.map((service, index) => (
            <li key={service.id} id={service.id} data-reveal className="scroll-mt-28">
              <ServiceEntry service={service} index={index} />
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="services-more-title">
        <h2 id="services-more-title" className="section-label">
          Also on hand
        </h2>
        <ol start={CORE_SERVICES.length + 1} className="mt-8 space-y-16">
          {OTHER_SERVICES.map((service, index) => (
            <li key={service.id} id={service.id} data-reveal className="scroll-mt-28">
              <ServiceEntry service={service} index={CORE_SERVICES.length + index} />
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
