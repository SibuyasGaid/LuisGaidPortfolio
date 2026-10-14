"use client";

import Image from "next/image";
import { useState } from "react";
import { Fleuron } from "@/components/ornaments/Fleuron";
import type { ProjectImage } from "@/content/portfolio";

interface ProjectFigureProps {
  readonly image: ProjectImage;
}

export function ProjectFigure({ image }: ProjectFigureProps) {
  const [hasFailedToLoad, setHasFailedToLoad] = useState(false);
  const aspectRatio = `${image.width} / ${image.height}`;

  if (hasFailedToLoad) {
    return (
      <div
        role="img"
        aria-label={image.alt}
        style={{ aspectRatio }}
        className="surface-parchment flex items-center justify-center border border-parchment-edge"
      >
        <Fleuron className="h-4 w-24 text-brass/70" />
      </div>
    );
  }

  return (
    <Image
      src={image.src}
      alt={image.alt}
      width={image.width}
      height={image.height}
      sizes="(min-width: 64rem) 36rem, 100vw"
      onError={() => setHasFailedToLoad(true)}
      className="h-auto w-full border border-parchment-edge"
    />
  );
}
