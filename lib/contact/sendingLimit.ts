export type SendingTurn = { readonly isAllowed: true } | { readonly isAllowed: false; readonly retryAfterSeconds: number };

interface SenderWindow {
  readonly startedAt: number;
  count: number;
}

const MAX_MESSAGES_PER_WINDOW = 5;
const WINDOW_MS = 10 * 60 * 1000;
/** Past this many senders, finished windows are swept out (and failing that, the oldest goes), so memory stays small. */
const MAX_TRACKED_SENDERS = 1000;

const windows = new Map<string, SenderWindow>();

function makeRoomForSender(now: number): void {
  for (const [sender, window] of windows) {
    if (now - window.startedAt >= WINDOW_MS) windows.delete(sender);
  }
  const oldestSender = windows.keys().next().value;
  if (windows.size >= MAX_TRACKED_SENDERS && oldestSender !== undefined) windows.delete(oldestSender);
}

/**
 * Counts a note from this sender and says whether it may go out. Each sender
 * gets a few notes every ten minutes, which no person writing to me will
 * reach, but a script flooding the inbox (and the email quota) soon does.
 * Kept in the server's memory, so the count is per running instance: a
 * first line against one sender, not a wall against many at once.
 */
export function takeSendingTurn(sender: string, now: number = Date.now()): SendingTurn {
  const current = windows.get(sender);
  if (!current || now - current.startedAt >= WINDOW_MS) {
    if (!current && windows.size >= MAX_TRACKED_SENDERS) makeRoomForSender(now);
    windows.set(sender, { startedAt: now, count: 1 });
    return { isAllowed: true };
  }
  if (current.count >= MAX_MESSAGES_PER_WINDOW) {
    return { isAllowed: false, retryAfterSeconds: Math.ceil((current.startedAt + WINDOW_MS - now) / 1000) };
  }
  current.count += 1;
  return { isAllowed: true };
}

/** The visitor's address as the host reports it. On Vercel these come from the connection itself, not the visitor. */
export function findSenderAddress(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return request.headers.get("x-real-ip") ?? (forwardedFor || "unknown");
}
