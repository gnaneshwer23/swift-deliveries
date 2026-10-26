import type { WorkforceIntent } from "@/lib/marketing/workforce-summary";

/** The mission type a setup goal usually starts with. The real plan is proposed and approved later. */
const INTENT_FOR_GOAL: Record<string, WorkforceIntent> = {
  "Validate a new idea": "investigate",
  "Build an MVP": "build",
  "Improve an existing product": "improve",
  "Explore what's possible": "investigate",
  "Learn by building a product": "prototype",
};

export function intentForGoal(goal: string): WorkforceIntent {
  return Object.hasOwn(INTENT_FOR_GOAL, goal) ? INTENT_FOR_GOAL[goal]! : "investigate";
}
