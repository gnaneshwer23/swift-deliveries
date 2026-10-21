import type { MissionIntent } from "../types";
import {
  getCapability,
  getIntentCapabilityIds,
  isAssignable,
  listCapabilities,
  listDepartments,
} from "./load";
import type {
  AssignedCapability,
  CapabilityMatchLimitation,
  CapabilityMatchResult,
  CapabilityRecord,
} from "./types";

/** Department keyword hints used to detect requests for unavailable specialist capacity. */
const DEPARTMENT_HINTS: Array<{ department: string; patterns: RegExp }> = [
  {
    department: "Healthcare and Life Sciences",
    patterns: [
      /\b(healthcare|clinical|biomedical|patient|pharma|life sciences?|HIPAA|NHS)\b/i,
    ],
  },
  {
    department: "Security, Privacy and Governance",
    patterns: [/\b(threat model|penetration|SOC 2|GDPR compliance audit)\b/i],
  },
  {
    department: "Growth and Marketing",
    patterns: [/\b(SEO campaign|social media campaign|brand strategy|growth experiment)\b/i],
  },
  {
    department: "Sales and Commercial Operations",
    patterns: [/\b(CRM update|sales forecast|RFP response|lead qualification)\b/i],
  },
  {
    department: "Finance, Legal and Governance",
    patterns: [/\b(financial model|unit economics|contract review|procurement)\b/i],
  },
  {
    department: "Books, Education and Publishing",
    patterns: [/\b(curriculum|textbook|course production|publishing)\b/i],
  },
];

const ROLE_HINTS: Array<{ id: string; patterns: RegExp }> = [
  { id: "DX-091", patterns: [/\bclinical literature\b/i] },
  { id: "DX-092", patterns: [/\bbiomedical research\b/i] },
  { id: "DX-100", patterns: [/\bclinical safety\b/i] },
];

function roleInPlan(capability: CapabilityRecord, intent: MissionIntent): string {
  switch (capability.capability_id) {
    case "DX-001":
      return "Coordinate mission status and surface decisions";
    case "DX-002":
      return "Frame the problem, outcome, and constraints";
    case "DX-011":
      return "Define research questions and methods";
    case "DX-012":
      return "Collect source-linked findings (stub)";
    case "DX-018":
      return "Verify evidence suitability for claims";
    case "DX-020":
      return "Synthesise facts, interpretations, and assumptions";
    case "DX-021":
      return "Capture discovery hypotheses and validation opportunities";
    case "DX-023":
      return "Structure product requirements and release criteria";
    case "DX-035":
      return "Produce wireframe / layout specifications";
    case "DX-041":
      return "Record architecture decisions and trade-offs";
    case "DX-049":
      return "Review proposed changes for correctness and coverage";
    case "DX-071":
      return "Define test strategy and exit criteria";
    default:
      return `${intent} support`;
  }
}

function toAssigned(capability: CapabilityRecord, intent: MissionIntent): AssignedCapability {
  return {
    capability_id: capability.capability_id,
    name: capability.name,
    department: capability.department,
    lifecycle_status: capability.lifecycle_status,
    role_in_plan: roleInPlan(capability, intent),
  };
}

function departmentHasAssignable(departmentName: string): boolean {
  return listCapabilities().some(
    (c) => c.department === departmentName && isAssignable(c),
  );
}

function detectUnavailableDepartments(requestText: string): string[] {
  const found: string[] = [];
  for (const hint of DEPARTMENT_HINTS) {
    if (hint.patterns.some((p) => p.test(requestText))) {
      if (!departmentHasAssignable(hint.department) && !found.includes(hint.department)) {
        found.push(hint.department);
      }
    }
  }
  return found;
}

function detectUnavailableCapabilityIds(requestText: string): string[] {
  const ids: string[] = [];
  for (const hint of ROLE_HINTS) {
    if (hint.patterns.some((p) => p.test(requestText))) {
      const cap = getCapability(hint.id);
      if (cap && !isAssignable(cap) && !ids.includes(hint.id)) {
        ids.push(hint.id);
      }
    }
  }
  // Explicit DX-NNN mentions for Planned roles
  const explicit = requestText.match(/\bDX-\d{3}\b/g) ?? [];
  for (const id of explicit) {
    const cap = getCapability(id);
    if (cap && !isAssignable(cap) && !ids.includes(id)) {
      ids.push(id);
    }
  }
  return ids;
}

/**
 * Match Available Wave 1 capabilities for a mission.
 *
 * Governance:
 * - Never silently substitute a Planned capability as operational.
 * - If the request needs an unavailable department (e.g. Healthcare DX-091+),
 *   disclose the limitation and offer a bounded alternative from Available roles.
 * - DX-148/DX-149 style monitoring may advise later; budget/permission ceilings
 *   remain deterministic infrastructure services (see registry infrastructure_services).
 */
export function matchCapabilitiesForMission(input: {
  intent: MissionIntent;
  requestText: string;
}): CapabilityMatchResult {
  const intentIds = getIntentCapabilityIds(input.intent);
  const assigned: AssignedCapability[] = [];

  for (const id of intentIds) {
    const cap = getCapability(id);
    if (!cap) continue;
    if (!isAssignable(cap)) {
      // Never assign Planned/Draft as if Available
      continue;
    }
    assigned.push(toAssigned(cap, input.intent));
  }

  const limitations: CapabilityMatchLimitation[] = [];
  const unavailableDepts = detectUnavailableDepartments(input.requestText);
  const unavailableIds = detectUnavailableCapabilityIds(input.requestText);

  for (const dept of unavailableDepts) {
    const deptMeta = listDepartments().find((d) => d.name === dept);
    const plannedIds = (deptMeta?.capability_ids ?? []).slice(0, 3);
    limitations.push({
      code: "department_unavailable",
      message: `${dept} capabilities are in the catalogue but not Available for missions yet (lifecycle: Planned). DeliverX will not silently substitute another department as if it were that specialist workforce.`,
      requested_department: dept,
      requested_capability_ids: plannedIds,
      alternative: {
        summary:
          "Bounded alternative: run this mission with Available Wave 1 research/product capabilities, clearly labelling specialist healthcare/domain claims as out of scope.",
        capability_ids: assigned.map((a) => a.capability_id),
      },
    });
  }

  for (const id of unavailableIds) {
    if (limitations.some((l) => l.requested_capability_ids?.includes(id))) continue;
    const cap = getCapability(id);
    limitations.push({
      code: "capability_not_available",
      message: `${id} (${cap?.name ?? "unknown"}) is registered as ${cap?.lifecycle_status ?? "planned"} — not operational. It will not be assigned to this mission.`,
      requested_capability_ids: [id],
      alternative: {
        summary: "Continue with Available Wave 1 roles only, or wait until this capability reaches Available after evaluation.",
        capability_ids: assigned.map((a) => a.capability_id),
      },
    });
  }

  return {
    assigned,
    limited: limitations.length > 0,
    limitations,
  };
}

/** Hard filter: planner/executor may only schedule these IDs. */
export function assertOnlyAssignable(ids: string[]): string[] {
  return ids.filter((id) => {
    const cap = getCapability(id);
    return cap ? isAssignable(cap) : false;
  });
}
