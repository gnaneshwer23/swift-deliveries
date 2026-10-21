import type { GeneratedPlan, PlanAssignedCapability, PlanCapabilityLimitation } from "./types";

const PLAN_META_PREFIX = "__dx_capability_meta__:";
const TASK_CAP_SUFFIX = /\n\n<!-- dx-capabilities: ([A-Z0-9,\-]+) -->\s*$/;

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

export function encodeTaskDescription(description: string, capabilityIds: string[]): string {
  const cleaned = description.replace(TASK_CAP_SUFFIX, "").trimEnd();
  if (capabilityIds.length === 0) return cleaned;
  return `${cleaned}\n\n<!-- dx-capabilities: ${capabilityIds.join(",")} -->`;
}

export function decodeTaskCapabilityIds(description: string): {
  description: string;
  capabilityIds: string[];
} {
  const match = description.match(TASK_CAP_SUFFIX);
  if (!match) {
    return { description, capabilityIds: [] };
  }
  return {
    description: description.replace(TASK_CAP_SUFFIX, "").trimEnd(),
    capabilityIds: match[1]!
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  };
}
