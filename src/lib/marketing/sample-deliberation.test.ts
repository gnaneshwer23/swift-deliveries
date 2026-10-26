import { describe, expect, it } from "vitest";
import { deliberate, SUPERMAJORITY } from "@/lib/programme/deliberation";
import {
  SAMPLE_DECISION_RESULT,
  SAMPLE_DECISION_SEED,
  SAMPLE_DECISION_SPEC,
} from "./sample-deliberation";

describe("homepage sample deliberation", () => {
  const d = deliberate(SAMPLE_DECISION_SPEC, SAMPLE_DECISION_SEED);

  it("matches what the deliberation engine produces", () => {
    expect(SAMPLE_DECISION_RESULT.supermajority).toBe(SUPERMAJORITY);
    expect(d.outcome).toBe(SAMPLE_DECISION_RESULT.outcome);
    expect(d.chosenOptionId).toBe(SAMPLE_DECISION_RESULT.chosenOptionId);
    expect(d.needsHumanRatification).toBe(SAMPLE_DECISION_RESULT.needsHumanRatification);
    expect(d.tally.map((t) => ({ ...t, share: Math.round(t.share * 100) / 100 }))).toEqual(
      SAMPLE_DECISION_RESULT.tally,
    );
    expect(d.vetoes.map((v) => [v.capabilityId, v.optionId, v.reason])).toEqual(
      SAMPLE_DECISION_RESULT.vetoes.map((v) => [v.id, v.optionId, v.reason]),
    );
    expect(
      d.round2.map((p) => [p.capabilityId, p.optionId, p.weight, p.persuadedBy, p.revisedFrom]),
    ).toEqual(
      SAMPLE_DECISION_RESULT.votes.map((v) => [
        v.id,
        v.optionId,
        v.weight,
        "persuadedBy" in v ? v.persuadedBy : undefined,
        "revisedFrom" in v ? v.revisedFrom : undefined,
      ]),
    );
    expect(d.dissent.map((x) => [x.capabilityId, x.optionId])).toEqual([
      [SAMPLE_DECISION_RESULT.dissent.id, SAMPLE_DECISION_RESULT.dissent.optionId],
    ]);
  });
});
