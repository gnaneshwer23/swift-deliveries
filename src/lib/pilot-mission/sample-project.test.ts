import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildCheckpoint } from "./checkpoint";
import {
  buildSampleProject,
  SAMPLE_NOTICE,
  SAMPLE_OPTIONS,
  SAMPLE_PROJECT_ID,
} from "./sample-project";
import { nextRequiredAction } from "./types";

describe("sample project", () => {
  const now = Date.parse("2026-11-03T12:00:00Z");
  const sample = buildSampleProject(now);

  it("stops at the owner's decision, like a real project halfway through", () => {
    const next = nextRequiredAction(sample);
    expect(next.id).toBe("decide");
    expect(buildCheckpoint(sample, next, now).status).toBe("waiting_on_you");
  });

  it("labels every source and the whole project as invented", () => {
    for (const e of sample.evidence) expect(e.source).toMatch(/sample|invented/i);
    expect(sample.brief.audience).toMatch(/sample/i);
    expect(SAMPLE_NOTICE).toMatch(/invented/i);
    expect(SAMPLE_NOTICE).toMatch(/nothing is saved/i);
    expect(SAMPLE_OPTIONS.filter((o) => o.recommended)).toHaveLength(1);
  });

  it("uses an id no real project can have, and recent times", () => {
    expect(SAMPLE_PROJECT_ID).not.toMatch(/^[0-9a-f-]{36}$/);
    const newest = Math.max(...sample.activity.map((e) => Date.parse(e.at)));
    expect(newest).toBeLessThanOrEqual(now);
    expect(now - newest).toBeLessThan(86_400_000);
  });

  it("is built fresh each time, so nothing carries between visits", () => {
    const a = buildSampleProject(now);
    const b = buildSampleProject(now);
    expect(a).not.toBe(b);
    expect(a.activity).not.toBe(b.activity);
    expect(a).toEqual(b);
  });

  it("never reaches the project server functions or the database", () => {
    for (const file of [
      "src/lib/pilot-mission/sample-project.ts",
      "src/components/command/sample-project-view.tsx",
      "src/routes/_authenticated/command.sample.tsx",
    ]) {
      const src = readFileSync(file, "utf8");
      expect(src).not.toMatch(
        /pilot-mission\.functions|\.server["']|createServerFn|useMutation|neon/,
      );
    }
  });
});
