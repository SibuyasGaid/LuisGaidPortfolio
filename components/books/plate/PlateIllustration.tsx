"use client";

import Image from "next/image";
import { useState } from "react";
import type { ProjectIllustration } from "@/content/portfolio";

interface PlateIllustrationProps {
  readonly illustration: ProjectIllustration;
}

// If the image fails, it steps aside and the engraved plate beneath shows instead.
export function PlateIllustration({ illustration }: PlateIllustrationProps) {
  const [hasFailedToLoad, setHasFailedToLoad] = useState(false);
  if (hasFailedToLoad) return null;
  return (
    <Image
      src={illustration.src}
      alt={illustration.alt}
      fill
      sizes="(min-width: 64rem) 36rem, 100vw"
      onError={() => setHasFailedToLoad(true)}
      className="object-cover transition-transform duration-700 ease-settle group-hover:scale-[1.03]"
    />
  );
}
