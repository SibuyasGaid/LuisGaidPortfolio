import { EDUCATION, ROLES } from "@/content/portfolio";
import { formatYearMonth } from "@/lib/dates";

// The ledger: one row per entry, dates in the left column and the record on
// the right, with the column rule drawing itself down the page on scroll.
export function ExperienceBook() {
  return (
    <div className="space-y-16">
      <section aria-labelledby="experience-roles-title">
        <h2 id="experience-roles-title" className="section-label">
          Roles
        </h2>
        <div className="relative mt-5 border-t border-ink/20">
          <span
            data-scroll-line
            aria-hidden="true"
            className="absolute inset-y-0 left-[7.5rem] hidden w-px origin-top bg-[color:var(--book-accent)]/35 sm:block"
          />
          <ol>
            {ROLES.map((role) => (
              <li
                key={role.id}
                data-reveal
                className="grid gap-2 border-b border-ink/12 py-7 sm:grid-cols-[7.5rem_1fr] sm:gap-0"
              >
                <p className="eyebrow text-[color:var(--book-accent)] sm:pr-5 sm:pt-2.5 sm:leading-relaxed">
                  <time dateTime={role.start}>{formatYearMonth(role.start)}</time>
                  <span className="text-ink-soft"> to </span>
                  <span className="sm:block">
                    {role.end ? <time dateTime={role.end}>{formatYearMonth(role.end)}</time> : "Present"}
                  </span>
                </p>
                <div className="sm:pl-7">
                  <h3 className="font-display text-[1.7rem] font-medium leading-tight text-ink">{role.title}</h3>
                  <p className="font-display text-lg italic text-ink-soft">{role.organization}</p>
                  <p className="mt-3 leading-relaxed text-ink">{role.summary}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="experience-education-title">
        <h2 id="experience-education-title" className="section-label">
          Education
        </h2>
        <div data-reveal className="mt-5 grid gap-2 border-y border-ink/20 py-7 sm:grid-cols-[7.5rem_1fr] sm:gap-0">
          <p className="eyebrow text-[color:var(--book-accent)] sm:pr-5 sm:pt-2.5">
            {EDUCATION.startYear} to {EDUCATION.endYear}
          </p>
          <div className="sm:pl-7">
            <h3 className="font-display text-[1.7rem] font-medium leading-tight text-ink">{EDUCATION.degree}</h3>
            <p className="font-display text-lg italic text-ink-soft">{EDUCATION.institution}</p>
            <p className="mt-3 leading-relaxed text-ink">{EDUCATION.summary}</p>
            <figure className="mt-6 rounded-xl bg-[color:var(--book-accent)]/[0.06] px-5 py-4">
              <figcaption className="section-label">Thesis</figcaption>
              <p className="mt-2 font-display text-[1.2rem] italic leading-snug text-ink">
                <cite>{EDUCATION.thesis}</cite>
              </p>
            </figure>
          </div>
        </div>
      </section>
    </div>
  );
}
