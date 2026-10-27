/**
 * Role definitions for the specialists that may be assigned to missions.
 *
 * Every Available role needs a definition here, and only Available roles have
 * one (roles.test.ts checks both directions). Time, retry and cost limits come from the registry record
 * (roleLimits). Every other catalogue entry stays visible but cannot be
 * assigned. Evaluation status is tracked separately in evaluations.ts.
 *
 * Each role keeps three statuses apart:
 * - availability: may the planner assign it (registry lifecycle status);
 * - execution mode: how it is built to run (model workflow or deterministic);
 * - evaluation: whether its evaluation suite has passed (evaluations.ts).
 */
import type { STAGE_CONTRACTS } from "../lifecycle";
import type { WfArtefact } from "../types";
import { getCapability } from "./load";

export type StageKey = keyof typeof STAGE_CONTRACTS;

/**
 * What a role may read. The worker gives a role's model step only the scopes
 * listed here (worker.server.ts, contextFor); the mission request is always given.
 */
export const CONTEXT_SCOPES = [
  "mission_request",
  "clarification_answers",
  "upstream_artefacts",
  "founder_evidence",
  "product_memory",
] as const;
export type ContextScope = (typeof CONTEXT_SCOPES)[number];

export type RoleSpec = {
  id: string;
  /** One sentence: the job this role does in a mission. */
  purpose: string;
  /** Things the role must never do; checked in its evaluation suite where checkable. */
  mustNot: string[];
  /** Inputs the role needs before it can start. */
  inputs: Array<{ name: string; from: "mission" | "upstream"; required: boolean }>;
  /** The stages whose artefact this role leads, and the artefact kind it produces. */
  leads: Array<{ stage: StageKey; produces: WfArtefact["kind"] }>;
  contextScopes: ContextScope[];
  /** External tools the role may call. Empty means it uses none. */
  tools: string[];
  /** Situations in which the role stops and asks the founder. */
  escalateWhen: string[];
  executionMode: "model_workflow" | "deterministic";
};

const MUST_NOT_ALWAYS = [
  "Invent customers, interviews, quotes, metrics or sources",
  "Present an assumption or inference as a sourced fact",
];

export const ROLE_SPECS: readonly RoleSpec[] = [
  {
    id: "DX-001",
    purpose:
      "Coordinates the mission: writes the mission charter, assembles the release pack and records what to learn next.",
    mustNot: [
      ...MUST_NOT_ALWAYS,
      "Pass a human gate or approve anything on the founder's behalf",
      "Start outside actions without an approval for the current plan version",
    ],
    inputs: [
      { name: "Mission request", from: "mission", required: true },
      { name: "Clarification answers", from: "mission", required: false },
      { name: "Upstream stage artefacts", from: "upstream", required: false },
    ],
    leads: [
      { stage: "charter", produces: "mission_charter" },
      { stage: "release", produces: "release_pack" },
    ],
    contextScopes: [
      "mission_request",
      "clarification_answers",
      "upstream_artefacts",
      "product_memory",
    ],
    tools: [],
    escalateWhen: [
      "The request is ambiguous about the user or the outcome",
      "A stage failed its handoff contract",
      "The usage estimate exceeds the plan's cost limit",
    ],
    executionMode: "model_workflow",
  },
  {
    id: "DX-002",
    purpose:
      "Turns the founder's request into a clear problem statement, target users, outcome and success criteria.",
    mustNot: [...MUST_NOT_ALWAYS, "Propose a solution before the problem is stated"],
    inputs: [
      { name: "Mission request", from: "mission", required: true },
      { name: "Clarification answers", from: "mission", required: false },
    ],
    leads: [{ stage: "charter", produces: "mission_charter" }],
    contextScopes: ["mission_request", "clarification_answers", "product_memory"],
    tools: [],
    escalateWhen: ["The target user or desired outcome cannot be stated from the inputs"],
    executionMode: "model_workflow",
  },
  {
    id: "DX-018",
    purpose:
      "Checks every claim in research against its sources and labels it as a sourced fact, assumption, inference or speculation.",
    mustNot: [
      ...MUST_NOT_ALWAYS,
      "Mark a claim as sourced when no source is given",
      "Drop a claim because it conflicts with another; conflicts are kept and flagged",
    ],
    inputs: [
      { name: "Mission charter", from: "upstream", required: true },
      { name: "Founder-supplied sources", from: "mission", required: false },
    ],
    leads: [{ stage: "research", produces: "research_dossier" }],
    contextScopes: ["mission_request", "upstream_artefacts", "founder_evidence", "product_memory"],
    tools: [],
    escalateWhen: ["A decision depends on a claim with no source", "Sources conflict"],
    executionMode: "model_workflow",
  },
  {
    id: "DX-020",
    purpose:
      "Synthesises research into findings, evidence quality and the questions still open, and later into what to learn next.",
    mustNot: [...MUST_NOT_ALWAYS, "Average away conflicting evidence"],
    inputs: [
      { name: "Mission charter", from: "upstream", required: true },
      { name: "Founder-supplied sources", from: "mission", required: false },
    ],
    leads: [
      { stage: "research", produces: "research_dossier" },
      { stage: "evolution", produces: "evolution_plan" },
    ],
    contextScopes: ["mission_request", "upstream_artefacts", "founder_evidence", "product_memory"],
    tools: [],
    escalateWhen: ["Evidence is too thin to support any finding"],
    executionMode: "model_workflow",
  },
  {
    id: "DX-021",
    purpose:
      "Maps the market, customer segments, competitors and demand hypotheses, and names the evidence gaps.",
    mustNot: [...MUST_NOT_ALWAYS, "State market sizes or competitor facts without a source"],
    inputs: [
      { name: "Mission charter", from: "upstream", required: true },
      { name: "Founder-supplied sources", from: "mission", required: false },
    ],
    leads: [{ stage: "market", produces: "research_dossier" }],
    contextScopes: [
      "mission_request",
      "clarification_answers",
      "upstream_artefacts",
      "founder_evidence",
      "product_memory",
    ],
    tools: [],
    escalateWhen: ["The segment cannot be identified from the inputs"],
    executionMode: "model_workflow",
  },
  {
    id: "DX-023",
    purpose:
      "Writes the product requirements: problem, users, value, requirements with acceptance criteria, metrics, risks and scope.",
    mustNot: [
      ...MUST_NOT_ALWAYS,
      "Write a requirement without an acceptance criterion",
      "Leave out the out-of-scope list",
    ],
    inputs: [
      { name: "Mission charter", from: "upstream", required: true },
      { name: "Research dossier", from: "upstream", required: true },
    ],
    leads: [{ stage: "prd", produces: "prd" }],
    contextScopes: [
      "mission_request",
      "clarification_answers",
      "upstream_artefacts",
      "product_memory",
    ],
    tools: [],
    escalateWhen: ["Requirements conflict with the charter's constraints"],
    executionMode: "model_workflow",
  },
  {
    id: "DX-035",
    purpose:
      "Turns the requirements into user journeys, information architecture, screens and accessibility notes, and a sandboxed prototype.",
    mustNot: [
      ...MUST_NOT_ALWAYS,
      "Add a screen with no requirement behind it",
      "Load external scripts or send data from the prototype",
    ],
    inputs: [{ name: "Product requirements", from: "upstream", required: true }],
    leads: [{ stage: "ux", produces: "design_spec" }],
    contextScopes: ["mission_request", "upstream_artefacts"],
    tools: [],
    escalateWhen: ["A requirement cannot be shown on any screen"],
    executionMode: "model_workflow",
  },
  {
    id: "DX-071",
    purpose:
      "Plans how the product will be tested and reports which checks actually ran and what they found.",
    mustNot: [
      ...MUST_NOT_ALWAYS,
      "Report a test as passed that did not run",
      "Label work as tested on the strength of a plan alone",
    ],
    inputs: [
      { name: "Product requirements", from: "upstream", required: true },
      { name: "Prototype", from: "upstream", required: false },
    ],
    leads: [],
    contextScopes: ["mission_request", "upstream_artefacts"],
    tools: [],
    escalateWhen: ["A requirement has no way to be checked"],
    executionMode: "deterministic",
  },
];

/** A role's limits, from its registry record so they are defined in one place. */
export function roleLimits(id: string) {
  const cap = getCapability(id);
  if (!cap) throw new Error(`${id} is not in the registry`);
  return {
    timeoutSeconds: cap.limits.max_runtime_seconds,
    maxRetries: cap.limits.max_retries,
    maxCredits: cap.limits.max_usage_credits,
  };
}

/**
 * What a stage step with no defined lead role may read: everything but the
 * founder's evidence, which only roles that declare it receive.
 */
export const DEFAULT_CONTEXT_SCOPES: readonly ContextScope[] = [
  "mission_request",
  "clarification_answers",
  "upstream_artefacts",
  "product_memory",
];

export function getRoleSpec(id: string): RoleSpec | undefined {
  return ROLE_SPECS.find((r) => r.id === id);
}
