interface RosetteLayout {
  readonly centerX: number;
  readonly centerY: number;
  readonly rotation: number;
  readonly circleCount: number;
}

// One layout per plate so neighbouring cards never look stamped from the same die.
const ROSETTE_LAYOUTS: readonly RosetteLayout[] = [
  { centerX: 112, centerY: 46, rotation: 0, circleCount: 32 },
  { centerX: 46, centerY: 60, rotation: 11, circleCount: 28 },
  { centerX: 120, centerY: 70, rotation: 23, circleCount: 36 },
  { centerX: 40, centerY: 38, rotation: 7, circleCount: 30 },
  { centerX: 104, centerY: 58, rotation: 17, circleCount: 34 },
  { centerX: 58, centerY: 48, rotation: 29, circleCount: 26 },
];

interface Circle {
  readonly x: number;
  readonly y: number;
}

function placeOnOrbit(count: number, orbitRadius: number): Circle[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * Math.PI * 2;
    return {
      x: Math.round(Math.cos(angle) * orbitRadius * 10) / 10,
      y: Math.round(Math.sin(angle) * orbitRadius * 10) / 10,
    };
  });
}

interface EngravedRosetteProps {
  readonly plateNumber: number;
}

// Overlapping circles on an orbit draw the guilloche rosettes engraved on
// banknotes and old book plates: a few dozen SVG elements, no image download.
export function EngravedRosette({ plateNumber }: EngravedRosetteProps) {
  const layout = ROSETTE_LAYOUTS[(plateNumber - 1) % ROSETTE_LAYOUTS.length] ?? ROSETTE_LAYOUTS[0];
  if (!layout) return null;
  const outerRing = placeOnOrbit(layout.circleCount, 24);
  const innerRing = placeOnOrbit(Math.round(layout.circleCount * 0.75), 11);

  return (
    <svg
      viewBox="0 0 160 100"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className="absolute inset-0 size-full text-brass-light"
    >
      <g
        className="rosette origin-center transition-transform duration-1000 ease-settle [transform-box:fill-box] group-hover:rotate-[8deg]"
        transform={`translate(${layout.centerX} ${layout.centerY}) rotate(${layout.rotation})`}
        fill="none"
        stroke="currentColor"
        strokeWidth="0.22"
      >
        <g opacity="0.42">
          {outerRing.map((circle, index) => (
            <circle key={`outer-${index}`} cx={circle.x} cy={circle.y} r="30" />
          ))}
        </g>
        <g opacity="0.55">
          {innerRing.map((circle, index) => (
            <circle key={`inner-${index}`} cx={circle.x} cy={circle.y} r="13" />
          ))}
        </g>
        <circle r="56" opacity="0.35" />
        <circle r="58.5" opacity="0.2" />
      </g>
    </svg>
  );
}
