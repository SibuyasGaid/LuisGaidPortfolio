interface MonogramProps {
  readonly className?: string;
}

export function Monogram({ className }: MonogramProps) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className={className}>
      <circle cx="20" cy="20" r="19" fill="none" stroke="currentColor" strokeWidth="0.75" />
      <circle cx="20" cy="20" r="16.5" fill="none" stroke="currentColor" strokeWidth="0.4" opacity="0.6" />
      <text
        x="20"
        y="24.5"
        textAnchor="middle"
        fill="currentColor"
        style={{ fontFamily: "var(--font-caps)", fontSize: "12.5px", letterSpacing: "0.04em" }}
      >
        CLG
      </text>
    </svg>
  );
}
