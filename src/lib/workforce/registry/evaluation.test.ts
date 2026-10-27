import { describe, expect, it } from "vitest";
import { FIXTURE_LABEL, STAGE_FIXTURES } from "./eval-fixtures";
import { runFixtureChecks, runModelEvaluation, type StageGenerator } from "./evaluation";
import { INSTRUCTION_VERSIONS, leadRole, roleInstructions, stageForTask } from "./instructions";
import {
  acknowledgesConflict,
  checkStageOutput,
  citableSources,
  SOURCE_NAMES,
} from "./output-checks";
import { ROLE_SPECS } from "./roles";

describe("role evaluation suites", () => {
  it.each(ROLE_SPECS.map((r) => [r.id]))("%s: its checks pass every fixture case", (id) => {
    const cases = runFixtureChecks(id);
    expect(cases.length).toBeGreaterThan(0);
    for (const c of cases) expect(c.passed, `${c.stage} · ${c.name}: ${c.detail}`).toBe(true);
  });

  it("covers every stage a role leads with a good and at least one bad fixture", () => {
    for (const r of ROLE_SPECS)
      for (const { stage } of r.leads) {
        const f = STAGE_FIXTURES.find((x) => x.stage === stage);
        expect(f, `${r.id} ${stage}`).toBeDefined();
        expect(f!.bad.length).toBeGreaterThan(0);
      }
    expect(FIXTURE_LABEL).toMatch(/not real data/);
  });

  it.each(ROLE_SPECS.map((r) => [r.id]))("%s: reports not run without a model", async (id) => {
    expect((await runModelEvaluation(id, null)).status).toBe("not_run");
  });

  it("grades a model's output with the same checks, and fails a bad one", async () => {
    const good: StageGenerator = async ({ stage }) => ({
      content: STAGE_FIXTURES.find((f) => f.stage === stage)!.good,
      mode: "model",
      model: "fixture-model",
    });
    const bad: StageGenerator = async ({ stage }) => ({
      content: STAGE_FIXTURES.find((f) => f.stage === stage)!.bad[0]!.output,
      mode: "model",
      model: "fixture-model",
    });
    expect(await runModelEvaluation("DX-023", good)).toMatchObject({ status: "passed" });
    expect(await runModelEvaluation("DX-023", bad)).toMatchObject({ status: "failed" });
    const simulated: StageGenerator = async () => ({ content: "", mode: "simulated", note: "x" });
    expect(await runModelEvaluation("DX-023", simulated)).toMatchObject({ status: "not_run" });
  });
});

describe("role instructions", () => {
  it("gives every model-workflow role a version and instructions for each stage it leads", () => {
    for (const r of ROLE_SPECS) {
      if (r.executionMode !== "model_workflow") continue;
      expect(INSTRUCTION_VERSIONS[r.id], r.id).toMatch(new RegExp(`^${r.id}@\\d+$`));
      for (const { stage } of r.leads) {
        const ins = roleInstructions(r.id, stage)!;
        expect(ins.text).toContain(r.id);
        expect(ins.text).toMatch(/Never invent customers/);
      }
    }
  });

  it("picks the first role on a task that leads its stage", () => {
    expect(stageForTask("release_pack")).toBe("release");
    expect(stageForTask("gate_scope")).toBeNull();
    expect(leadRole({ key: "research", capabilityIds: ["DX-018", "DX-020"] })).toBe("DX-018");
    expect(leadRole({ key: "market", capabilityIds: ["DX-021", "DX-020"] })).toBe("DX-021");
    expect(leadRole({ key: "architecture", capabilityIds: [] })).toBeNull();
  });
});

describe("citable sources", () => {
  it("lists clarification answers only when the mission has some", () => {
    expect(citableSources({}, ["Charter"])).toEqual([SOURCE_NAMES.request, "Charter"]);
    expect(citableSources({ users: "  " }, [])).toEqual([SOURCE_NAMES.request]);
    expect(citableSources({ users: "tutors" }, [])).toEqual([
      SOURCE_NAMES.request,
      SOURCE_NAMES.clarifications,
    ]);
  });
});

describe("PRD claim checks", () => {
  const ctx = { founderEvidence: false, sources: ["mission request"] };
  const prd = (problem: string) => `## Problem statement
${problem}

## Target users
- [Assumption] Independent tutors.

## Value proposition
Booking without messages.

## Requirements
- R1: A student can book a slot.

## Acceptance criteria
- R1: A booked slot leaves the open list.

## Success metrics
- Bookings made without a message.

## Risks
- Stale availability.

## Out of scope
- Payments in the first release.`;
  const failures = (problem: string) => checkStageOutput("prd", prd(problem), ctx).failures;

  it("accepts a cited input by its exact name, never a fragment of it", () => {
    expect(failures("- [Sourced fact] Bookings are by message (Source: Mission Request.)")).toEqual(
      [],
    );
    expect(failures("- [Sourced fact] Bookings are by message (Source: mission re)")).toEqual([
      "Problem statement: sourced fact(s) cite a source that was not given",
    ]);
  });

  it("needs a claim after the label, and lets sub-headings organise claims", () => {
    expect(failures("- [Assumption]")).toEqual([
      "Problem statement: 1 claim(s) without an evidence label",
    ]);
    expect(failures("### Today\n- [Inference] Tutors lose bookings.")).toEqual([]);
  });
});

describe("acknowledging conflicting evidence", () => {
  it("accepts an affirmative statement in any inflection", () => {
    expect(acknowledgesConflict("The two call notes conflict on booking day.")).toBe(true);
    expect(acknowledgesConflict("- [Inference] Conflicting evidence: Sundays and Mondays.")).toBe(
      true,
    );
  });
  it("rejects a denial or no mention", () => {
    expect(acknowledgesConflict("No conflict is present.")).toBe(false);
    expect(acknowledgesConflict("The sources are not in conflict.")).toBe(false);
    expect(acknowledgesConflict("Tutors book on Sundays.")).toBe(false);
  });
});
