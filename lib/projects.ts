import { PROJECTS, type Project, type ProjectId } from "@/content/portfolio";

export const FEATURED_PROJECTS: readonly Project[] = PROJECTS.filter((project) => project.isFeatured);

export const ARCHIVED_PROJECTS: readonly Project[] = PROJECTS.filter((project) => !project.isFeatured);

export function getProject(projectId: ProjectId): Project {
  const project = PROJECTS.find((candidate) => candidate.id === projectId);
  if (!project) throw new Error(`Unknown project: ${projectId}`);
  return project;
}
