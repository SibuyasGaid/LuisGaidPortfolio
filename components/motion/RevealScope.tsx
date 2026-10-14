"use client";

import type { ReactNode } from "react";

interface RevealScopeProps {
  readonly children: ReactNode;
}

export function RevealScope({ children }: RevealScopeProps) {
  return <div>{children}</div>;
}
