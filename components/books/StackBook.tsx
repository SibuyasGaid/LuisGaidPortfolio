import { CORE_STACK, STACK_GROUPS } from "@/content/portfolio";

const CATALOGUED_TOOL_COUNT = new Set(STACK_GROUPS.flatMap((group) => group.items).filter((tool) => !CORE_STACK.includes(tool))).size;

// The specimen book: each core tool set large in its own numbered cell, like a
// type specimen, with the full catalogue indexed below.
export function StackBook() {
  return (
    <div className="space-y-24">
      <section aria-labelledby="stack-core-title">
        <h2 id="stack-core-title" className="section-label">
          What I reach for first
        </h2>
        <ol className="mt-8 grid grid-cols-2 border-l border-t border-ink/15 sm:grid-cols-3 lg:grid-cols-4">
          {CORE_STACK.map((tool, index) => (
            <li
              key={tool}
              data-reveal
              className="flex aspect-[4/3] flex-col justify-between border-b border-r border-ink/15 p-4 transition-colors duration-500 ease-settle hover:bg-ink/[0.035] sm:p-5"
            >
              <span aria-hidden="true" className="eyebrow text-ink-soft">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="font-display text-[1.55rem] font-medium leading-[1.05] text-ink sm:text-[2rem] lg:text-[2.2rem]">
                {tool}
              </span>
            </li>
          ))}
          <li aria-hidden="true" className="flex aspect-[4/3] items-end border-b border-r border-ink/15 p-4 sm:p-5">
            <span className="font-display text-lg italic leading-snug text-ink-soft">
              And {CATALOGUED_TOOL_COUNT} more, catalogued below
            </span>
          </li>
        </ol>
      </section>

      <section aria-labelledby="stack-catalogue-title">
        <h2 id="stack-catalogue-title" className="section-label">
          Full catalogue
        </h2>
        <dl className="mt-4 grid gap-x-14 border-t border-ink/10 lg:grid-cols-2">
          {STACK_GROUPS.map((group) => (
            <div key={group.id} data-reveal className="grid gap-1.5 border-b border-dotted border-ink/25 py-5 sm:grid-cols-[10rem_1fr] sm:gap-6">
              <dt className="eyebrow text-[color:var(--book-accent)]">{group.title}</dt>
              <dd className="leading-relaxed text-ink">{group.items.join(" · ")}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
