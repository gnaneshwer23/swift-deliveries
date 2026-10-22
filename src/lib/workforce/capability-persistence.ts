import type {
  GeneratedPlan,
  LifecycleStage,
  PlanAssignedCapability,
  PlanCapabilityLimitation,
  WfArtefact,
} from "./types";

const PLAN_META_PREFIX = "__dx_capability_meta__:";
const TASK_CAP_SUFFIX = /\n\n<!-- dx-capabilities: ([A-Z0-9,-]+) -->\s*$/;

export function encodePlanAcceptanceCriteria(plan: GeneratedPlan): string[] {
  const meta =
    PLAN_META_PREFIX +
    JSON.stringify({
      assignedCapabilities: plan.assignedCapabilities,
      capabilityLimitations: plan.capabilityLimitations,
    });
  return [meta, ...plan.acceptanceCriteria];
}

export function decodePlanCapabilityMeta(acceptanceCriteria: string[]): {
  criteria: string[];
  assignedCapabilities: PlanAssignedCapability[];
  capabilityLimitations: PlanCapabilityLimitation[];
} {
  const metaLine = acceptanceCriteria.find((c) => c.startsWith(PLAN_META_PREFIX));
  if (!metaLine) {
    return {
      criteria: acceptanceCriteria,
      assignedCapabilities: [],
      capabilityLimitations: [],
    };
  }
  try {
    const parsed = JSON.parse(metaLine.slice(PLAN_META_PREFIX.length)) as {
      assignedCapabilities?: PlanAssignedCapability[];
      capabilityLimitations?: PlanCapabilityLimitation[];
    };
    return {
      criteria: acceptanceCriteria.filter((c) => c !== metaLine),
      assignedCapabilities: parsed.assignedCapabilities ?? [],
      capabilityLimitations: parsed.capabilityLimitations ?? [],
    };
  } catch {
    return {
      criteria: acceptanceCriteria.filter((c) => c !== metaLine),
      assignedCapabilities: [],
      capabilityLimitations: [],
    };
  }
}

/** Task graph metadata persisted alongside the description until dedicated columns exist. */
export type TaskMeta = {
  key: string;
  dependsOn: string[];
  stage: LifecycleStage | null;
  gate: boolean;
  requiredSections: string[];
  produces: WfArtefact["kind"] | null;
};

const TASK_META_RE = /\n\n<!-- dx-task: (\{.*?\}) -->/;

export function encodeTaskDescription(
  description: string,
  capabilityIds: string[],
  meta?: Partial<TaskMeta>,
): string {
  let cleaned = description.replace(TASK_CAP_SUFFIX, "").replace(TASK_META_RE, "").trimEnd();
  if (meta && meta.key) {
    const compact: Partial<TaskMeta> = { key: meta.key };
    if (meta.dependsOn?.length) compact.dependsOn = meta.dependsOn;
    if (meta.stage) compact.stage = meta.stage;
    if (meta.gate) compact.gate = true;
    if (meta.requiredSections?.length) compact.requiredSections = meta.requiredSections;
    if (meta.produces) compact.produces = meta.produces;
    // `-->` inside JSON would terminate the comment early.
    cleaned += `\n\n<!-- dx-task: ${JSON.stringify(compact).replaceAll("--", "\\u002d\\u002d")} -->`;
  }
  if (capabilityIds.length === 0) return cleaned;
  return `${cleaned}\n\n<!-- dx-capabilities: ${capabilityIds.join(",")} -->`;
}

export function decodeTaskCapabilityIds(description: string): {
  description: string;
  capabilityIds: string[];
  meta: Partial<TaskMeta> | null;
} {
  const capMatch = description.match(TASK_CAP_SUFFIX);
  let rest = capMatch ? description.replace(TASK_CAP_SUFFIX, "") : description;
  let meta: Partial<TaskMeta> | null = null;
  const metaMatch = rest.match(TASK_META_RE);
  if (metaMatch) {
    try {
      meta = JSON.parse(metaMatch[1]!) as Partial<TaskMeta>;
    } catch {
      meta = null;
    }
    rest = rest.replace(TASK_META_RE, "");
  }
  return {
    description: rest.trimEnd(),
    capabilityIds: capMatch
      ? capMatch[1]!
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
    meta,
  };
}
