import { describe, expect, it } from "vitest";
import {
  WAVE1_AVAILABLE_IDS,
  getCapability,
  getCapabilityRegistry,
  isAssignable,
  isOperational,
  listCapabilities,
  listDepartments,
  listInfrastructureServices,
} from "./index";
import { matchCapabilitiesForMission } from "./matching";

const WAVE1 = [
  "DX-001",
  "DX-002",
  "DX-011",
  "DX-012",
  "DX-018",
  "DX-020",
  "DX-021",
  "DX-023",
  "DX-035",
  "DX-041",
  "DX-049",
  "DX-071",
] as const;

describe("capability registry", () => {
  it("contains exactly 150 unique DX roles", () => {
    const caps = listCapabilities();
    expect(caps).toHaveLength(150);
    const ids = caps.map((c) => c.capability_id);
    expect(new Set(ids).size).toBe(150);
    expect(ids.every((id) => /^DX-\d{3}$/.test(id))).toBe(true);
  });

  it("covers 15 departments", () => {
    expect(listDepartments()).toHaveLength(15);
    expect(getCapabilityRegistry().departments).toHaveLength(15);
  });

  it("marks only Wave 1 IDs as Available", () => {
    expect([...WAVE1_AVAILABLE_IDS].sort()).toEqual([...WAVE1].sort());
    for (const id of WAVE1) {
      const cap = getCapability(id);
      expect(cap, id).toBeDefined();
      expect(cap!.lifecycle_status).toBe("available");
      expect(isAssignable(cap!)).toBe(true);
      expect(isOperational(cap!.lifecycle_status)).toBe(true);
    }
    const others = listCapabilities().filter((c) => !WAVE1.includes(c.capability_id as (typeof WAVE1)[number]));
    expect(others.length).toBe(138);
    for (const cap of others) {
      expect(["planned", "draft"]).toContain(cap.lifecycle_status);
      expect(isAssignable(cap)).toBe(false);
      expect(isOperational(cap.lifecycle_status)).toBe(false);
    }
  });

  it("includes required Part 6 fields on every capability", () => {
    for (const cap of listCapabilities()) {
      expect(cap.capability_id).toBeTruthy();
      expect(cap.name).toBeTruthy();
      expect(cap.department).toBeTruthy();
      expect(cap.description).toBeTruthy();
      expect(cap.implementation_type).toBeTruthy();
      expect(cap.lifecycle_status).toBeTruthy();
      expect(cap.version).toBeTruthy();
      expect(Array.isArray(cap.tool_allowlist)).toBe(true);
      expect(cap.permission_profile).toBeTruthy();
      expect(cap.limits).toBeTruthy();
      expect(cap.owner).toBeTruthy();
      expect(cap.evaluation_notes).toBeTruthy();
      expect(Array.isArray(cap.known_limitations)).toBe(true);
    }
  });

  it("marks budget, permissions, and audit as non-agent infrastructure", () => {
    const infra = listInfrastructureServices();
    expect(infra.length).toBeGreaterThanOrEqual(3);
    expect(infra.every((s) => s.is_agent === false)).toBe(true);
    expect(infra.every((s) => s.implementation_type === "deterministic_service")).toBe(true);
    const ids = infra.map((s) => s.service_id);
    expect(ids).toEqual(expect.arrayContaining(["svc-budget", "svc-permissions", "svc-audit"]));
  });
});

describe("capability matching", () => {
  it("assigns only Available Wave 1 roles for investigate", () => {
    const match = matchCapabilitiesForMission({
      intent: "investigate",
      requestText:
        "Investigate whether we should add a sponsor dashboard for delivery leads, for the COO audience",
    });
    expect(match.assigned.length).toBeGreaterThan(0);
    expect(match.assigned.every((a) => a.lifecycle_status === "available")).toBe(true);
    expect(match.assigned.every((a) => WAVE1.includes(a.capability_id as (typeof WAVE1)[number]))).toBe(
      true,
    );
    expect(match.limited).toBe(false);
  });

  it("discloses healthcare department limitation without silent substitution", () => {
    const match = matchCapabilitiesForMission({
      intent: "investigate",
      requestText:
        "Investigate clinical literature on healthcare workflow bottlenecks for NHS patient pathways",
    });
    expect(match.limited).toBe(true);
    expect(match.limitations.some((l) => l.code === "department_unavailable")).toBe(true);
    expect(match.limitations[0]?.requested_department).toMatch(/Healthcare/i);
    expect(match.limitations[0]?.alternative?.capability_ids.length).toBeGreaterThan(0);
    // Never assigns Planned healthcare IDs (DX-091+)
    expect(match.assigned.every((a) => Number(a.capability_id.slice(3)) < 91)).toBe(true);
    expect(match.assigned.every((a) => a.lifecycle_status === "available")).toBe(true);
  });

  it("refuses to treat an explicitly requested Planned capability as Available", () => {
    const match = matchCapabilitiesForMission({
      intent: "prototype",
      requestText: "Prototype a settings page and also run DX-091 Clinical Literature Agent",
    });
    expect(match.assigned.some((a) => a.capability_id === "DX-091")).toBe(false);
    expect(match.limitations.some((l) => l.requested_capability_ids?.includes("DX-091"))).toBe(true);
  });
});
