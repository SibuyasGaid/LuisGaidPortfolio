"use client";

import dynamic from "next/dynamic";
import { ErrorBoundary } from "@/components/errors/ErrorBoundary";
import { useIsMotionAllowed } from "@/components/motion/useIsMotionAllowed";

const SmoothScroll = dynamic(() => import("@/components/motion/runtime/SmoothScroll"), { ssr: false });

export function SmoothScrollLayer() {
  const isMotionAllowed = useIsMotionAllowed();
  if (!isMotionAllowed) return null;
  // If the motion bundle fails to load or throws, the page simply stays static.
  return (
    <ErrorBoundary fallback={null}>
      <SmoothScroll />
    </ErrorBoundary>
  );
}
