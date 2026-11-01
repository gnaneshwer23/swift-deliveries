import { describe, expect, it } from "vitest";
import { buildCompanyRecord, durationBetween, type TaskRunRecord } from "./company-record";
import { deliveryBundle } from "./delivery-test-fixtures";
import { baseMission } from "./test-fixtures";
import type { SupervisedMission } from "./types";
import type { WfMissionEvent } from "@/lib/workforce/types";

const EXPORTED = "2026-11-01T09:00:00Z";

const mission = (over: Partial<SupervisedMission> = {}) =>
  baseMission({
    activity: [
      {
        id: "a1",
        at: "2026-10-30T09:00:00Z",
        taskKey: null,
        kind: "mission.created",
        summary: "Project created",
        actor: "human",
      },
    ],
    ...over,
  });

const event = (id: number, over: Partial<WfMissionEvent>): WfMissionEvent => ({
  id,
  workspaceId: "w",
  missionId: "m",
  taskId: null,
  type: "task.started",
  actorKind: "worker",
  actorId: "worker-1",
  data: {},
  createdAt: "2026-10-31T10:00:00Z",
  ...over,
});

const run = (over: Partial<TaskRunRecord>): TaskRunRecord => ({
  taskId: "task-charter",
  attempt: 1,
  status: "completed",
  workerId: "worker-1",
  provider: null,
  model: null,
  modelCalls: 0,
  inputTokens: null,
  outputTokens: null,
  latencyMs: 12,
  roleId: null,
  instructionVersion: null,
  failureClass: null,
  startedAt: "2026-10-31T09:58:30Z",
  finishedAt: "2026-10-31T10:00:00Z",
  ...over,
});

const file = (r: ReturnType<typeof buildCompanyRecord>, path: string) =>
  r.files.find((f) => f.path === path)?.content ?? "";

describe("durationBetween", () => {
  it("formats recorded spans and refuses missing or reversed times", () => {
    expect(durationBetween("2026-10-31T10:00:00Z", "2026-10-31T11:04:09Z")).toBe("1h 4m 9s");
    expect(durationBetween("2026-10-31T10:00:00Z", "2026-10-31T10:00:05Z")).toBe("5s");
    expect(durationBetween(null, "2026-10-31T10:00:00Z")).toBeNull();
    expect(durationBetween("2026-10-31T11:00:00Z", "2026-10-31T10:00:00Z")).toBeNull();
  });
});

describe("buildCompanyRecord", () => {
  it("before delivery: lists the record files and says the build has not started", () => {
    const r = buildCompanyRecord({
      mission: mission(),
      delivery: null,
      events: [],
      runs: [],
      exportedAt: EXPORTED,
    });
    expect(r.files.map((f) => f.path)).toEqual([
      "company/README.md",
      "company/org-chart.md",
      "company/timeline.md",
      "company/timeline.csv",
      "company/decisions.md",
      "company/handoffs.md",
      "company/usage-ledger.md",
      "company/usage-ledger.csv",
      "company/record.html",
    ]);
    expect(r.summary.workOrders).toBe(0);
    expect(r.summary.gaps).toEqual([]);
    expect(file(r, "company/handoffs.md")).toContain("Delivery has not started");
    expect(file(r, "company/timeline.md")).toContain("| You | Project owner | Project created |");
  });

  it("writes one work order per build task with its brief, owner, times and runs", () => {
    const bundle = deliveryBundle(
      { charter: "completed", market: "running" },
      { artefactsFor: ["charter"], modelFor: ["charter"] },
    );
    const r = buildCompanyRecord({
      mission: mission(),
      delivery: bundle,
      events: [
        event(1, {
          taskId: "task-charter",
          type: "task.started",
          createdAt: "2026-10-31T09:58:30Z",
        }),
        event(2, {
          taskId: "task-charter",
          type: "task.completed",
          createdAt: "2026-10-31T10:00:00Z",
        }),
      ],
      runs: [
        run({
          provider: "anthropic",
          model: "test-model",
          modelCalls: 2,
          inputTokens: 900,
          outputTokens: 400,
        }),
      ],
      exportedAt: EXPORTED,
    });
    expect(r.summary.workOrders).toBe(bundle.tasks.length);
    const wo = file(r, "company/work-orders/01-charter.md");
    expect(wo).toContain("# Work order 01 —");
    expect(wo).toContain("| Owner | Aria ·");
    expect(wo).toContain("| Started | 2026-10-31T09:58:30Z |");
    expect(wo).toContain("| Time taken | 1m 30s |");
    expect(wo).toContain("anthropic · test-model");
    expect(wo).toContain("| 2 | 900 / 400 |");
    expect(wo).toContain("`delivery/01-charter.md`");
    // The completed event links the file it produced.
    const tl = file(r, "company/timeline.md");
    expect(tl).toContain("`delivery/01-charter.md`");
    expect(tl.indexOf("Project created")).toBeLessThan(tl.indexOf("2026-10-31T09:58:30Z"));
    // Gates are the owner's, never an agent's.
    const gate = r.files.find((f) => /work-orders\/\d+-gate_scope\.md$/.test(f.path))!.content;
    expect(gate).toContain("| Owner | You (owner decision");
    expect(gate).toContain("Gates are not run by the worker.");
  });

  it("lists gaps instead of inventing times or runs", () => {
    const bundle = deliveryBundle({ charter: "completed" }, { artefactsFor: ["charter"] });
    const r = buildCompanyRecord({
      mission: mission({
        delivery: {
          wfMissionId: "m",
          planVersion: 1,
          planHash: "abcdef0123456789",
          optionId: "o1",
          approvedAt: "2026-10-31T09:00:00Z",
          approvedBy: "user",
        },
      }),
      delivery: bundle,
      events: null,
      runs: null,
      exportedAt: EXPORTED,
    });
    const gaps = r.summary.gaps.join("\n");
    expect(gaps).toContain("event log could not be read");
    expect(gaps).toContain("run ledger could not be read");
    expect(gaps).toContain("1 finished task has no saved start time");
    expect(r.summary.runs).toBeNull();
    const wo = file(r, "company/work-orders/01-charter.md");
    expect(wo).toContain("| Started | Not recorded |");
    expect(wo).toContain("Not recorded (no start time saved)");
    expect(file(r, "company/README.md")).toContain("## Gaps in this record");
    expect(file(r, "company/decisions.md")).toContain("Began delivery");
  });

  it("discloses a cut event log", () => {
    const r = buildCompanyRecord({
      mission: mission(),
      delivery: deliveryBundle({}),
      events: [event(1, {})],
      eventsCapped: true,
      runs: [],
      exportedAt: EXPORTED,
    });
    expect(r.summary.gaps.join(" ")).toContain("cut at 1 events");
  });

  it("records the owner's decisions with reasons, including gate notes and meeting choices", () => {
    const bundle = deliveryBundle({ charter: "completed", gate_scope: "completed" });
    const r = buildCompanyRecord({
      mission: mission({
        meetings: [
          {
            id: "mt1",
            title: "Kick-off",
            heldOn: "2026-10-30",
            notes: "- Action: draft survey",
            addedAt: "2026-10-30T12:00:00Z",
            addedBy: "user",
            reader: "Notes reader (rule-based, no AI model)",
            proposals: [
              {
                id: "p1",
                kind: "action",
                text: "draft survey",
                line: 1,
                owner: { kind: "you" },
                status: "accepted",
                decidedAt: "2026-10-30T12:05:00Z",
                decidedBy: "user",
              },
            ],
          },
        ],
      }),
      delivery: bundle,
      events: [
        event(5, {
          taskId: "task-gate_scope",
          type: "gate.approved",
          actorKind: "user",
          data: { gate: "gate_scope", note: "Scope is tight enough" },
          createdAt: "2026-10-31T11:00:00Z",
        }),
      ],
      runs: [],
      exportedAt: EXPORTED,
    });
    const d = file(r, "company/decisions.md");
    expect(d).toContain("Gate approved");
    expect(d).toContain("Your note: Scope is tight enough");
    expect(d).toContain("Accepted task (“Kick-off”, line 1): draft survey");
    expect(file(r, "company/timeline.md")).toContain("| You | Project owner | Accepted task");
  });

  it("records handoffs with the check on what was handed over", () => {
    const bundle = deliveryBundle(
      { charter: "completed", market: "running" },
      { artefactsFor: ["charter"] },
    );
    bundle.tasks.find((t) => t.key === "market")!.startedAt = "2026-10-31T10:01:00Z";
    const r = buildCompanyRecord({
      mission: mission(),
      delivery: bundle,
      events: [],
      runs: [],
      exportedAt: EXPORTED,
    });
    const h = file(r, "company/handoffs.md");
    const row = h.split("\n").find((l) => l.includes("2026-10-31T10:01:00Z"))!;
    expect(row).toMatch(/^\| Aria · /);
    expect(row).toContain("charter output");
    expect(row).toContain("Handoff contract:");
    expect(row).toContain("Picked up");
    expect(r.summary.handoffs).toBeGreaterThan(0);
  });

  it("ledgers usage per task and per run, in CSV-safe form", () => {
    const r = buildCompanyRecord({
      mission: mission({
        usageCeiling: 10,
        usageConsumed: 3,
        spendRecords: [{ key: "compare", units: 3, reason: "Compared options, twice" }],
      }),
      delivery: deliveryBundle({ charter: "completed" }),
      events: [],
      runs: [run({ failureClass: "timeout", status: "failed" }), run({ attempt: 2 })],
      exportedAt: EXPORTED,
    });
    const csvText = file(r, "company/usage-ledger.csv");
    expect(csvText.split("\n")[0]).toBe(
      "kind,item,who,attempt,status,provider,model,model_calls,input_tokens,output_tokens,budget_units,used_units,started_at,finished_at,note",
    );
    expect(csvText).toContain('investigation,compare,,,,,,,,,,3,,,"Compared options, twice"');
    expect(csvText.split("\n").filter((l) => l.startsWith("build-run,")).length).toBe(2);
    const md = file(r, "company/usage-ledger.md");
    expect(md).toContain("- Usage ceiling: 10 units");
    expect(md).toContain("- Runs recorded: 2");
    expect(md).toContain("Money is not recorded here");
  });

  it("renders one offline page with escaped content and no scripts", () => {
    const r = buildCompanyRecord({
      mission: mission({
        brief: { ...baseMission().brief, question: "<script>alert(1)</script> waste app" },
      }),
      delivery: deliveryBundle({ charter: "completed" }, { artefactsFor: ["charter"] }),
      events: [],
      runs: [],
      exportedAt: EXPORTED,
    });
    const html = file(r, "company/record.html");
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).not.toContain("<script");
    expect(html).toContain("&lt;script&gt;");
    for (const id of ["gaps", "org", "timeline", "orders", "decisions", "handoffs", "usage"]) {
      expect(html).toContain(`id="${id}"`);
    }
    expect(html).toContain("<table>");
  });

  it("names only roles that had work, and lists planned roster roles as having done none", () => {
    const m = mission();
    const r = buildCompanyRecord({
      mission: {
        ...m,
        team: m.team
          ? { ...m.team, catalogueRosterIds: [...m.team.capabilityIds, "DX-999-PLANNED"] }
          : m.team,
      },
      delivery: null,
      events: [],
      runs: [],
      exportedAt: EXPORTED,
    });
    const org = file(r, "company/org-chart.md");
    expect(org).toContain("## Owner");
    if (m.team) expect(org).toContain("they did no work");
    expect(org).toContain("Notes reader (rule-based, no AI model)");
  });
});
