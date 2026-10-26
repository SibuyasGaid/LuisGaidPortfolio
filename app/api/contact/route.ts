import {
  isSpamSubmission,
  validateContactMessage,
  type ContactResponse,
} from "@/lib/contact/contactMessage";
import { sendContactEmail } from "@/lib/contact/sendContactEmail";
import { findSenderAddress, takeSendingTurn } from "@/lib/contact/sendingLimit";

/** Far more than the longest note the form allows (5,000 characters, a name and an email), even as JSON. */
const MAX_BODY_BYTES = 32 * 1024;

function respond(body: ContactResponse, status: number, headers?: HeadersInit): Response {
  return Response.json(body, { status, headers });
}

// The site's own form always posts JSON. Requiring it also means another site
// can't post here from a visitor's browser without the browser asking first.
function isJsonRequest(request: Request): boolean {
  const mediaType = request.headers.get("content-type")?.split(";")[0] ?? "";
  return mediaType.trim().toLowerCase() === "application/json";
}

function isDeclaredTooLarge(request: Request): boolean {
  return Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES;
}

async function readJsonObject(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) return null;
    const body: unknown = JSON.parse(text);
    return typeof body === "object" && body !== null && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request): Promise<Response> {
  if (!isJsonRequest(request)) return respond({ status: "invalid", errors: {} }, 415);
  if (isDeclaredTooLarge(request)) return respond({ status: "invalid", errors: {} }, 413);
  const input = await readJsonObject(request);
  if (!input) return respond({ status: "invalid", errors: {} }, 400);

  // Bots get a normal success so they have no reason to retry.
  if (isSpamSubmission(input)) return respond({ status: "sent" }, 200);

  const validation = validateContactMessage(input);
  if (!validation.isValid) return respond({ status: "invalid", errors: validation.errors }, 422);

  // Counted only once a note is ready to send, so fixing a typo never uses up a turn.
  const turn = takeSendingTurn(findSenderAddress(request));
  if (!turn.isAllowed) return respond({ status: "limited" }, 429, { "Retry-After": String(turn.retryAfterSeconds) });

  const delivery = await sendContactEmail(validation.message);
  if (delivery === "not-configured") return respond({ status: "unavailable" }, 503);
  if (delivery === "failed") return respond({ status: "failed" }, 502);
  return respond({ status: "sent" }, 200);
}
