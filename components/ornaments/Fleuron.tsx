interface FleuronProps {
  readonly className?: string;
}

export function Fleuron({ className }: FleuronProps) {
  return (
    <svg viewBox="0 0 96 16" aria-hidden="true" className={className} fill="none" stroke="currentColor">
      <path d="M0 8h36M60 8h36" strokeWidth="0.75" />
      <path d="M48 2.5 53.5 8 48 13.5 42.5 8Z" fill="currentColor" stroke="none" />
      <circle cx="38.5" cy="8" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="57.5" cy="8" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}
