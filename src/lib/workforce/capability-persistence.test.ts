import { describe, expect, it } from "vitest";
import {
  decodePlanCapabilityMeta,
  decodeTaskCapabilityIds,
  encodePlanAcceptanceCriteria,
  encodeTaskDescription,
} from "./capability-persistence";
import type { GeneratedPlan } from "./types";

const samplePlan: GeneratedPlan = {
  summary: "test",
  estimatedUsage: 10,
  requiredPermission: "create",
  includesExternalActions: false,
  clarificationQuestions: [],
  acceptanceCriteria: ["Ship a brief"],
  tasks: [],
  assignedCapabilities: [
    {
      capability_id: "DX-001",
      name: "Chief of Staff Agent",
      department: "Executive Intelligence",
      lifecycle_status: "available",
      role_in_plan: "Coordinate",
    },
  ],
  capabilityLimitations: [
    {
      code: "department_unavailable",
      message: "Healthcare not Available",
      requested_department: "Healthcare and Life Sciences",
      alternative: { summary: "Use Wave 1", capability_ids: ["DX-001"] },
    },
  ],
};

describe("capability persistence encoding", () => {
  it("round-trips plan capability metadata through acceptance criteria", () => {
    const encoded = encodePlanAcceptanceCriteria(samplePlan);
    const decoded = decodePlanCapabilityMeta(encoded);
    expect(decoded.criteria).toEqual(["Ship a brief"]);
    expect(decoded.assignedCapabilities).toEqual(samplePlan.assignedCapabilities);
    expect(decoded.capabilityLimitations[0]?.code).toBe("department_unavailable");
  });

  it("round-trips task capability ids through description", () => {
    const encoded = encodeTaskDescription("Do the work", ["DX-011", "DX-012"]);
    const decoded = decodeTaskCapabilityIds(encoded);
    expect(decoded.description).toBe("Do the work");
    expect(decoded.capabilityIds).toEqual(["DX-011", "DX-012"]);
  });
});
