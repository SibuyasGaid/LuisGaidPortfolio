"use client";

import { useEffect } from "react";
import { BookSpread } from "@/components/book/BookSpread";
import { CONTACT } from "@/content/portfolio";
import { reportError } from "@/lib/reportError";

interface RouteErrorProps {
  readonly error: Error & { digest?: string };
  readonly retry: () => void;
}

export default function RouteError({ error, retry }: RouteErrorProps) {
  useEffect(() => {
    reportError(error);
  }, [error]);

  return (
    <BookSpread
      leftPage={
        <header>
          <p className="section-label">Something went wrong</p>
          <h1 className="mt-3 font-display text-[clamp(2.6rem,2rem+3vw,4.25rem)] font-medium leading-[1] text-ink">
            A page came loose.
          </h1>
        </header>
      }
      rightPage={
        <div className="flex flex-col items-start gap-6">
          <p className="body-copy">
            Try loading it again. If it keeps happening, email me at{" "}
            <a className="ink-link" href={`mailto:${CONTACT.email}`}>
              {CONTACT.email}
            </a>
            .
          </p>
          <button type="button" onClick={() => retry()} className="button-primary">
            Try again
          </button>
        </div>
      }
    />
  );
}
