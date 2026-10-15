import { EDUCATION, ROLES } from "@/content/portfolio";
import { formatYearMonth } from "@/lib/dates";

export function ExperienceChapter() {
  return (
    <div className="space-y-20">
      <section aria-labelledby="experience-roles-title">
        <h2 id="experience-roles-title" className="section-label">
          Roles
        </h2>
        <div className="relative mt-7 pl-9">
          <span
            data-scroll-line
            aria-hidden="true"
            className="absolute bottom-3 left-[0.4rem] top-3 w-px origin-top bg-brass/70"
          />
          <ol className="space-y-12">
            {ROLES.map((role) => (
              <li key={role.id} data-reveal className="relative">
                <span aria-hidden="true" className="absolute -left-[2.05rem] top-2 size-2.5 rotate-45 border border-brass bg-parchment" />
                <p className="eyebrow text-burgundy">
                  <time dateTime={role.start}>{formatYearMonth(role.start)}</time>
                  {" to "}
                  {role.end ? <time dateTime={role.end}>{formatYearMonth(role.end)}</time> : "present"}
                </p>
                <h3 className="mt-1.5 font-display text-[1.75rem] font-medium leading-tight text-ink">{role.title}</h3>
                <p className="font-display text-lg italic text-ink-soft">{role.organization}</p>
                <p className="mt-3 max-w-[38rem] leading-relaxed text-ink">{role.summary}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="experience-education-title">
        <h2 id="experience-education-title" className="section-label">
          Education
        </h2>
        <div data-reveal className="mt-6 border-t border-ink/12 pt-6">
          <p className="eyebrow text-burgundy">
            {EDUCATION.startYear} to {EDUCATION.endYear}
          </p>
          <h3 className="mt-1.5 font-display text-[1.75rem] font-medium leading-tight text-ink">{EDUCATION.degree}</h3>
          <p className="font-display text-lg italic text-ink-soft">{EDUCATION.institution}</p>
          <p className="mt-4 max-w-[38rem] border-l-2 border-brass/60 pl-4 leading-relaxed text-ink">
            <span className="section-label mr-2">Thesis</span>
            <cite className="font-display text-[1.15rem] italic">{EDUCATION.thesis}</cite>
          </p>
          <p className="mt-4 max-w-[38rem] leading-relaxed text-ink">{EDUCATION.summary}</p>
        </div>
      </section>
    </div>
  );
}
