import { ContactForm } from "@/components/chapters/ContactForm";
import { BrassRule } from "@/components/ornaments/BrassRule";
import { WaxSeal } from "@/components/ornaments/WaxSeal";
import { CONTACT, PROFILE } from "@/content/portfolio";

export function ContactChapter() {
  return (
    <div data-reveal="sheet" className="letter mt-10 sm:mt-6">
      <div data-reveal="seal" className="absolute -top-10 right-4 sm:-top-12 sm:right-10">
        <WaxSeal className="size-24 sm:size-28" />
      </div>

      <p className="max-w-[30rem] pr-16 font-display text-[1.65rem] leading-snug text-ink sm:pr-20 sm:text-[1.9rem]">
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

      <BrassRule className="my-12" />

      <section aria-labelledby="contact-form-title">
        <h2 id="contact-form-title" className="small-caps-label">
          Leave a note
        </h2>
        <p className="mt-2 text-ink-soft">{CONTACT.formIntroduction}</p>
        <ContactForm />
      </section>

      <BrassRule className="my-12" />

      <section aria-labelledby="contact-channels-title">
        <h2 id="contact-channels-title" className="small-caps-label">
          Find me elsewhere
        </h2>
        <dl className="mt-4 border-t border-ink/12">
          {CONTACT.channels.map((channel) => (
            <div key={channel.kind} className="grid gap-1 border-b border-ink/12 py-3.5 sm:grid-cols-[7rem_1fr] sm:gap-4">
              <dt className="font-caps text-[1.02rem] lowercase tracking-[0.1em] text-ink-soft">{channel.label}</dt>
              <dd className="min-w-0">
                <a
                  href={channel.href}
                  className="ink-link break-words font-medium"
                  {...(channel.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
                >
                  {channel.display}
                </a>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mt-12 text-right">
        <p className="font-display text-[2rem] italic leading-none text-ink">{PROFILE.fullName}</p>
        <p className="mt-2 font-caps text-[0.95rem] lowercase tracking-[0.12em] text-ink-soft">{PROFILE.headline}</p>
      </div>
    </div>
  );
}
