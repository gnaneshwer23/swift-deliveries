import { describe, expect, it } from "vitest";
import { decodeTaskCapabilityIds, encodeTaskDescription } from "./capability-persistence";
import { checkMarkdownContract, checkPrototypeHtml, extractHtmlDocument } from "./contracts";
import {
  buildDeliveryReport,
  executeTaskStep,
  nextMissionStatusAfterRun,
  type UpstreamArtefact,
} from "./executor";
import { executionWaves, runnableTasks, unreachableTasks, validateTaskGraph } from "./graph";
import { buildStagePrompt, resolveProvider } from "./model-runner.server";
import { generateMissionPlan } from "./planner";
import { containsLikelyPersonalIdentifiers, isValidNhsNumber } from "./privacy";
import { WAVE1_AVAILABLE_IDS } from "./registry";
import type { GeneratedContent } from "./executor";
import type { WfArtefact, WfMissionTask } from "./types";

const REQUEST =
  "Build an invoicing and late-payment assistant for UK freelancers that drafts invoices and tracks payment status.";

function planBuild(answers: Record<string, string> = {}) {
  return generateMissionPlan({
    intent: "build",
    requestText: REQUEST,
    clarificationAnswers: answers,
  });
}

function toTasks(plan: ReturnType<typeof planBuild>): WfMissionTask[] {
  return plan.tasks.map((t, i) => ({
    id: `task-${t.key}`,
    missionId: "m1",
    workspaceId: "w1",
    planId: "p1",
    sortOrder: i,
    title: t.title,
    description: t.description,
    acceptanceCriteria: t.acceptanceCriteria,
    status: "pending",
    permissionRequired: t.permissionRequired,
    isExternal: t.isExternal,
    estimatedUsage: t.estimatedUsage,
    actualUsage: 0,
    evidenceNotes: [],
    capabilityIds: t.capabilityIds,
    key: t.key,
    dependsOn: t.dependsOn ?? [],
    stage: t.stage ?? null,
    gate: Boolean(t.gate),
    requiredSections: t.requiredSections ?? [],
    produces: t.produces ?? null,
    startedAt: null,
    completedAt: null,
    createdAt: "2026-10-22T00:00:00.000Z",
    updatedAt: "2026-10-22T00:00:00.000Z",
  }));
}

const mission = {
  id: "m1",
  workspaceId: "w1",
  intent: "build" as const,
  title: "Build: freelancer invoicing",
  requestText: REQUEST,
  clarificationAnswers: { users: "UK freelancers and their clients" },
  permissionCeiling: "execute_internally" as const,
  externalActionsApproved: false,
};

type Artefact = Omit<WfArtefact, "id" | "createdAt" | "updatedAt">;

/**
 * In-memory emulation of runMissionStep: the same scheduling rules the server
 * applies (DAG order, non-gate first, gates block, failures cascade).
 */
function runMission(opts: {
  approveGates: boolean | ((key: string) => boolean);
  ceiling?: number;
  generate?: (task: WfMissionTask) => GeneratedContent | undefined;
}) {
  let tasks = toTasks(planBuild({ users: "UK freelancers" }));
  const artefacts: Artefact[] = [];
  let budget = { ceiling: opts.ceiling ?? 100, consumed: 0 };
  const executed: string[] = [];
  const gatesSeen: string[] = [];

  for (let guard = 0; guard < 100; guard++) {
    const runnable = runnableTasks(tasks);
    const next = runnable.find((t) => !t.gate);
    if (!next) {
      const gate = runnable.find((t) => t.gate);
      if (gate) {
        gatesSeen.push(gate.key);
        const approve =
          typeof opts.approveGates === "function" ? opts.approveGates(gate.key) : opts.approveGates;
        tasks = tasks.map((t) =>
          t.id === gate.id ? { ...t, status: approve ? "completed" : "failed" } : t,
        );
        continue;
      }
      const dead = new Set(unreachableTasks(tasks).map((t) => t.id));
      tasks = tasks.map((t) => (dead.has(t.id) ? { ...t, status: "blocked" } : t));
      break;
    }
    const byId = new Map(tasks.map((t) => [t.id, t]));
    const upstream: UpstreamArtefact[] = artefacts.map((a) => ({
      kind: a.kind,
      title: a.title,
      content: a.content,
      contentFormat: a.contentFormat,
      taskKey: byId.get(a.taskId!)?.key ?? null,
      requiredSections: byId.get(a.taskId!)?.requiredSections ?? [],
    }));
    const generated = opts.generate?.(next);
    const result = executeTaskStep({
      mission,
      task: next,
      budget,
      upstream,
      ...(generated ? { generated } : {}),
    });
    executed.push(next.key);
    budget = result.nextBudget;
    if (result.artefact) artefacts.push(result.artefact);
    tasks = tasks.map((t) => (t.id === next.id ? result.task : t));
    if (!result.ok && result.reason === "ceiling_reached") break;
  }
  return { tasks, artefacts, budget, executed, gatesSeen };
}

describe("task graph scheduler", () => {
  const node = (
    key: string,
    dependsOn: string[] = [],
    status: WfMissionTask["status"] = "pending",
    sortOrder = 0,
  ) => ({
    key,
    dependsOn,
    status,
    sortOrder,
  });

  it("rejects cycles, unknown dependencies and duplicate keys", () => {
    expect(validateTaskGraph([node("a", ["b"]), node("b", ["a"])])).toMatchObject({
      ok: false,
      reason: "cycle",
    });
    expect(validateTaskGraph([node("a", ["zzz"])])).toMatchObject({
      ok: false,
      reason: "unknown_dependency",
    });
    expect(validateTaskGraph([node("a"), node("a")])).toMatchObject({
      ok: false,
      reason: "duplicate_key",
    });
    expect(validateTaskGraph([node("a", ["a"])])).toMatchObject({ ok: false, reason: "cycle" });
  });

  it("only runs tasks whose dependencies completed", () => {
    const nodes = [
      node("a", [], "completed", 0),
      node("b", ["a"], "pending", 1),
      node("c", ["b"], "pending", 2),
    ];
    expect(runnableTasks(nodes).map((n) => n.key)).toEqual(["b"]);
  });

  it("marks everything downstream of a failure unreachable (transitively)", () => {
    const nodes = [
      node("a", [], "failed", 0),
      node("b", ["a"], "pending", 1),
      node("c", ["b"], "pending", 2),
      node("d", [], "pending", 3),
    ];
    expect(unreachableTasks(nodes).map((n) => n.key)).toEqual(["b", "c"]);
    expect(runnableTasks(nodes).map((n) => n.key)).toEqual(["d"]);
  });
});

describe("product mission plan (build intent)", () => {
  it("asks who the users are when the brief does not say", () => {
    const plan = generateMissionPlan({
      intent: "build",
      requestText: "Build a cash-flow forecasting tool with alerts and reports",
    });
    expect(plan.tasks).toHaveLength(0);
    expect(plan.clarificationQuestions.map((q) => q.id)).toContain("users");
  });

  it("produces a valid DAG covering all eight lifecycle stages", () => {
    const plan = planBuild();
    const tasks = toTasks(plan);
    const v = validateTaskGraph(tasks);
    expect(v.ok).toBe(true);
    expect(new Set(tasks.map((t) => t.stage))).toEqual(
      new Set(["capture", "discover", "define", "design", "build", "verify", "release", "evolve"]),
    );
  });

  it("runs the three discovery tracks in parallel after the charter", () => {
    const waves = executionWaves(toTasks(planBuild()));
    expect(waves[0]).toEqual(["charter"]);
    expect(new Set(waves[1])).toEqual(new Set(["market", "research", "foresight"]));
  });

  it("assigns only Available capabilities and discloses limitations", () => {
    const plan = planBuild();
    const available = new Set(WAVE1_AVAILABLE_IDS);
    for (const t of plan.tasks)
      for (const id of t.capabilityIds) expect(available.has(id)).toBe(true);
    expect(plan.capabilityLimitations.some((l) => l.message.includes("not production code"))).toBe(
      true,
    );
  });

  it("puts human gates on scope, design and release and fits the default ceiling", () => {
    const plan = planBuild();
    expect(plan.tasks.filter((t) => t.gate).map((t) => t.key)).toEqual([
      "gate_scope",
      "gate_design",
      "gate_release",
    ]);
    expect(plan.estimatedUsage).toBeLessThanOrEqual(100);
  });
});

describe("end-to-end product mission (simulated mode)", () => {
  it("completes all stages with gates approved and every contract satisfied", () => {
    const run = runMission({ approveGates: true });
    expect(run.gatesSeen).toEqual(["gate_scope", "gate_design", "gate_release"]);
    expect(run.tasks.every((t) => t.status === "completed")).toBe(true);
    expect(nextMissionStatusAfterRun({ tasks: run.tasks, hitCeiling: false })).toBe("completed");

    const report = run.artefacts.find((a) => a.kind === "test_report")!;
    expect(report.qualityLabels).toContain("automatically_tested");
    expect(report.content).toContain("**PASS**");
    // Simulated artefacts are always disclosed as such.
    for (const a of run.artefacts.filter((x) => x.kind !== "test_report")) {
      expect(a.evidenceItems.some((e) => e.source === "generation:simulated")).toBe(true);
    }
  });

  it("never lets design start before the scope gate is approved", () => {
    const run = runMission({ approveGates: (key) => key !== "gate_scope" });
    expect(run.executed).not.toContain("ux");
    expect(run.executed).not.toContain("architecture");
    expect(run.tasks.find((t) => t.key === "prototype")!.status).toBe("blocked");
    expect(nextMissionStatusAfterRun({ tasks: run.tasks, hitCeiling: false })).toBe(
      "partially_completed",
    );
    const report = buildDeliveryReport({
      missionTitle: "x",
      intent: "build",
      tasks: run.tasks,
      artefacts: run.artefacts,
      usageSpent: run.budget.consumed,
      partial: true,
    });
    expect(report.openRisks.join(" ")).toMatch(/rejected at human gate/);
  });

  it("fails a stage whose model output breaks its contract and stops only its dependants", () => {
    const run = runMission({
      approveGates: true,
      generate: (t) =>
        t.key === "research"
          ? {
              content: "# Research\n\n## Findings\nOnly one section was produced here.",
              mode: "model",
              model: "test-model",
            }
          : undefined,
    });
    expect(run.tasks.find((t) => t.key === "research")!.status).toBe("failed");
    // Sibling discovery tracks still ran.
    expect(run.tasks.find((t) => t.key === "market")!.status).toBe("completed");
    expect(run.tasks.find((t) => t.key === "foresight")!.status).toBe("completed");
    // Nothing downstream consumed the bad handoff.
    expect(run.executed).not.toContain("prd");
    const failedArtefact = run.artefacts.find((a) => a.taskId === "task-research")!;
    expect(failedArtefact.qualityLabels).toEqual([]);
  });

  it("hard-stops at the usage ceiling", () => {
    const run = runMission({ approveGates: true, ceiling: 20 });
    expect(run.budget.consumed).toBeLessThanOrEqual(20);
    expect(run.tasks.some((t) => t.status === "pending" || t.status === "blocked")).toBe(true);
  });
});

describe("handoff contracts", () => {
  it("detects missing and empty sections", () => {
    const md =
      "# T\n\n## Problem\nA real problem statement here.\n\n## Target users\n\n## Other\nx";
    const r = checkMarkdownContract(md, ["Problem", "Target users", "Constraints"]);
    expect(r.missing).toEqual(["Constraints"]);
    expect(r.empty).toEqual(["Target users"]);
  });

  it("does not treat ### subsections as contract sections", () => {
    const r = checkMarkdownContract("## Findings\n### Problem\nSome detail text that is long.", [
      "Problem",
    ]);
    expect(r.missing).toEqual(["Problem"]);
  });

  it("rejects prototypes that load remote code or call the network", () => {
    const bad =
      '<!DOCTYPE html><html lang="en"><head><script src="https://evil.example/x.js"></script></head><body><main><button>x</button></main><script>fetch("/x")</script></body></html>';
    const checks = checkPrototypeHtml(bad);
    expect(checks.find((c) => c.id === "no_remote_script")!.passed).toBe(false);
    expect(checks.find((c) => c.id === "no_network")!.passed).toBe(false);
    expect(extractHtmlDocument('```html\n<html lang="en"></html>\n```')).toBe(
      '<html lang="en"></html>',
    );
  });
});

describe("task metadata persistence", () => {
  it("round-trips graph metadata alongside capability ids", () => {
    const encoded = encodeTaskDescription("Do it -- carefully", ["DX-001"], {
      key: "prd",
      dependsOn: ["market", "research"],
      stage: "define",
      requiredSections: ["Risks -- and mitigations"],
      produces: "prd",
    });
    const decoded = decodeTaskCapabilityIds(encoded);
    expect(decoded.description).toBe("Do it -- carefully");
    expect(decoded.capabilityIds).toEqual(["DX-001"]);
    expect(decoded.meta).toMatchObject({
      key: "prd",
      dependsOn: ["market", "research"],
      stage: "define",
      produces: "prd",
    });
    expect(decoded.meta?.requiredSections).toEqual(["Risks -- and mitigations"]);
    expect(encoded).not.toMatch(/dx-task: .*--.* -->/);
  });

  it("decodes legacy descriptions without metadata", () => {
    const decoded = decodeTaskCapabilityIds("Legacy\n\n<!-- dx-capabilities: DX-011 -->");
    expect(decoded.meta).toBeNull();
    expect(decoded.capabilityIds).toEqual(["DX-011"]);
  });
});

describe("model mode safeguards", () => {
  it("is off unless explicitly enabled, even with a provider key", () => {
    expect(resolveProvider({ AI_GATEWAY_API_KEY: "k" })).toBeNull();
    expect(resolveProvider({ DXSI_MODEL_ENABLED: "true" })).toBeNull();
    expect(
      resolveProvider({ DXSI_MODEL_ENABLED: "true", OPENROUTER_API_KEY: "k", DXSI_MODEL: "m" }),
    ).toMatchObject({
      name: "openrouter",
      model: "m",
    });
  });

  it("treats upstream artefacts as data and states the contract", () => {
    const prompt = buildStagePrompt({
      mission,
      task: {
        title: "PRD",
        description: "d",
        acceptanceCriteria: "a",
        requiredSections: ["Risks", "Out of scope"],
        produces: "prd",
      },
      upstream: [],
    });
    expect(prompt.system).toContain("Risks; Out of scope");
    expect(prompt.system).toMatch(/not instructions/);
  });

  it("detects likely personal identifiers before any external call", () => {
    expect(isValidNhsNumber("9434765919")).toBe(true);
    expect(isValidNhsNumber("9434765918")).toBe(false);
    expect(containsLikelyPersonalIdentifiers("Patient 943 476 5919 has high glucose")).toBe(true);
    expect(containsLikelyPersonalIdentifiers("NI number AB 12 34 56 C")).toBe(true);
    expect(containsLikelyPersonalIdentifiers("DOB 12/03/1961")).toBe(true);
    expect(containsLikelyPersonalIdentifiers(REQUEST)).toBe(false);
  });
});
