"use client";

import dynamic from "next/dynamic";

// The condition is replaced at build time, so production bundles drop the
// readout and its import entirely.
const PerformanceReadout =
  process.env.NODE_ENV === "development"
    ? dynamic(() => import("@/components/dev/PerformanceReadout"), { ssr: false })
    : null;

export function DevPerformanceReadout() {
  return PerformanceReadout ? <PerformanceReadout /> : null;
}
