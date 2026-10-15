import { CONTACT } from "@/content/portfolio";

interface BookFallbackProps {
  readonly bookTitle: string;
}

export function BookFallback({ bookTitle }: BookFallbackProps) {
  return (
    <div role="alert" className="border border-burgundy/30 bg-parchment-light/70 px-6 py-8">
      <p className="section-label">A page came loose</p>
      <p className="mt-2 font-display text-2xl font-medium text-ink">
        The {bookTitle} book didn&apos;t load properly.
      </p>
      <p className="mt-3 text-ink-soft">
        Refresh the page to try again, or email me at{" "}
        <a className="ink-link" href={`mailto:${CONTACT.email}`}>
          {CONTACT.email}
        </a>
        .
      </p>
    </div>
  );
}
