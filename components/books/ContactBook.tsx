import { ContactForm } from "@/components/books/ContactForm";
import { BrassRule } from "@/components/ornaments/BrassRule";
import { Monogram } from "@/components/ornaments/Monogram";
import { WaxSeal } from "@/components/ornaments/WaxSeal";
import { CONTACT, PROFILE } from "@/content/portfolio";

function getExternalLinkProps(href: string) {
  return href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {};
}

// Correspondence: the letter and its reply form, with a calling card beside it
// holding every direct line.
export function ContactBook() {
  return (
    <div className="grid items-start gap-10 lg:grid-cols-[1.45fr_1fr] lg:gap-12">
      <div data-reveal="sheet" className="paper-card letter mt-10 sm:mt-6">
        <div data-reveal="seal" className="absolute -top-10 right-4 sm:-top-12 sm:right-10">
          <WaxSeal className="size-24 sm:size-28" />
        </div>

        <p className="max-w-[30rem] pr-14 font-display text-[1.45rem] font-medium leading-snug text-ink sm:pr-20 sm:text-[2rem]">
          {CONTACT.letterOpening}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {CONTACT.bookingUrl ? (
            <a href={CONTACT.bookingUrl} className="button-primary" target="_blank" rel="noreferrer">
              Book a call
            </a>
          ) : null}
          <a href={`mailto:${CONTACT.email}`} className={CONTACT.bookingUrl ? "button-secondary" : "button-primary"}>
            Email me
          </a>
        </div>

        <BrassRule className="my-12 max-w-[9rem]" />

        <section aria-labelledby="contact-form-title">
          <h2 id="contact-form-title" className="section-label">
            Leave a note
          </h2>
          <p className="mt-2 text-ink-soft">{CONTACT.formIntroduction}</p>
          <ContactForm />
        </section>

        <p className="mt-12 text-right font-display text-[2.1rem] italic leading-none text-ink">{PROFILE.fullName}</p>
      </div>

      <aside
        aria-labelledby="contact-card-title"
        data-reveal
        className="calling-card lg:sticky lg:top-[calc(var(--spacing-masthead)+2.5rem)] lg:mt-6"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 id="contact-card-title" className="eyebrow text-brass-light">
            Direct lines
          </h2>
          <Monogram className="size-11 text-brass-light" />
        </div>
        <p className="mt-6 font-display text-[2rem] font-medium leading-none text-parchment-light">{PROFILE.fullName}</p>
        <p className="eyebrow mt-3 text-smoke">{PROFILE.headline}</p>

        <dl className="mt-8 border-t border-parchment/15">
          {CONTACT.channels.map((channel) => (
            <div key={channel.kind} className="grid gap-1 border-b border-parchment/15 py-3.5">
              <dt className="eyebrow text-smoke">{channel.label}</dt>
              <dd className="min-w-0">
                <a href={channel.href} className="card-link break-words" {...getExternalLinkProps(channel.href)}>
                  {channel.display}
                </a>
              </dd>
            </div>
          ))}
        </dl>
      </aside>
    </div>
  );
}
