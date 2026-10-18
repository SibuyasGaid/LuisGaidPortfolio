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
      // Wide screens crop the 16:10 picture to a taller plate, so it shows about half as wide again as the plate.
      sizes="(min-width: 64rem) 56rem, 100vw"
      style={illustration.focus ? { objectPosition: illustration.focus } : undefined}
      onError={() => setHasFailedToLoad(true)}
      className="object-cover transition-transform duration-700 ease-settle group-hover:scale-[1.03]"
    />
  );
}
