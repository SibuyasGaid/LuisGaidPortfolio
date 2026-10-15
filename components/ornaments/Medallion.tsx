interface MedallionProps {
  readonly className?: string;
}

export function Medallion({ className }: MedallionProps) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className={className} fill="none" stroke="currentColor">
      <circle cx="24" cy="24" r="22" strokeWidth="1" />
      <circle cx="24" cy="24" r="18.5" strokeWidth="0.6" strokeDasharray="1.2 2.4" />
      <path d="M24 13.5 26.9 20.3 34 20.9 28.6 25.6 30.3 32.6 24 28.8 17.7 32.6 19.4 25.6 14 20.9 21.1 20.3Z" fill="currentColor" stroke="none" />
    </svg>
  );
}
