import Link from "next/link";
import { Fragment } from "react";
import { Fleuron } from "@/components/ornaments/Fleuron";
import { SERVICES } from "@/content/portfolio";
import { getProject } from "@/lib/projects";

export function ServicesChapter() {
  return (
    <ol className="services-list space-y-14">
      {SERVICES.map((service, index) => (
        <li key={service.id} id={service.id} data-reveal className="scroll-mt-28">
          {index > 0 ? <Fleuron className="mb-14 h-4 w-24 text-brass/60" /> : null}
          <h2 className="flex items-baseline gap-4 font-display text-[2rem] font-medium leading-tight text-ink sm:text-[2.3rem]">
            <span aria-hidden="true" className="service-numeral font-display text-[1.4rem] italic text-burgundy" />
            {service.title}
          </h2>
          <p className="body-copy mt-4 max-w-[38rem]">{service.summary}</p>

          <h3 className="section-label mt-7">What you get</h3>
          <ul className="diamond-list mt-3 space-y-2 leading-relaxed text-ink">
            {service.deliverables.map((deliverable) => (
              <li key={deliverable}>{deliverable}</li>
            ))}
          </ul>

          <dl className="mt-7 space-y-3 border-t border-ink/12 pt-5 text-[0.95rem]">
            <div className="grid gap-1 sm:grid-cols-[7rem_1fr] sm:gap-4">
              <dt className="eyebrow text-ink-soft">Tools</dt>
              <dd className="text-ink">{service.tools.join(" · ")}</dd>
            </div>
            <div className="grid gap-1 sm:grid-cols-[7rem_1fr] sm:gap-4">
              <dt className="eyebrow text-ink-soft">See it in</dt>
              <dd>
                {service.proofProjectIds.map((projectId, proofIndex) => (
                  <Fragment key={projectId}>
                    {proofIndex > 0 ? ", " : null}
                    <Link href={`/work#${projectId}`} className="ink-link font-medium">
                      {getProject(projectId).title}
                    </Link>
                  </Fragment>
                ))}
              </dd>
            </div>
          </dl>
        </li>
      ))}
    </ol>
  );
}
