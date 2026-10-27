/** Stage 1 Supervised AI Workforce domain types (PRD v1.0). */

export const MISSION_INTENTS = ["investigate", "prototype", "improve", "build"] as const;
export type MissionIntent = (typeof MISSION_INTENTS)[number];

export const MISSION_STATUSES = [
  "draft",
  "needs_clarification",
  "planned",
  "awaiting_approval",
  "queued",
  "running",
  "reviewing",
  "paused",
  "completed",
  "partially_completed",
  "blocked",
  "failed",
  "cancelled",
] as const;
export type MissionStatus = (typeof MISSION_STATUSES)[number];

export const PERMISSION_LEVELS = [
  "plan",
  "create",
  "execute_internally",
  "act_externally",
] as const;
export type PermissionLevel = (typeof PERMISSION_LEVELS)[number];

export const QUALITY_LABELS = [
  "agent_reviewed",
  "automatically_tested",
  "human_reviewed",
  "externally_attested",
] as const;
export type QualityLabel = (typeof QUALITY_LABELS)[number];

export const EVIDENCE_CLASSES = [
  "sourced_facts",
  "assumptions",
  "inferences",
  "speculative",
] as const;
export type EvidenceClass = (typeof EVIDENCE_CLASSES)[number];

export const TASK_STATUSES = [
  "pending",
  "running",
  "completed",
  "skipped",
  "blocked",
  "failed",
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export type EvidenceItem = {
  classification: EvidenceClass;
  statement: string;
  source?: string;
};

export type ClarificationQuestion = {
  id: string;
  prompt: string;
  required: boolean;
};

/**
 * DXSI product lifecycle stages (vision §3). Every task in a `build` mission
 * belongs to exactly one stage; other intents leave `stage` undefined.
 */
export const LIFECYCLE_STAGES = [
  "capture",
  "discover",
  "define",
  "design",
  "build",
  "verify",
  "release",
  "evolve",
] as const;
export type LifecycleStage = (typeof LIFECYCLE_STAGES)[number];

export const LIFECYCLE_STAGE_LABELS: Record<LifecycleStage, string> = {
  capture: "1 · Capture the mission",
  discover: "2 · Discover & research",
  define: "3 · Define the opportunity",
  design: "4 · Design the solution",
  build: "5 · Coordinate the build",
  verify: "6 · Verify the product",
  release: "7 · Approve & release",
  evolve: "8 · Learn & evolve",
};

/** How an artefact's content was produced — always disclosed to the operator. */
export type GenerationMode = "model" | "simulated";

export type PlannedTask = {
  key: string;
  /** Task keys that must be completed before this task may run (DAG edges). */
  dependsOn?: string[];
  stage?: LifecycleStage;
  /** Human gate: never executed by an agent; completes only on explicit operator approval. */
  gate?: boolean;
  /** Markdown `## ` headings the produced artefact must contain (handoff contract). */
  requiredSections?: string[];
  /** Artefact kind this task produces, when it produces one. */
  produces?: WfArtefact["kind"];
  title: string;
  description: string;
  acceptanceCriteria: string;
  estimatedUsage: number;
  permissionRequired: PermissionLevel;
  isExternal: boolean;
  /** Wave 1 Available capability IDs assigned to this task (never Planned). */
  capabilityIds: string[];
};

export type PlanAssignedCapability = {
  capability_id: string;
  name: string;
  department: string;
  lifecycle_status: string;
  role_in_plan: string;
};

export type PlanCapabilityLimitation = {
  code: string;
  message: string;
  requested_department?: string;
  requested_capability_ids?: string[];
  alternative?: {
    summary: string;
    capability_ids: string[];
  };
};

export type GeneratedPlan = {
  summary: string;
  estimatedUsage: number;
  requiredPermission: PermissionLevel;
  includesExternalActions: boolean;
  clarificationQuestions: ClarificationQuestion[];
  acceptanceCriteria: string[];
  tasks: PlannedTask[];
  /** Only Available Wave 1 capabilities — never Planned presented as operational. */
  assignedCapabilities: PlanAssignedCapability[];
  capabilityLimitations: PlanCapabilityLimitation[];
};

export type WfWorkspace = {
  id: string;
  ownerId: string;
  name: string;
  usageCeiling: number;
  usageConsumed: number;
  /** Emergency stop: no new work starts while set. */
  stoppedAt: string | null;
  stopReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WfProject = {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type WfMissionPlan = {
  id: string;
  missionId: string;
  workspaceId: string;
  summary: string;
  estimatedUsage: number;
  requiredPermission: PermissionLevel;
  includesExternalActions: boolean;
  clarificationQuestions: ClarificationQuestion[];
  acceptanceCriteria: string[];
  assignedCapabilities: PlanAssignedCapability[];
  capabilityLimitations: PlanCapabilityLimitation[];
  /** Bumped on every change; an approval names the version it approved. */
  version: number;
  /** Fingerprint of the plan as shown (plan-hash.ts); null before migration 0024. */
  planHash: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WfMissionTask = {
  id: string;
  missionId: string;
  workspaceId: string;
  planId: string | null;
  sortOrder: number;
  title: string;
  description: string;
  acceptanceCriteria: string;
  status: TaskStatus;
  permissionRequired: PermissionLevel;
  isExternal: boolean;
  estimatedUsage: number;
  actualUsage: number;
  evidenceNotes: EvidenceItem[];
  capabilityIds: string[];
  /** Stable key within the mission plan; falls back to `t<sortOrder>` for legacy rows. */
  key: string;
  dependsOn: string[];
  stage: LifecycleStage | null;
  gate: boolean;
  requiredSections: string[];
  produces: WfArtefact["kind"] | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WfArtefact = {
  id: string;
  missionId: string;
  workspaceId: string;
  taskId: string | null;
  kind:
    | "brief"
    | "prototype_html"
    | "improvement_memo"
    | "delivery_report"
    | "note"
    | "mission_charter"
    | "research_dossier"
    | "tech_radar"
    | "prd"
    | "design_spec"
    | "architecture"
    | "test_report"
    | "release_pack"
    | "evolution_plan";
  title: string;
  content: string;
  contentFormat: "markdown" | "html" | "json";
  qualityLabels: QualityLabel[];
  evidenceItems: EvidenceItem[];
  createdAt: string;
  updatedAt: string;
};

export type WfApproval = {
  id: string;
  missionId: string;
  workspaceId: string;
  kind: "plan" | "external_action";
  status: "pending" | "approved" | "rejected";
  decidedBy: string | null;
  decidedAt: string | null;
  note: string | null;
  /** The plan version and fingerprint this approval is bound to. */
  planVersion: number | null;
  payloadHash: string | null;
  costLimit: number | null;
  expiresAt: string | null;
  /** Set when the plan changed after approval; an invalidated approval authorises nothing. */
  invalidatedAt: string | null;
  invalidatedReason: string | null;
  createdAt: string;
};

export type JsonValue =
  string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

/** One entry in the append-only mission event log (wf_mission_events). */
export type WfMissionEvent = {
  id: number;
  workspaceId: string;
  missionId: string | null;
  taskId: string | null;
  type: string;
  actorKind: "user" | "worker" | "system";
  actorId: string | null;
  data: { [key: string]: JsonValue };
  createdAt: string;
};

export type WfAuditEvent = {
  id: string;
  workspaceId: string;
  missionId: string | null;
  actorId: string | null;
  eventType: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
};

export type DeliveryReport = {
  headline: string;
  summary: string;
  outcomes: string[];
  openRisks: string[];
  qualitySummary: QualityLabel[];
  usageSpent: number;
};

export type WfMission = {
  id: string;
  workspaceId: string;
  projectId: string;
  intent: MissionIntent;
  title: string;
  requestText: string;
  status: MissionStatus;
  clarificationAnswers: Record<string, string>;
  permissionCeiling: PermissionLevel;
  externalActionsApproved: boolean;
  deliveryReport: DeliveryReport | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type MissionBundle = {
  mission: WfMission;
  plan: WfMissionPlan | null;
  tasks: WfMissionTask[];
  artefacts: WfArtefact[];
  approvals: WfApproval[];
  auditEvents: WfAuditEvent[];
};

export const PERMISSION_LABELS: Record<PermissionLevel, string> = {
  plan: "Plan",
  create: "Create",
  execute_internally: "Execute internally",
  act_externally: "Act externally",
};

export const QUALITY_LABEL_DISPLAY: Record<QualityLabel, string> = {
  agent_reviewed: "Agent-reviewed",
  automatically_tested: "Automatically tested",
  human_reviewed: "Human-reviewed",
  externally_attested: "Externally attested",
};

export const EVIDENCE_LABEL_DISPLAY: Record<EvidenceClass, string> = {
  sourced_facts: "Sourced facts",
  assumptions: "Assumptions",
  inferences: "Inferences",
  speculative: "Speculative",
};

export const STATUS_LABELS: Record<MissionStatus, string> = {
  draft: "Draft",
  needs_clarification: "Needs clarification",
  planned: "Planned",
  awaiting_approval: "Awaiting approval",
  queued: "Queued",
  running: "Running",
  reviewing: "Reviewing",
  paused: "Paused",
  completed: "Completed",
  partially_completed: "Partially completed",
  blocked: "Blocked",
  failed: "Failed",
  cancelled: "Cancelled",
};

export const INTENT_LABELS: Record<MissionIntent, string> = {
  investigate: "Investigate",
  prototype: "Prototype",
  improve: "Improve",
  build: "Build a product",
};
