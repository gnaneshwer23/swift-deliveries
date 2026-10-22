/**
 * DeliverX Programme — an idea or business case run end-to-end as a real
 * product programme by the 150-role workforce: roadmap, meetings, research,
 * customer interviews, decisions, sprints, verification, launch and evolution.
 *
 * Everything here is plain data so the engine stays pure and reproducible.
 */
import type { TaskStatus } from "@/lib/workforce/types";

export type BusinessCase = {
  /** Product name or working title. */
  name: string;
  /** The idea / business case in the founder's words. */
  idea: string;
  targetUsers: string;
  problem: string;
  /** Business objectives and how success will be measured. */
  goals: string;
  constraints: string;
  timelineWeeks: number;
  budgetCredits: number;
};

export const PHASES = [
  "discovery",
  "definition",
  "design",
  "build",
  "verification",
  "launch",
  "growth",
] as const;
export type PhaseKey = (typeof PHASES)[number];

export const PHASE_LABELS: Record<PhaseKey, string> = {
  discovery: "Discovery & validation",
  definition: "Definition & business model",
  design: "Experience & architecture",
  build: "Build sprints",
  verification: "Verification & release readiness",
  launch: "Launch & go-to-market",
  growth: "Growth & evolution",
};

export type Phase = {
  key: PhaseKey;
  name: string;
  goal: string;
  startWeek: number;
  endWeek: number;
};

export type Milestone = {
  key: string;
  phase: PhaseKey;
  title: string;
  week: number;
  /** Work item keys that must complete for the milestone to be reached. */
  itemKeys: string[];
};

export const CRITERIA = [
  "customer_value",
  "business_value",
  "cost",
  "risk",
  "time_to_market",
  "evidence",
  "feasibility",
] as const;
/** All criteria are scored as "goodness" in [0,1]: 1 = cheap / safe / fast / well-evidenced. */
export type Criterion = (typeof CRITERIA)[number];

export const CRITERION_LABELS: Record<Criterion, string> = {
  customer_value: "customer value",
  business_value: "business value",
  cost: "cost",
  risk: "risk",
  time_to_market: "time to market",
  evidence: "strength of evidence",
  feasibility: "feasibility",
};

export type DecisionOption = {
  id: string;
  label: string;
  summary: string;
  scores: Record<Criterion, number>;
};

export type DecisionSpec = {
  key: string;
  question: string;
  options: DecisionOption[];
  /** Capability that owns the decision and adjudicates ties within the rules. */
  owner: string;
  panel: string[];
  /** Department numbers whose expertise is most relevant (double voting weight). */
  domainDepartments: number[];
  impact: "medium" | "high";
};

export type MeetingType =
  | "kickoff"
  | "discovery_workshop"
  | "prioritisation"
  | "architecture_review"
  | "design_review"
  | "sprint_planning"
  | "sprint_review"
  | "go_no_go"
  | "launch_review"
  | "retrospective";

export type WorkItemKind = "meeting" | "deliverable" | "interviews" | "gate";

export type WorkItem = {
  key: string;
  kind: WorkItemKind;
  phase: PhaseKey;
  title: string;
  description: string;
  week: number;
  dependsOn: string[];
  /** Accountable capability (DX id). */
  owner: string;
  /** Contributing capabilities (DX ids), excluding the owner. */
  team: string[];
  status: TaskStatus;
  estimatedCredits: number;
  actualCredits: number;
  meetingType?: MeetingType;
  decision?: DecisionSpec;
  requiredSections?: string[];
  /** Deliverable artefact kind (file name stem in the export). */
  produces?: string;
  /** Peer reviewer (different department from the owner). */
  reviewer?: string;
  sprint?: number;
};

export type ProgrammeStatus =
  "draft" | "active" | "awaiting_human" | "completed" | "partially_completed" | "cancelled";

export type Roadmap = {
  phases: Phase[];
  milestones: Milestone[];
  items: WorkItem[];
};

export type ProgrammeState = {
  id: string;
  title: string;
  businessCase: BusinessCase;
  roadmap: Roadmap;
  status: ProgrammeStatus;
  budget: { ceiling: number; consumed: number };
  /** Optimistic-concurrency version for persisted state. */
  version: number;
  createdAt: string;
  updatedAt: string;
};

// ---------------------------------------------------------------------------
// Records (append-only programme history)
// ---------------------------------------------------------------------------

export type TranscriptTurn = {
  speaker: string;
  kind:
    | "facilitation"
    | "update"
    | "proposal"
    | "concern"
    | "question"
    | "position"
    | "decision"
    | "action";
  text: string;
};

export type ActionItem = { owner: string; text: string; dueWeek: number };

export type MeetingRecord = {
  type: MeetingType;
  facilitator: string;
  attendees: string[];
  agenda: string[];
  transcript: TranscriptTurn[];
  decisionKeys: string[];
  actionItems: ActionItem[];
  week: number;
};

export type Position = {
  capabilityId: string;
  optionId: string;
  confidence: number;
  weight: number;
  rationale: string;
  concern: string;
  revisedFrom?: string;
  persuadedBy?: string;
};

export type Veto = { capabilityId: string; optionId: string; reason: string };

export type DecisionOutcome = "adopted" | "escalated";

export type DecisionRecord = {
  key: string;
  question: string;
  owner: string;
  options: DecisionOption[];
  round1: Position[];
  round2: Position[];
  vetoes: Veto[];
  tally: Array<{ optionId: string; share: number; vetoed: boolean }>;
  outcome: DecisionOutcome;
  chosenOptionId: string | null;
  /** Why the outcome was reached (rules applied, not model prose). */
  rationale: string;
  dissent: Array<{ capabilityId: string; optionId: string; note: string }>;
  confidence: number;
  needsHumanRatification: boolean;
  /** Red-team challenge of the leading option (step 3 of the protocol). */
  challenge: { by: string; weakest: string; note: string; evidenceGap: boolean };
  /** Does the outcome survive dropping each criterion? Lists criteria the choice depends on. */
  sensitivity: { robust: boolean; flipsWithout: string[] };
  /** When this decision must be revisited. */
  reviewCondition: string;
  human?: { decision: "ratified" | "overridden"; optionId: string; note: string; at: string };
};

export type InterviewPersona = {
  id: string;
  name: string;
  segment: string;
  context: string;
  synthetic: true;
};

export type InterviewRecord = {
  guide: string[];
  hypotheses: Array<{
    id: string;
    statement: string;
    status: "untested" | "synthetic_signal" | "has_real_evidence";
  }>;
  personas: InterviewPersona[];
  sessions: Array<{
    personaId: string;
    interviewer: string;
    turns: TranscriptTurn[];
    synthetic: boolean;
  }>;
  synthesis: string;
};

export type ReviewRecord = {
  itemKey: string;
  reviewer: string;
  score: number;
  verdict: "approve" | "revise";
  findings: string[];
};

export type JsonValue =
  string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
export type JsonRecord = { [key: string]: JsonValue };

export type RecordKind =
  "artefact" | "meeting" | "decision" | "interviews" | "review" | "event" | "human_input";

export type ProgrammeRecord = {
  kind: RecordKind;
  itemKey: string | null;
  title: string;
  /** Markdown or HTML body for artefacts; readable summary otherwise. */
  body: string;
  format: "markdown" | "html" | "json";
  actor: string;
  data: JsonRecord;
  createdAt: string;
};
