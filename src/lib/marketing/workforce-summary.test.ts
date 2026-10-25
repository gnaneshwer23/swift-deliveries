import { describe, expect, it } from "vitest";
import { capabilityRegistryData as R } from "@/lib/workforce/registry/data";
import {
  WORKFORCE_AVAILABLE_IDS,
  WORKFORCE_DEPARTMENTS,
  WORKFORCE_INTENTS,
  WORKFORCE_TOTAL,
} from "./workforce-summary";

describe("workforce summary", () => {
  it("matches the capability registry", () => {
    expect(WORKFORCE_TOTAL).toBe(R.capabilities.length);
    expect(WORKFORCE_DEPARTMENTS.map((d) => [d.n, d.name, d.size])).toEqual(
      R.departments.map((d) => [d.number, d.name, d.capability_ids.length]),
    );
    expect([...WORKFORCE_AVAILABLE_IDS]).toEqual(R.wave1_available_ids);
    for (const [intent, ids] of Object.entries(R.intent_capability_map)) {
      const summary = WORKFORCE_INTENTS[intent as keyof typeof WORKFORCE_INTENTS];
      expect(summary.map((c) => c.id)).toEqual(ids);
      for (const c of summary) {
        const real = R.capabilities.find((x) => x.capability_id === c.id)!;
        expect([c.name, c.department]).toEqual([real.name, real.department_number]);
      }
    }
  });
});
