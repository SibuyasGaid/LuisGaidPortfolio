import { CORE_STACK, STACK_GROUPS } from "@/content/portfolio";

export function StackChapter() {
  return (
    <div className="space-y-20">
      <section aria-labelledby="stack-core-title">
        <h2 id="stack-core-title" className="small-caps-label">
          What I reach for first
        </h2>
        <ul className="specimen-list mt-6 flex flex-wrap items-baseline gap-y-1 font-display text-[1.7rem] font-semibold leading-[1.45] text-ink sm:text-[2.05rem]">
          {CORE_STACK.map((tool) => (
            <li key={tool} data-reveal className="whitespace-nowrap">
              {tool}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="stack-catalogue-title">
        <h2 id="stack-catalogue-title" className="small-caps-label">
          Full catalogue
        </h2>
        <dl className="mt-5 border-t border-ink/12">
          {STACK_GROUPS.map((group) => (
            <div key={group.id} data-reveal className="grid gap-1.5 border-b border-dotted border-ink/25 py-5 sm:grid-cols-[11rem_1fr] sm:gap-6">
              <dt className="small-caps text-[0.78rem] tracking-[0.1em] text-burgundy">{group.title}</dt>
              <dd className="leading-relaxed text-ink">{group.items.join(" · ")}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
