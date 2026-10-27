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
  "DX-018",
  "DX-020",
  "DX-021",
  "DX-023",
  "DX-035",
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
    const others = listCapabilities().filter(
      (c) => !WAVE1.includes(c.capability_id as (typeof WAVE1)[number]),
    );
    expect(others.length).toBe(142);
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
    expect(
      match.assigned.every((a) => WAVE1.includes(a.capability_id as (typeof WAVE1)[number])),
    ).toBe(true);
    expect(match.limited).toBe(false);
  });

  it("discloses regulated healthcare work as out of scope", () => {
    const match = matchCapabilitiesForMission({
      intent: "investigate",
      requestText:
        "Investigate clinical literature on healthcare workflow bottlenecks for NHS patient pathways",
    });
    expect(match.limited).toBe(true);
    expect(match.limitations[0]?.code).toBe("out_of_scope");
    expect(match.limitations[0]?.message).toMatch(/Regulated healthcare/);
    expect(match.assigned.every((a) => a.lifecycle_status === "available")).toBe(true);
  });

  it("has no healthcare or publishing departments and keeps 15 x 10 roles", () => {
    const names = listDepartments().map((d) => d.name);
    expect(names).toContain("Future Technology and Foresight");
    expect(names).toContain("Product Analytics and Continuous Improvement");
    expect(names.some((n) => /Healthcare|Books/.test(n))).toBe(false);
    expect(listDepartments()).toHaveLength(15);
    expect(listDepartments().every((d) => d.capability_ids.length === 10)).toBe(true);
  });

  it("refuses to treat an explicitly requested Planned capability as Available", () => {
    const match = matchCapabilitiesForMission({
      intent: "prototype",
      requestText: "Prototype a settings page and also run DX-091 Emerging Technology Scout",
    });
    expect(match.assigned.some((a) => a.capability_id === "DX-091")).toBe(false);
    expect(match.limitations.some((l) => l.requested_capability_ids?.includes("DX-091"))).toBe(
      true,
    );
  });
});

describe("department mapping", () => {
  it("keeps every reassigned ID in its department under the current names", async () => {
    const { DEPARTMENT_MAPPING_HISTORY } = await import("./department-mapping");
    const current = DEPARTMENT_MAPPING_HISTORY[0]!;
    for (const change of current.changes) {
      const dept = listDepartments().find((d) => d.number === change.department)!;
      expect(dept.name).toBe(change.name);
      for (const r of change.reassigned) {
        expect(dept.capability_ids).toContain(r.id);
        expect(getCapability(r.id)!.lifecycle_status).not.toBe("available");
      }
    }
  });

  it("names no healthcare or publishing department", () => {
    for (const d of listDepartments())
      expect(d.name).not.toMatch(/healthcare|life sciences|books|publishing/i);
  });
});

describe("registry export", () => {
  it("matches the canonical registry (run npm run registry:export after changing it)", async () => {
    const { readFileSync } = await import("node:fs");
    const exported = JSON.parse(
      readFileSync(
        new URL("../../../../content/capabilities/registry.json", import.meta.url),
        "utf8",
      ),
    );
    delete exported._generated;
    expect(exported).toEqual(JSON.parse(JSON.stringify(getCapabilityRegistry())));
  });
});
