/**
 * "Your first project" — the path from idea to a delivered package, ticked only from what
 * the project record shows has happened. Nothing is ticked on a guess.
 */
export type FirstProjectSource = {
  id: string;
  question: string;
  stage: string;
  archived: boolean;
  updatedAt: string;
  planApproved: boolean;
  decisionRecorded: boolean;
  delivery: boolean;
  observationRecorded: boolean;
};

export type FirstProjectStepId = "idea" | "plan" | "decision" | "delivery" | "package" | "outcome";

export type FirstProjectStep = {
  id: FirstProjectStepId;
  label: string;
  /** Why the step matters, shown to learners. */
  why: string;
  done: boolean;
};

export type FirstProject = {
  projectId: string;
  projectName: string;
  steps: FirstProjectStep[];
  doneCount: number;
  next: FirstProjectStep | null;
} | null;

const STEPS: Array<Omit<FirstProjectStep, "done"> & { test: (p: FirstProjectSource) => boolean }> =
  [
    {
      id: "idea",
      label: "Describe your idea",
      why: "One or two lines is enough. A clear question keeps the team’s research focused.",
      test: (p) => p.question.trim().length > 0,
    },
    {
      id: "plan",
      label: "Approve the plan",
      why: "You agree the scope, team and usage before anyone starts. Nothing runs before this.",
      test: (p) => p.planApproved,
    },
    {
      id: "decision",
      label: "Make your decision",
      why: "The team brings options with trade-offs; you choose. Agents never decide for you.",
      test: (p) => p.decisionRecorded,
    },
    {
      id: "delivery",
      label: "Begin delivery",
      why: "The team builds your chosen direction stage by stage, stopping at your reviews.",
      test: (p) => p.delivery,
    },
    {
      id: "package",
      label: "Get your package",
      why: "Download everything made, with how each part was produced and what was simulated.",
      test: (p) => p.stage === "exported",
    },
    {
      id: "outcome",
      label: "Record what happened",
      why: "Write down what you actually saw after shipping. Only observed outcomes count.",
      test: (p) => p.observationRecorded,
    },
  ];

/** The checklist for the owner's most recently updated live project. */
export function buildFirstProject(projects: FirstProjectSource[]): FirstProject {
  const live = projects
    .filter((p) => !p.archived && p.stage !== "cancelled")
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  const p = live[0];
  if (!p) return null;
  const steps = STEPS.map(({ test, ...s }) => ({ ...s, done: test(p) }));
  return {
    projectId: p.id,
    projectName: p.question.trim() || "Untitled project",
    steps,
    doneCount: steps.filter((s) => s.done).length,
    next: steps.find((s) => !s.done) ?? null,
  };
}

/** Learners see "why this matters" notes by default; anyone can switch them on or off. */
export function explainByDefault(goal: string | null | undefined, role?: string | null): boolean {
  return goal === "Learn by building a product" || role === "Student or new builder";
}
