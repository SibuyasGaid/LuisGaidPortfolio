// Errors are logged while developing only, so visitors' consoles stay clean.
export function reportError(error: unknown, context?: string | null): void {
  if (process.env.NODE_ENV === "production") return;
  console.error(error, context ?? "");
}
