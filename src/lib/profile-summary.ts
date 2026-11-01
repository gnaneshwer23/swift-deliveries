/**
 * What the profile page shows about your work, read only from saved project records:
 * live projects, project steps reached, and the lessons tied to those steps.
 */
import {
  isLive,
  reachedSteps,
  FIRST_PROJECT_SHORT_LABELS,
  type FirstProjectSource,
} from "@/lib/pilot-mission/first-project";
import { LESSONS, reachedLessons } from "@/lib/learn/lessons";

export type ProfileProgress = {
  liveProjects: number;
  stepsReached: number;
  stepsTotal: number;
  lessonsForSteps: number;
  lessonsTotal: number;
};

export function profileProgress(projects: FirstProjectSource[]): ProfileProgress {
  const steps = reachedSteps(projects);
  return {
    liveProjects: projects.filter(isLive).length,
    stepsReached: steps.size,
    stepsTotal: FIRST_PROJECT_SHORT_LABELS.length,
    lessonsForSteps: reachedLessons(steps).size,
    lessonsTotal: LESSONS.length,
  };
}

/** Up to two initials from a name or email; "DX" when there is nothing usable. */
export function initialsOf(name: string): string {
  const parts = name
    .split(/[\s@._-]+/)
    .filter((p) => /^[\p{L}\p{N}]/u.test(p))
    .slice(0, 2);
  return parts.map((p) => p[0]!.toUpperCase()).join("") || "DX";
}
