import { describe, expect, it } from "vitest";
import { STAGE_FIXTURES } from "./registry/eval-fixtures";
import { roleGuidance } from "./worker.server";

const prd = STAGE_FIXTURES.find((f) => f.stage === "prd")!;

describe("role guidance for a running task", () => {
  it("gives the lead role's instructions and rejects output that breaks its rules", () => {
    const g = roleGuidance({ key: "prd", capabilityIds: ["DX-023", "DX-021"] }, []);
    expect("extraInstructions" in g && g.extraInstructions).toMatch(/DX-023/);
    if (!("extraCheck" in g)) throw new Error("expected a check");
    expect(g.extraCheck(prd.good)).toBeNull();
    expect(g.extraCheck(prd.bad[0]!.output)).toMatch(/needs an ID/);
  });

  it("adds nothing for a stage no defined role leads", () => {
    expect(roleGuidance({ key: "architecture", capabilityIds: [] }, [])).toEqual({});
    expect(roleGuidance({ key: "gate_scope", capabilityIds: ["DX-001"] }, [])).toEqual({});
  });
});
