export function SkipLink() {
  return (
    <a
      href="#main"
      data-inert-during-intro
      className="fixed left-4 top-3 z-50 -translate-y-24 rounded-sm bg-parchment px-4 py-2 text-sm font-semibold text-ink [--focus-ring:var(--color-brass-ink)] focus-visible:translate-y-0"
    >
      Skip to content
    </a>
  );
}
