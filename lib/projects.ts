import { PROJECTS, type Project, type ProjectCategory, type ProjectId } from "@/content/portfolio";

export const FEATURED_PROJECTS: readonly Project[] = PROJECTS.filter((project) => project.isFeatured);

const ARCHIVED_PROJECTS: readonly Project[] = PROJECTS.filter((project) => !project.isFeatured);

/** The order the archive's sections come in. */
const ARCHIVE_ORDER: readonly ProjectCategory[] = ["automation", "creator-tools", "operations", "engineering"];

export interface ArchiveShelf {
  readonly category: ProjectCategory;
  readonly projects: readonly Project[];
}

/** The archive, one section per category, leaving out any with nothing in it. */
export const ARCHIVE_SHELVES: readonly ArchiveShelf[] = ARCHIVE_ORDER.map((category) => ({
  category,
  projects: ARCHIVED_PROJECTS.filter((project) => project.category === category),
})).filter((shelf) => shelf.projects.length > 0);

export function getProject(projectId: ProjectId): Project {
  const project = PROJECTS.find((candidate) => candidate.id === projectId);
  if (!project) throw new Error(`Unknown project: ${projectId}`);
  return project;
}
