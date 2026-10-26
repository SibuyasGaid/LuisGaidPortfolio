// Holds the email API key, so a build fails if this is ever imported into browser code.
import "server-only";
import { CONTACT } from "@/content/portfolio";
import type { ContactMessage } from "@/lib/contact/contactMessage";

export type DeliveryResult = "sent" | "not-configured" | "failed";

const RESEND_ENDPOINT = "https://api.resend.com/emails";
// Resend's shared test sender only delivers to the account owner's address,
// which is fine until a domain is verified and CONTACT_FROM_EMAIL is set.
const DEFAULT_SENDER = "Portfolio <onboarding@resend.dev>";
const REQUEST_TIMEOUT_MS = 10_000;

function removeLineBreaks(text: string): string {
  return text.replace(/[\r\n]+/g, " ");
}

export async function sendContactEmail(message: ContactMessage): Promise<DeliveryResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return "not-configured";

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM_EMAIL ?? DEFAULT_SENDER,
        to: [process.env.CONTACT_TO_EMAIL ?? CONTACT.email],
        reply_to: message.email,
        subject: `Portfolio enquiry from ${removeLineBreaks(message.name)}`,
        text: `${message.message}\n\n${message.name}\n${message.email}`,
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (response.ok) return "sent";
    // Server-side only: lands in the hosting logs, never in a visitor's console.
    console.error(`Contact email rejected by Resend with status ${response.status}`);
    return "failed";
  } catch (error) {
    console.error("Contact email request did not complete:", error instanceof Error ? error.name : "unknown error");
    return "failed";
  }
}
