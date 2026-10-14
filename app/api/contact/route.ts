import {
  isSpamSubmission,
  validateContactMessage,
  type ContactResponse,
} from "@/lib/contact/contactMessage";
import { sendContactEmail } from "@/lib/contact/sendContactEmail";

function respond(body: ContactResponse, status: number): Response {
  return Response.json(body, { status });
}

async function readJsonObject(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    return typeof body === "object" && body !== null && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request): Promise<Response> {
  const input = await readJsonObject(request);
  if (!input) return respond({ status: "invalid", errors: {} }, 400);

  // Bots get a normal success so they have no reason to retry.
  if (isSpamSubmission(input)) return respond({ status: "sent" }, 200);

  const validation = validateContactMessage(input);
  if (!validation.isValid) return respond({ status: "invalid", errors: validation.errors }, 422);

  const delivery = await sendContactEmail(validation.message);
  if (delivery === "not-configured") return respond({ status: "unavailable" }, 503);
  if (delivery === "failed") return respond({ status: "failed" }, 502);
  return respond({ status: "sent" }, 200);
}
