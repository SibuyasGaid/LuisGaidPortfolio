interface BrassRuleProps {
  readonly className?: string;
}

export function BrassRule({ className = "" }: BrassRuleProps) {
  return (
    <div data-reveal="rule" aria-hidden="true" className={`flex items-center gap-2.5 text-brass ${className}`}>
      <span className="h-px flex-1 bg-current opacity-60" />
      <span className="size-1 rotate-45 bg-current" />
      <span className="h-px flex-1 bg-current opacity-60" />
    </div>
  );
}
