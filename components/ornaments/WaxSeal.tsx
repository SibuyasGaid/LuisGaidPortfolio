const SEAL_OUTLINE =
  "M112.1 60.0C112.8 63.6 111.6 68.0 109.9 71.4C108.1 74.7 103.3 76.6 101.8 80.1C100.3 83.7 103.1 90.0 100.9 92.7C98.8 95.3 91.7 93.6 88.7 95.9C85.6 98.3 85.4 104.6 82.5 106.7C79.5 108.7 74.8 107.3 71.0 108.4C67.3 109.4 63.8 112.5 60.0 112.9C56.2 113.4 51.6 113.0 48.4 110.9C45.1 108.9 43.7 102.6 40.5 100.6C37.2 98.6 31.7 100.9 28.9 99.0C26.0 97.2 26.4 91.8 23.2 89.3C20.1 86.8 12.0 87.1 10.0 84.1C8.0 81.1 11.1 75.2 11.2 71.1C11.2 67.1 10.3 63.7 10.3 60.0C10.3 56.3 10.2 52.3 11.4 48.9C12.6 45.5 16.3 43.2 17.6 39.6C18.9 36.0 17.0 30.1 19.2 27.5C21.5 24.8 28.2 26.5 31.1 23.8C34.0 21.0 33.5 13.3 36.5 11.1C39.4 8.9 44.8 10.7 48.7 10.4C52.6 10.1 56.3 8.7 60.0 9.2C63.7 9.7 67.4 11.6 70.7 13.3C73.9 15.0 75.8 18.6 79.6 19.3C83.4 20.1 90.4 16.3 93.6 17.9C96.8 19.5 96.4 25.9 98.9 29.0C101.5 32.1 107.6 33.1 108.8 36.5C110.0 39.9 105.4 45.6 105.9 49.5C106.5 53.4 111.4 56.4 112.1 60.0Z";

interface WaxSealProps {
  readonly className?: string;
}

export function WaxSeal({ className }: WaxSealProps) {
  return (
    <svg viewBox="0 0 122 122" aria-hidden="true" className={className}>
      <defs>
        <radialGradient id="wax-seal-face" cx="36%" cy="30%" r="78%">
          <stop offset="0%" stopColor="#a23a4d" />
          <stop offset="50%" stopColor="#6b1e2e" />
          <stop offset="100%" stopColor="#3a0913" />
        </radialGradient>
        <radialGradient id="wax-seal-well" cx="60%" cy="64%" r="70%">
          <stop offset="0%" stopColor="#7d2536" />
          <stop offset="100%" stopColor="#4a0e1b" />
        </radialGradient>
      </defs>
      <path d={SEAL_OUTLINE} transform="translate(2 3)" fill="#2a1f1a" opacity="0.22" />
      <path d={SEAL_OUTLINE} fill="url(#wax-seal-face)" />
      <circle cx="60" cy="60" r="35" fill="url(#wax-seal-well)" />
      <circle cx="60" cy="60" r="35" fill="none" stroke="#2f0710" strokeWidth="2.5" opacity="0.55" />
      <circle cx="59.4" cy="59.2" r="35.5" fill="none" stroke="#c46a7a" strokeWidth="0.8" opacity="0.45" />
      <circle cx="60" cy="60" r="29" fill="none" stroke="#2f0710" strokeWidth="0.8" opacity="0.4" strokeDasharray="1.5 2.5" />
      <text
        x="60.6"
        y="68.6"
        textAnchor="middle"
        fill="#c46a7a"
        opacity="0.4"
        style={{ fontFamily: "var(--font-caps)", fontSize: "24px", letterSpacing: "0.04em" }}
      >
        CLG
      </text>
      <text
        x="60"
        y="68"
        textAnchor="middle"
        fill="#2f0710"
        opacity="0.75"
        style={{ fontFamily: "var(--font-caps)", fontSize: "24px", letterSpacing: "0.04em" }}
      >
        CLG
      </text>
    </svg>
  );
}
