import { describe, expect, it } from "vitest";
import { generateMissionPlan } from "@/lib/workforce/planner";
import {
  deliveryEligibility,
  deliveryPlanPreview,
  deliveryRequest,
  withDelivery,
} from "./delivery";
import { baseMission } from "./test-fixtures";
import type { SupervisedMission } from "./types";

const proposal: SupervisedMission["proposal"] = {
  action: "compare_options",
  version: 1,
  scopeHash: "s",
  options: [{ id: "o1", title: "Waste log", tradeoff: "Manual entry first", basis: "e1" }],
  generation: {
    ran: false,
    label: "not run",
    provider: null,
    model: null,
    output: "",
    citations: [],
    gaps: [],
  },
};
const decided = (over: Partial<SupervisedMission> = {}) =>
  baseMission({
    proposal,
    approval: { ...baseMission().approval!, optionId: "o1", version: 1, scopeHash: "s" },
    ...over,
  });

describe("delivery hand-off", () => {
  it("allows delivery only for an approved direction on an open case", () => {
    expect(deliveryEligibility(decided())).toEqual({ ok: true });
    const refused = (m: SupervisedMission) => {
      const result = deliveryEligibility(m);
      return result.ok ? null : result.reason;
    };
    expect(refused(decided({ approval: null }))).toMatch(/Record your decision first/);
    expect(
      refused(
        decided({
          approval: {
            ...baseMission().approval!,
            optionId: "o1",
            choice: "authorise_gather_evidence",
          },
        }),
      ),
    ).toMatch(/not to build yet/);
    expect(refused(decided({ stage: "cancelled" }))).toMatch(/cancelled/);
    expect(refused(decided({ studioMeta: { investigationPaused: true } as never }))).toMatch(
      /paused/,
    );
    // A decision taken on an earlier options draft does not authorise building this one.
    expect(refused(decided({ proposal: { ...proposal!, version: 2 } }))).toMatch(
      /no longer on the case/,
    );
    expect(refused(decided({ proposal: { ...proposal!, scopeHash: "other" } }))).toMatch(
      /no longer on the case/,
    );
    expect(
      refused(decided({ approval: { ...baseMission().approval!, optionId: "gone" } })),
    ).toMatch(/no longer on the case/);
    expect(
      refused(
        decided({
          delivery: {
            wfMissionId: "w",
            planVersion: 1,
            planHash: "h",
            optionId: "o1",
            approvedAt: "2026-10-31T12:00:00Z",
            approvedBy: "u",
          },
        }),
      ),
    ).toMatch(/already started/);
  });

  it("asks the build mission for exactly what the case records", () => {
    const { requestText, clarificationAnswers } = deliveryRequest(decided());
    expect(requestText).toBe(
      "Build the first version of: Food waste app\nChosen direction: Waste log — Manual entry first\nOwner note: Ship a thin slice",
    );
    expect(clarificationAnswers).toEqual({
      users: "Owners",
      success: "Less waste",
      chosen_direction: "Waste log",
      studio_evidence:
        "[supplied] Surplus tracking is the first pain. (source: https://example.com/e1)\n[gap] Buyer interviews not yet done.",
    });
  });

  it("produces the full lifecycle plan with its three human gates", () => {
    const plan = generateMissionPlan({ intent: "build", ...deliveryRequest(decided()) });
    expect(plan.tasks.map((t) => t.key)).toEqual([
      "charter",
      "market",
      "research",
      "foresight",
      "prd",
      "gate_scope",
      "ux",
      "architecture",
      "gate_design",
      "prototype",
      "verify",
      "release_pack",
      "gate_release",
      "evolution",
    ]);
    expect(plan.tasks.filter((t) => t.gate).map((t) => t.key)).toEqual([
      "gate_scope",
      "gate_design",
      "gate_release",
    ]);
    expect(plan.tasks.some((t) => t.isExternal)).toBe(false);
    const preview = deliveryPlanPreview(decided());
    expect(preview.estimatedUsage).toBe(plan.estimatedUsage);
    expect(preview.stages.map((s) => s.key)).toEqual(plan.tasks.map((t) => t.key));
    expect(preview.stages.filter((s) => s.gate).map((s) => s.key)).toEqual([
      "gate_scope",
      "gate_design",
      "gate_release",
    ]);
  });

  it("previews the outside-action step the planner adds when the request asks to publish", () => {
    const publishing = decided({
      approval: {
        ...baseMission().approval!,
        optionId: "o1",
        version: 1,
        scopeHash: "s",
        note: "Deploy to production once approved",
      },
    });
    const plan = generateMissionPlan({ intent: "build", ...deliveryRequest(publishing) });
    const preview = deliveryPlanPreview(publishing);
    expect(preview.stages.map((s) => s.key)).toEqual(plan.tasks.map((t) => t.key));
    expect(preview.stages.some((s) => s.outside)).toBe(true);
    expect(preview.estimatedUsage).toBe(plan.estimatedUsage);
  });

  it("records the link, a new version and one activity event", () => {
    const before = decided();
    const after = withDelivery(before, {
      wfMissionId: "wf-1",
      planVersion: 1,
      planHash: "hash",
      optionId: "o1",
      approvedAt: "2026-10-31T15:00:00Z",
      approvedBy: "owner",
    });
    expect(after.version).toBe(before.version + 1);
    expect(after.delivery?.wfMissionId).toBe("wf-1");
    expect(after.activity.at(-1)).toMatchObject({
      kind: "delivery.approved",
      actor: "human",
      at: "2026-10-31T15:00:00Z",
    });
    expect(after.activity).toHaveLength(before.activity.length + 1);
  });
});
