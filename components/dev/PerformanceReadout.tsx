"use client";

import { useEffect, useState } from "react";

interface Readings {
  readonly framesPerSecond: number;
  readonly heapMegabytes: number | null;
  readonly domNodeCount: number;
}

// performance.memory is a non-standard Chromium extension.
interface PerformanceWithMemory extends Performance {
  readonly memory?: { readonly usedJSHeapSize: number };
}

const SAMPLE_INTERVAL_MS = 1000;
const BYTES_PER_MEGABYTE = 1024 * 1024;

function readHeapMegabytes(): number | null {
  const memory = (performance as PerformanceWithMemory).memory;
  return memory ? memory.usedJSHeapSize / BYTES_PER_MEGABYTE : null;
}

function useFrameReadings(): Readings | null {
  const [readings, setReadings] = useState<Readings | null>(null);

  useEffect(() => {
    let frameCount = 0;
    let sampleStart = performance.now();
    let frameRequest = 0;

    function countFrame(now: number): void {
      frameCount += 1;
      const elapsed = now - sampleStart;
      if (elapsed >= SAMPLE_INTERVAL_MS) {
        setReadings({
          framesPerSecond: Math.round((frameCount * 1000) / elapsed),
          heapMegabytes: readHeapMegabytes(),
          domNodeCount: document.getElementsByTagName("*").length,
        });
        frameCount = 0;
        sampleStart = now;
      }
      frameRequest = requestAnimationFrame(countFrame);
    }

    frameRequest = requestAnimationFrame(countFrame);
    return () => cancelAnimationFrame(frameRequest);
  }, []);

  return readings;
}

export default function PerformanceReadout() {
  const readings = useFrameReadings();
  if (!readings) return null;
  const heap = readings.heapMegabytes === null ? "n/a" : `${readings.heapMegabytes.toFixed(1)} MB`;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed bottom-3 left-3 z-50 rounded-sm bg-black/80 px-3 py-2 font-mono text-[11px] leading-5 text-brass-light"
    >
      <div>{readings.framesPerSecond} fps</div>
      <div>heap {heap}</div>
      <div>{readings.domNodeCount} nodes</div>
    </div>
  );
}
