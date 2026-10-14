"use client";

import dynamic from "next/dynamic";
import { useRef, type ReactNode } from "react";
import { ErrorBoundary } from "@/components/errors/ErrorBoundary";
import { useIsMotionAllowed } from "@/components/motion/useIsMotionAllowed";

const ScrollReveals = dynamic(() => import("@/components/motion/runtime/ScrollReveals"), { ssr: false });

interface RevealScopeProps {
  readonly children: ReactNode;
}

// Marks one page as the scope for its scroll animations. The content is
// rendered as-is on the server; animation only ever enhances it.
export function RevealScope({ children }: RevealScopeProps) {
  const scopeRef = useRef<HTMLDivElement>(null);
  const isMotionAllowed = useIsMotionAllowed();
  return (
    <div ref={scopeRef}>
      {children}
      {isMotionAllowed ? (
        <ErrorBoundary fallback={null}>
          <ScrollReveals scopeRef={scopeRef} />
        </ErrorBoundary>
      ) : null}
    </div>
  );
}
