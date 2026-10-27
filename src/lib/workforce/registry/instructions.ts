/**
 * Versioned instructions for roles that run as model workflows. They are
 * added to the stage prompt for the stage a role leads; the same rules are
 * enforced on the output by output-checks.ts. Bump a role's version whenever
 * its text changes, so every recorded run names the instructions it used.
 */
import { STAGE_CONTRACTS } from "../lifecycle";
import { EVIDENCE_LABELS } from "./output-checks";
import { getRoleSpec, type StageKey } from "./roles";

const LABELS = EVIDENCE_LABELS.map((l) => `[${l}]`).join(", ");

const COMMON = [
  "Never invent customers, interviews, quotes, survey results, metrics or sources. If evidence is missing, say so in the section where it would belong.",
  `Where a section lists claims, start each bullet with one of ${LABELS}. A [Sourced fact] must end with (Source: …) naming one of your inputs as it is labelled: the mission request, the clarification answers, or an upstream artefact by its title.`,
  "Never state that anything has been approved, deployed or released: only the founder approves, and nothing has shipped.",
  "If product memory lists conflicting entries, keep both sides, say plainly that they conflict, and do not average or merge them.",
];

const STAGE_RULES: Partial<Record<StageKey, string[]>> = {
  charter: [
    "Under Problem, state the problem only; do not propose a solution.",
    "Write Success criteria as measurable bullets.",
  ],
  market: [
    "Every figure about market size, price or share is either a [Sourced fact] with its source or labelled [Assumption], [Inference] or [Speculative].",
    "Under Demand hypotheses, label every bullet.",
    "List under Evidence gaps what would need to be checked with real customers.",
  ],
  research: [
    "Under Findings, label every bullet. Keep conflicting findings side by side and say that they conflict; never average them away.",
  ],
  prd: [
    "Under Problem statement and Target users, write each claim on its own line starting with an evidence label; nothing there is stated as fact without a source.",
    "Under Requirements, write each as '- R1: …', numbering R1, R2, … in order.",
    "Under Acceptance criteria, give at least one bullet per requirement, starting with its ID ('- R1: …').",
    "Under Out of scope, list what this release will not do.",
  ],
  ux: [
    "Under Screens, write one bullet per screen and name the requirement IDs it serves in brackets, for example (R1, R3).",
    "Do not add a screen that serves no requirement.",
  ],
  release: [
    "Describe a release candidate awaiting the founder's decision; never describe it as released or deployed.",
  ],
  evolution: [
    "Under Next experiments, write each as a hypothesis followed by 'Measure: …' naming the metric that would confirm or refute it.",
  ],
};

/** Instruction version per role. Recorded with every run that used it. */
export const INSTRUCTION_VERSIONS: Readonly<Record<string, string>> = {
  "DX-001": "DX-001@3",
  "DX-002": "DX-002@3",
  "DX-018": "DX-018@3",
  "DX-020": "DX-020@3",
  "DX-021": "DX-021@3",
  "DX-023": "DX-023@4",
  "DX-035": "DX-035@3",
};

export type RoleInstructions = { version: string; text: string };

/** The instructions a role works under when it leads `stage`, or null if it has none. */
export function roleInstructions(roleId: string, stage: StageKey): RoleInstructions | null {
  const spec = getRoleSpec(roleId);
  const version = INSTRUCTION_VERSIONS[roleId];
  if (!spec || !version || spec.executionMode !== "model_workflow") return null;
  if (!spec.leads.some((l) => l.stage === stage)) return null;
  const lines = [
    `You are working as ${roleId}. ${spec.purpose}`,
    "Rules:",
    ...[...COMMON, ...(STAGE_RULES[stage] ?? []), ...spec.mustNot.map((m) => `Do not: ${m}.`)].map(
      (r) => `- ${r}`,
    ),
    `Stop and say what you need from the founder if: ${spec.escalateWhen.join("; ")}.`,
  ];
  return { version, text: lines.join("\n") };
}

/** The stage a lifecycle task produces, by task key. Null for gates and tasks with no contract. */
export function stageForTask(taskKey: string): StageKey | null {
  if (taskKey === "release_pack") return "release";
  return Object.hasOwn(STAGE_CONTRACTS, taskKey) ? (taskKey as StageKey) : null;
}

/**
 * The role that leads a task's stage: the first role on the task, in plan
 * order, whose definition leads that stage. Null when none does.
 */
export function leadRole(task: { key: string; capabilityIds: readonly string[] }): string | null {
  const stage = stageForTask(task.key);
  if (!stage) return null;
  for (const id of task.capabilityIds)
    if (getRoleSpec(id)?.leads.some((l) => l.stage === stage)) return id;
  return null;
}
