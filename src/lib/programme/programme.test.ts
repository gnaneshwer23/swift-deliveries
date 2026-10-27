import { describe, expect, it } from "vitest";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { allStaffed, generateRoadmap } from "./blueprint";
import { deliberate, SUPERMAJORITY } from "./deliberation";
import {
  createProgramme,
  decideGate,
  executeItem,
  latestDecisions,
  planNextStep,
  programmeMetrics,
  reputation,
  settle,
} from "./engine";
import { buildProgrammeExport } from "./export";
import { crc32, createZip } from "./zip";
import { validateTaskGraph } from "@/lib/workforce/graph";
import type { BusinessCase, DecisionSpec, ProgrammeRecord, ProgrammeState } from "./types";

const BC: BusinessCase = {
  name: "PayNudge",
  idea: "An invoicing and late-payment assistant that drafts invoices, tracks payment status and nudges clients politely.",
  targetUsers: "UK freelancers, small creative agencies",
  problem: "Freelancers lose hours chasing late payments and cash flow suffers.",
  goals: "500 paying users in 6 months; reduce average days-to-paid by 30%.",
  constraints: "UK only at launch; no storing card details.",
  timelineWeeks: 16,
  budgetCredits: 400,
};

type GateHandler = (
  gateKey: string,
  state: ProgrammeState,
  records: ProgrammeRecord[],
) => "approve" | "reject";

function run(
  opts: { id?: string; bc?: Partial<BusinessCase>; onGate?: GateHandler; maxSteps?: number } = {},
) {
  let state = createProgramme(opts.id ?? "prog-1", { ...BC, ...opts.bc }, "2026-10-22T00:00:00Z");
  let records: ProgrammeRecord[] = [];
  const gates: string[] = [];
  for (let step = 0; step < (opts.maxSteps ?? 200); step++) {
    const plan = planNextStep(state, records);
    if (plan.type === "execute") {
      const r = executeItem(state, records, plan.item, { now: `t${step}` });
      state = r.state;
      records = [...records, ...r.records];
      continue;
    }
    if (plan.type === "gate") {
      gates.push(plan.item.key);
      const choice = opts.onGate?.(plan.item.key, state, records) ?? "approve";
      const r = decideGate(state, records, plan.item.key, {
        approve: choice === "approve",
        choices: {},
        note: choice === "approve" ? "" : "Tighten the scope and cite the segment decision.",
        actor: "operator",
        now: `g${step}`,
      });
      state = r.state;
      records = [...records, ...r.records];
      continue;
    }
    state = settle(state, plan, "end");
    break;
  }
  return { state, records, gates };
}

describe("roadmap blueprint", () => {
  it("staffs all 150 roles for short, medium and long timelines", () => {
    for (const weeks of [6, 16, 52]) {
      const r = generateRoadmap({ ...BC, timelineWeeks: weeks }, "x");
      expect(allStaffed(r).size).toBe(150);
      const v = validateTaskGraph(r.items.map((i, idx) => ({ ...i, sortOrder: idx })));
      expect(v.ok).toBe(true);
    }
  });

  it("orders phases sequentially within the timeline", () => {
    const r = generateRoadmap(BC, "x");
    for (let i = 1; i < r.phases.length; i++) {
      expect(r.phases[i]!.startWeek).toBeGreaterThanOrEqual(r.phases[i - 1]!.startWeek);
    }
    expect(r.phases.at(-1)!.endWeek).toBeLessThanOrEqual(BC.timelineWeeks);
  });
});

describe("deliberation protocol", () => {
  const spec = (overrides: Partial<DecisionSpec> = {}): DecisionSpec => ({
    key: "T1",
    question: "Test?",
    owner: "DX-041",
    panel: ["DX-061", "DX-131", "DX-042", "DX-031", "DX-101", "DX-071"],
    domainDepartments: [5],
    impact: "medium",
    options: [
      {
        id: "safe",
        label: "Safe",
        summary: "",
        scores: {
          customer_value: 0.6,
          business_value: 0.6,
          cost: 0.6,
          risk: 0.8,
          time_to_market: 0.6,
          evidence: 0.6,
          feasibility: 0.8,
        },
      },
      {
        id: "risky",
        label: "Risky",
        summary: "",
        scores: {
          customer_value: 0.9,
          business_value: 0.9,
          cost: 0.9,
          risk: 0.1,
          time_to_market: 0.9,
          evidence: 0.6,
          feasibility: 0.6,
        },
      },
    ],
    ...overrides,
  });

  it("vetoed options are never chosen, whatever their popularity", () => {
    const d = deliberate(spec(), "s");
    expect(d.vetoes.some((v) => v.optionId === "risky" && v.capabilityId === "DX-061")).toBe(true);
    expect(d.chosenOptionId).toBe("safe");
    expect(d.tally.find((t) => t.optionId === "risky")!.vetoed).toBe(true);
    // Everyone who backed the vetoed option had to move, and says why.
    for (const p of d.round2.filter((x) => x.revisedFrom === "risky"))
      expect(p.persuadedBy).toBe("DX-061");
  });

  it("escalates to the operator when no option reaches the supermajority", () => {
    const flat = {
      customer_value: 0.5,
      business_value: 0.5,
      cost: 0.5,
      risk: 0.5,
      time_to_market: 0.5,
      evidence: 0.5,
      feasibility: 0.5,
    };
    const d = deliberate(
      spec({
        options: [
          {
            id: "a",
            label: "A",
            summary: "",
            scores: { ...flat, customer_value: 0.9, risk: 0.35 },
          },
          { id: "b", label: "B", summary: "", scores: { ...flat, risk: 0.9, cost: 0.9 } },
        ],
        panel: ["DX-061", "DX-062", "DX-131", "DX-031", "DX-032", "DX-101"],
      }),
      "s",
    );
    const top = d.tally[0]!;
    if (top.share < SUPERMAJORITY) {
      expect(d.outcome).toBe("escalated");
      expect(d.needsHumanRatification).toBe(true);
    } else {
      expect(d.outcome).toBe("adopted");
    }
  });

  it("high-impact decisions always need human ratification", () => {
    expect(deliberate(spec({ impact: "high" }), "s").needsHumanRatification).toBe(true);
  });

  it("positions are formed through different department lenses", () => {
    const d = deliberate(spec(), "s");
    expect(new Set(d.round1.map((p) => p.rationale)).size).toBeGreaterThan(1);
  });
});

describe("end-to-end programme (simulated mode)", () => {
  it("runs from business case to evolution plan with the whole workforce", () => {
    const { state, records, gates } = run();
    expect(state.status).toBe("completed");
    expect(gates).toEqual(["gate_discovery", "gate_scope", "gate_design", "gate_release"]);
    const m = programmeMetrics(state, records);
    expect(m.engagedRoles).toBe(150);
    expect(m.staffing.catalogueSelected).toBeLessThanOrEqual(m.staffing.catalogueCeiling);
    expect(m.staffing.catalogueSelected).toBeLessThan(150); // banded cast — not always ceiling
    expect(state.staffing?.band).toBeTruthy();
    expect(m.departments.every((d) => d.engaged === 10)).toBe(true);
    expect(m.decisions.total).toBe(5);
    expect(m.meetings).toBeGreaterThanOrEqual(10);
    expect(m.reviewAverage).toBeGreaterThanOrEqual(70);
    expect(state.budget.consumed).toBeLessThanOrEqual(state.budget.ceiling);
    // All high-impact decisions were ratified by the operator.
    for (const d of latestDecisions(records).filter((x) => x.needsHumanRatification))
      expect(d.human).toBeDefined();
    // The verification report passed and the prototype exists.
    expect(records.find((r) => r.itemKey === "verification")!.body).toContain("**PASS**");
    expect(records.some((r) => r.format === "html")).toBe(true);
  });

  it("completes even when the business case is terse", () => {
    const { state, records } = run({
      bc: {
        problem: "late payments",
        goals: "500 users",
        constraints: "",
        targetUsers: "freelancers",
      },
    });
    expect(state.status).toBe("completed");
    expect(latestDecisions(records)).toHaveLength(5);
  });

  it("later deliverables cite the decisions they depend on", () => {
    const { records } = run();
    const segment = latestDecisions(records).find((d) => d.key.startsWith("D1"))!;
    const label = segment.options.find(
      (o) => o.id === (segment.human?.optionId ?? segment.chosenOptionId),
    )!.label;
    const prd = records.filter((r) => r.kind === "artefact" && r.itemKey === "prd").at(-1)!;
    expect(prd.body).toContain(label);
  });

  it("vetoes show up in real decisions (no-code stack is blocked on security risk)", () => {
    const { records } = run();
    const stack = latestDecisions(records).find((d) => d.key.startsWith("D3"))!;
    expect(stack.vetoes.some((v) => v.optionId === "stack-nocode")).toBe(true);
    expect(stack.chosenOptionId).not.toBe("stack-nocode");
  });

  it("rejecting a gate sends the phase back for rework with the operator's note", () => {
    let rejected = false;
    const { state, records } = run({
      onGate: (key) => {
        if (key === "gate_scope" && !rejected) {
          rejected = true;
          return "reject";
        }
        return "approve";
      },
    });
    expect(state.status).toBe("completed");
    expect(records.filter((r) => r.data["type"] === "gate_rework")).toHaveLength(1);
    const prdVersions = records.filter((r) => r.kind === "artefact" && r.itemKey === "prd");
    expect(prdVersions).toHaveLength(2);
    expect(prdVersions[1]!.body).toContain("Operator feedback addressed");
  });

  it("stops at the rework limit and reports a partial programme", () => {
    const { state } = run({ onGate: (key) => (key === "gate_design" ? "reject" : "approve") });
    expect(state.status).toBe("partially_completed");
    expect(state.roadmap.items.find((i) => i.key === "gate_design")!.status).toBe("failed");
    expect(state.roadmap.items.find((i) => i.key === "sprint1_planning")!.status).toBe("blocked");
  });

  it("hard-stops at the programme budget and waits for the operator", () => {
    let state = createProgramme("p", { ...BC, budgetCredits: 20 }, "t");
    let records: ProgrammeRecord[] = [];
    let plan = planNextStep(state, records);
    while (plan.type === "execute") {
      const r = executeItem(state, records, plan.item, { now: "t" });
      state = r.state;
      records = [...records, ...r.records];
      plan = planNextStep(state, records);
    }
    expect(plan.type).toBe("budget");
    expect(state.budget.consumed).toBeLessThanOrEqual(20);
  });

  it("is reproducible: the same inputs replay identical decisions", () => {
    const a = latestDecisions(run({ id: "same" }).records);
    const b = latestDecisions(run({ id: "same" }).records);
    expect(a.map((d) => [d.key, d.chosenOptionId, d.confidence])).toEqual(
      b.map((d) => [d.key, d.chosenOptionId, d.confidence]),
    );
  });

  it("builds a judgement track record for the roles", () => {
    const rep = reputation(run().records);
    expect(rep.length).toBeGreaterThan(40);
    expect(rep.every((r) => r.score > 0 && r.score < 1)).toBe(true);
  });
});

describe("export", () => {
  it("packages the entire programme into a valid zip", () => {
    const { state, records } = run();
    const files = buildProgrammeExport(state, records);
    const paths = files.map((f) => f.path);
    expect(paths.some((p) => p.endsWith("/README.md"))).toBe(true);
    expect(paths.some((p) => p.includes("/operations/decisions/"))).toBe(true);
    expect(paths.some((p) => p.endsWith("/operations/tasks.csv"))).toBe(true);
    const manifest = JSON.parse(
      files.find((f) => f.path.endsWith("/project-manifest.json"))!.content,
    );
    expect(manifest.completeness.productionSourceCode).toBe(false);
    expect(manifest.completeness.customerInterviews.real).toBe(0);
    expect(manifest.inventory.length).toBe(files.length);
    expect(paths.some((p) => p.includes("/meetings/"))).toBe(true);
    expect(paths.some((p) => p.endsWith(".html"))).toBe(true);
    expect(paths.some((p) => p.endsWith("/workforce.md"))).toBe(true);
    const workforce = files.find((f) => f.path.endsWith("/workforce.md"))!.content;
    expect(workforce.split("\n").filter((l) => l.startsWith("| DX-"))).toHaveLength(150);

    const zip = createZip(files);
    expect(new DataView(zip.buffer).getUint32(0, true)).toBe(0x04034b50);
    expect(crc32(new TextEncoder().encode("hello"))).toBe(0x3610a686);
    writeFileSync(join(tmpdir(), "dx-programme-export-test.zip"), zip);
  });
});
