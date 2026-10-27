import { describe, expect, it } from "vitest";
import { STAGE_CONTRACTS } from "../lifecycle";
import { listAssignableCapabilities, listCapabilities } from "./load";
import { ROLE_EVALUATIONS, roleEvaluation } from "./evaluations";
import { CONTEXT_SCOPES, ROLE_SPECS, getRoleSpec, roleLimits } from "./roles";

describe("role definitions", () => {
  it("defines exactly the roles that can be assigned", () => {
    const assignable = listAssignableCapabilities()
      .map((c) => c.capability_id)
      .sort();
    expect(ROLE_SPECS.map((r) => r.id).sort()).toEqual(assignable);
  });

  it("gives every role a purpose, limits, escalation and the always-on rules", () => {
    for (const r of ROLE_SPECS) {
      expect(r.purpose.length, r.id).toBeGreaterThan(30);
      expect(
        r.mustNot.some((m) => /invent customers/i.test(m)),
        r.id,
      ).toBe(true);
      expect(r.escalateWhen.length, r.id).toBeGreaterThan(0);
      expect(
        r.inputs.some((i) => i.required),
        r.id,
      ).toBe(true);
      expect(
        r.mustNot.some((m) => /assumption or inference as a sourced fact/i.test(m)),
        r.id,
      ).toBe(true);
      expect(roleLimits(r.id).timeoutSeconds, r.id).toBeGreaterThan(0);
      expect(
        r.contextScopes.every((s) => CONTEXT_SCOPES.includes(s)),
        r.id,
      ).toBe(true);
    }
  });

  it("only leads stages that have a handoff contract", () => {
    for (const r of ROLE_SPECS)
      for (const lead of r.leads)
        expect(STAGE_CONTRACTS[lead.stage], `${r.id} ${lead.stage}`).toBeDefined();
  });

  it("uses no tools until a tool is built and checked", () => {
    for (const r of ROLE_SPECS) expect(r.tools, r.id).toEqual([]);
  });

  it("records evaluations only for defined roles, each with its run, and none otherwise", () => {
    for (const [id, e] of Object.entries(ROLE_EVALUATIONS)) {
      expect(getRoleSpec(id), id).toBeDefined();
      expect(["passed", "failed"]).toContain(e.status);
      expect(e.suiteVersion && e.ranAt && e.model, id).toBeTruthy();
    }
    for (const r of ROLE_SPECS)
      if (!ROLE_EVALUATIONS[r.id]) expect(roleEvaluation(r.id).status).toBe("not_evaluated");
  });

  it("keeps planned roles out of the definitions", () => {
    for (const c of listCapabilities())
      if (c.lifecycle_status !== "available") expect(getRoleSpec(c.capability_id)).toBeUndefined();
  });
});
