import Link from "next/link";
import { AuthorPortrait } from "@/components/books/AuthorPortrait";
import { Medallion } from "@/components/ornaments/Medallion";
import { ABOUT_FACTS, ABOUT_PARAGRAPHS, AWARDS, type Award } from "@/content/portfolio";
import { getProject } from "@/lib/projects";

function formatAwardYears(award: Award): string {
  return award.endYear ? `${award.startYear} to ${award.endYear}` : String(award.startYear);
}

export function AboutBook() {
  return (
    <div className="space-y-16">
      <AuthorPortrait />

      <div className="body-copy max-w-[38rem]">
        {ABOUT_PARAGRAPHS.map((paragraph) => (
          <p key={paragraph} data-reveal>
            {paragraph}
          </p>
        ))}
      </div>

      <section aria-labelledby="about-facts-title">
        <h2 id="about-facts-title" className="section-label">
          At a glance
        </h2>
        <dl className="mt-5 border-t border-ink/12">
          {ABOUT_FACTS.map((fact) => (
            <div key={fact.label} data-reveal className="grid gap-1 border-b border-ink/12 py-4 sm:grid-cols-[9rem_1fr] sm:gap-6">
              <dt className="eyebrow text-ink-soft">{fact.label}</dt>
              <dd className="text-ink">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="about-recognition-title">
        <h2 id="about-recognition-title" className="section-label">
          Recognition
        </h2>
        <ol className="mt-7 space-y-9">
          {AWARDS.map((award) => (
            <li key={award.id} data-reveal className="grid grid-cols-[2.75rem_1fr] gap-5">
              <Medallion className="mt-1 size-11 text-brass" />
              <div>
                <h3 className="font-display text-[1.6rem] font-medium leading-tight text-ink">{award.title}</h3>
                <p className="mt-1 font-display text-lg italic text-ink-soft">
                  {award.context}, {formatAwardYears(award)}
                </p>
                <p className="mt-2 leading-relaxed text-ink">{award.summary}</p>
                {award.relatedProjectId ? (
                  <Link href={`/work#${award.relatedProjectId}`} className="ink-link mt-2 inline-block text-sm font-medium">
                    Read about {getProject(award.relatedProjectId).title}
                  </Link>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
