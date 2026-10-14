export interface ContactMessage {
  readonly name: string;
  readonly email: string;
  readonly message: string;
}

export type ContactField = keyof ContactMessage;

export type ContactFieldErrors = Partial<Record<ContactField, string>>;

export type ContactResponse =
  | { readonly status: "sent" }
  | { readonly status: "invalid"; readonly errors: ContactFieldErrors }
  | { readonly status: "unavailable" }
  | { readonly status: "failed" };

type ContactValidation =
  | { readonly isValid: true; readonly message: ContactMessage }
  | { readonly isValid: false; readonly errors: ContactFieldErrors };

/** Bots fill every field; people never see this one. */
export const HONEYPOT_FIELD_NAME = "website";

const NAME_MAX_LENGTH = 100;
const EMAIL_MAX_LENGTH = 254;
const MESSAGE_MIN_LENGTH = 20;
const MESSAGE_MAX_LENGTH = 5000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readTextField(input: Record<string, unknown>, fieldName: string): string {
  const value = input[fieldName];
  return typeof value === "string" ? value.trim() : "";
}

function findNameError(name: string): string | null {
  if (!name) return "Please tell me your name.";
  if (name.length > NAME_MAX_LENGTH) return `Keep your name under ${NAME_MAX_LENGTH} characters.`;
  return null;
}

function findEmailError(email: string): string | null {
  if (!email) return "I need an email address to reply to.";
  if (email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email)) return "That email address doesn't look right.";
  return null;
}

function findMessageError(message: string): string | null {
  if (!message) return "Tell me a little about what you need.";
  if (message.length < MESSAGE_MIN_LENGTH) return `A bit more detail helps. Aim for at least ${MESSAGE_MIN_LENGTH} characters.`;
  if (message.length > MESSAGE_MAX_LENGTH) return `Keep it under ${MESSAGE_MAX_LENGTH} characters, or email me directly.`;
  return null;
}

// Shared by the form and the API route so both sides always agree on what is valid.
export function validateContactMessage(input: Record<string, unknown>): ContactValidation {
  const message: ContactMessage = {
    name: readTextField(input, "name"),
    email: readTextField(input, "email"),
    message: readTextField(input, "message"),
  };
  const candidateErrors: Record<ContactField, string | null> = {
    name: findNameError(message.name),
    email: findEmailError(message.email),
    message: findMessageError(message.message),
  };
  const errors: ContactFieldErrors = Object.fromEntries(
    Object.entries(candidateErrors).filter((entry): entry is [ContactField, string] => entry[1] !== null),
  );
  return Object.keys(errors).length > 0 ? { isValid: false, errors } : { isValid: true, message };
}

export function isSpamSubmission(input: Record<string, unknown>): boolean {
  return readTextField(input, HONEYPOT_FIELD_NAME).length > 0;
}
