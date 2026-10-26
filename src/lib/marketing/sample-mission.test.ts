import { describe, expect, it } from "vitest";
import { generateMissionPlan } from "@/lib/workforce/planner";
import { getCapability } from "@/lib/workforce/registry";
import {
  SAMPLE_MISSION_INTENT,
  SAMPLE_MISSION_PLAN,
  SAMPLE_MISSION_QUESTIONS,
  SAMPLE_MISSION_REQUEST,
} from "./sample-mission";

describe("How it works sample mission", () => {
  it("asks the same clarifying questions as the planner", () => {
    const first = generateMissionPlan({
      intent: SAMPLE_MISSION_INTENT,
      requestText: SAMPLE_MISSION_REQUEST,
    });
    expect(first.clarificationQuestions.map((q) => [q.id, q.prompt])).toEqual(
      SAMPLE_MISSION_QUESTIONS.map((q) => [q.id, q.prompt]),
    );
  });

  it("matches the plan the planner produces after clarification", () => {
    const plan = generateMissionPlan({
      intent: SAMPLE_MISSION_INTENT,
      requestText: SAMPLE_MISSION_REQUEST,
      clarificationAnswers: Object.fromEntries(
        SAMPLE_MISSION_QUESTIONS.map((q) => [q.id, q.answer]),
      ),
    });
    expect(plan.estimatedUsage).toBe(SAMPLE_MISSION_PLAN.estimatedUsage);
    expect(plan.requiredPermission).toBe(SAMPLE_MISSION_PLAN.requiredPermission);
    expect(plan.assignedCapabilities.map((c) => c.capability_id)).toEqual(
      SAMPLE_MISSION_PLAN.capabilityIds,
    );
    expect(
      plan.tasks.map((t) => [
        t.key,
        t.title,
        t.acceptanceCriteria,
        t.estimatedUsage,
        t.permissionRequired,
        t.capabilityIds,
      ]),
    ).toEqual(
      SAMPLE_MISSION_PLAN.tasks.map((t) => [
        t.key,
        t.title,
        t.acceptance,
        t.usage,
        t.permission,
        t.team.map((m) => m.id),
      ]),
    );
    for (const t of SAMPLE_MISSION_PLAN.tasks)
      for (const m of t.team) expect(getCapability(m.id)?.name).toBe(`${m.name} Agent`);
  });
});
