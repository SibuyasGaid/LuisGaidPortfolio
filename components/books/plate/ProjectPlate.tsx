import { EngravedRosette } from "@/components/books/plate/EngravedRosette";
import { PlateIllustration } from "@/components/books/plate/PlateIllustration";
import type { Project, ProjectLink } from "@/content/portfolio";
import { toRomanNumeral } from "@/lib/romanNumerals";

interface ProjectPlateProps {
  readonly project: Project;
  readonly plateNumber: number;
}

const LINK_LABELS: Record<ProjectLink["kind"], { readonly visible: string; readonly icon: string }> = {
  website: { visible: "Visit site", icon: "↗" },
  video: { visible: "Watch video", icon: "▶" },
};

// A book illustration plate. Once a project has an illustration and a link,
// the whole plate opens the live site or video.
export function ProjectPlate({ project, plateNumber }: ProjectPlateProps) {
  const plate = (
    <div className="plate-surface relative aspect-[16/10] overflow-hidden lg:aspect-auto lg:h-full lg:min-h-[26rem]">
      <EngravedRosette plateNumber={plateNumber} />
      {project.illustration ? <PlateIllustration illustration={project.illustration} /> : null}
      <span aria-hidden="true" className="eyebrow absolute bottom-4 left-5 text-brass-light/90">
        Plate {toRomanNumeral(plateNumber)}
      </span>
      {project.link ? (
        <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-parchment-light/95 px-3.5 py-1.5 text-xs font-semibold text-ink">
          {LINK_LABELS[project.link.kind].visible}
          <span aria-hidden="true" className="nudge-arrow">
            {LINK_LABELS[project.link.kind].icon}
          </span>
          <span className="sr-only">: {project.title} (opens in a new tab)</span>
        </span>
      ) : null}
    </div>
  );

  if (!project.link) return plate;
  return (
    <a href={project.link.href} target="_blank" rel="noreferrer" className="group block lg:h-full">
      {plate}
    </a>
  );
}
