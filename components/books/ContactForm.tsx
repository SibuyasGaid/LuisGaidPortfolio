"use client";

import { useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { CONTACT } from "@/content/portfolio";
import {
  HONEYPOT_FIELD_NAME,
  validateContactMessage,
  type ContactField,
  type ContactFieldErrors,
  type ContactResponse,
} from "@/lib/contact/contactMessage";
import { playCue } from "@/lib/sound/sound";

type FormStatus = "idle" | "sending" | "sent" | "network-error" | "failed" | "unavailable";

const FIELD_ORDER: readonly ContactField[] = ["name", "email", "message"];
const RESPONSE_STATUSES = new Set(["sent", "invalid", "unavailable", "failed"]);

function subscribeToNothing(): () => void {
  return () => {};
}

// False during server rendering, so the form stays disabled (with a note) for
// visitors whose JavaScript never runs.
function useIsHydrated(): boolean {
  return useSyncExternalStore(subscribeToNothing, () => true, () => false);
}

function isContactResponse(value: unknown): value is ContactResponse {
  return typeof value === "object" && value !== null && "status" in value && RESPONSE_STATUSES.has(String(value.status));
}

async function postContactMessage(input: Record<string, unknown>): Promise<ContactResponse | "network-error"> {
  let response: Response;
  try {
    response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    return "network-error";
  }
  try {
    const body: unknown = await response.json();
    return isContactResponse(body) ? body : { status: "failed" };
  } catch {
    return { status: "failed" };
  }
}

function focusFirstInvalidField(form: HTMLFormElement, errors: ContactFieldErrors): void {
  const firstInvalidField = FIELD_ORDER.find((field) => errors[field]);
  if (!firstInvalidField) return;
  const element = form.elements.namedItem(firstInvalidField);
  if (element instanceof HTMLElement) element.focus();
}

export function ContactForm() {
  const isHydrated = useIsHydrated();
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<FormStatus>("idle");
  const [fieldErrors, setFieldErrors] = useState<ContactFieldErrors>({});
  const [senderName, setSenderName] = useState("");

  function clearFieldError(field: ContactField): void {
    if (!fieldErrors[field]) return;
    setFieldErrors((errors) => ({ ...errors, [field]: undefined }));
  }

  async function submitMessage(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget;
    const input = Object.fromEntries(new FormData(form));
    const validation = validateContactMessage(input);
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      focusFirstInvalidField(form, validation.errors);
      return;
    }

    setFieldErrors({});
    setStatus("sending");
    const result = await postContactMessage(input);
    if (result === "network-error") {
      setStatus("network-error");
      return;
    }
    if (result.status === "invalid") {
      setFieldErrors(result.errors);
      setStatus("idle");
      focusFirstInvalidField(form, result.errors);
      return;
    }
    if (result.status === "sent") {
      setSenderName(validation.message.name);
      form.reset();
      playCue("letterSent");
    }
    setStatus(result.status);
  }

  const isSending = status === "sending";

  return (
    <div className="mt-6">
      <div role="status" aria-live="polite">
        {status === "sent" ? (
          <div className="rounded-xl border border-brass/40 bg-white/50 px-5 py-4">
            <p className="font-display text-2xl font-medium text-ink">Thank you, {senderName}.</p>
            <p className="mt-1 text-ink-soft">Your note is on its way. I&apos;ll reply by email.</p>
            <button type="button" onClick={() => setStatus("idle")} className="ink-link mt-3 text-sm font-semibold">
              Send another note
            </button>
          </div>
        ) : null}
      </div>

      {status !== "sent" ? (
        <form ref={formRef} noValidate onSubmit={submitMessage} aria-label="Leave a note">
          <noscript>
            <p className="mb-5 text-ink-soft">
              This form needs JavaScript. Email me at{" "}
              <a className="ink-link" href={`mailto:${CONTACT.email}`}>
                {CONTACT.email}
              </a>{" "}
              instead.
            </p>
          </noscript>
          <fieldset disabled={!isHydrated || isSending} className="space-y-6">
            <TextField name="name" label="Your name" autoComplete="name" error={fieldErrors.name} onEdit={clearFieldError} />
            <TextField
              name="email"
              label="Your email"
              type="email"
              autoComplete="email"
              error={fieldErrors.email}
              onEdit={clearFieldError}
            />
            <TextField name="message" label="What do you need?" isMultiline error={fieldErrors.message} onEdit={clearFieldError} />

            <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
              <label htmlFor="contact-website">Website</label>
              <input id="contact-website" name={HONEYPOT_FIELD_NAME} type="text" tabIndex={-1} autoComplete="off" />
            </div>

            {status === "network-error" || status === "failed" || status === "unavailable" ? (
              <SubmissionProblem status={status} onRetry={() => formRef.current?.requestSubmit()} />
            ) : null}

            <button type="submit" className="button-primary disabled:cursor-not-allowed disabled:opacity-70">
              {isSending ? "Sending…" : "Send note"}
            </button>
          </fieldset>
        </form>
      ) : null}
    </div>
  );
}

interface TextFieldProps {
  readonly name: ContactField;
  readonly label: string;
  readonly type?: "text" | "email";
  readonly autoComplete?: string;
  readonly isMultiline?: boolean;
  readonly error: string | undefined;
  readonly onEdit: (field: ContactField) => void;
}

function TextField({ name, label, type = "text", autoComplete, isMultiline = false, error, onEdit }: TextFieldProps) {
  const inputId = `contact-${name}`;
  const errorId = `${inputId}-error`;
  const sharedProps = {
    id: inputId,
    name,
    required: true,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? errorId : undefined,
    onInput: () => onEdit(name),
    className:
      "mt-2 block w-full rounded-xl border border-ink/15 bg-white/55 px-4 py-3 text-base text-ink transition-colors duration-300 ease-settle hover:border-ink/30 focus:border-burgundy focus:bg-white/80 aria-[invalid=true]:border-burgundy",
  };

  return (
    <div>
      <label htmlFor={inputId} className="section-label">
        {label}
      </label>
      {isMultiline ? (
        <textarea rows={5} {...sharedProps} className={`${sharedProps.className} resize-y leading-relaxed`} />
      ) : (
        <input type={type} autoComplete={autoComplete} {...sharedProps} />
      )}
      {error ? (
        <p id={errorId} className="mt-2 text-sm font-medium text-burgundy">
          {error}
        </p>
      ) : null}
    </div>
  );
}

interface SubmissionProblemProps {
  readonly status: "network-error" | "failed" | "unavailable";
  readonly onRetry: () => void;
}

function SubmissionProblem({ status, onRetry }: SubmissionProblemProps) {
  const emailLink = (
    <a className="ink-link" href={`mailto:${CONTACT.email}`}>
      {CONTACT.email}
    </a>
  );
  const isRetryable = status !== "unavailable";

  return (
    <div role="alert" className="rounded-xl border border-burgundy/30 bg-burgundy/[0.05] px-4 py-3 text-[0.95rem] text-ink">
      {status === "network-error" ? <p>I couldn&apos;t reach the server. Check your connection and try again.</p> : null}
      {status === "failed" ? <p>Your note didn&apos;t send. Try again, or email me at {emailLink}.</p> : null}
      {status === "unavailable" ? <p>The form isn&apos;t connected yet. Please email me at {emailLink}.</p> : null}
      {isRetryable ? (
        <button type="button" onClick={onRetry} className="ink-link mt-2 text-sm font-semibold">
          Try again
        </button>
      ) : null}
    </div>
  );
}
