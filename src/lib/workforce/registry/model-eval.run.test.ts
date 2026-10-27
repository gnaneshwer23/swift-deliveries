/**
 * Model evaluation of every assignable role. Skipped by `npm test`: run it
 * with `npm run eval:roles` in an environment where model mode is configured.
 * Set RECORD_ROLE_EVALS=1 to write the results to evaluations.json.
 * Without a configured model every role is reported as not run.
 */
import { writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { FIXTURE_UPSTREAM_TITLE } from "./eval-fixtures";
import {
  FIXTURE_CHECK_CONTEXT,
  runModelEvaluation,
  stageSections,
  SUITE_VERSION,
  type StageGenerator,
} from "./evaluation";
import { checkStageOutput } from "./output-checks";
import type { RecordedEvaluation } from "./evaluations";
import { ROLE_SPECS, getRoleSpec } from "./roles";

// `npm run eval:roles` sets npm_lifecycle_event, so no shell-specific env syntax is needed.
const enabled =
  process.env["npm_lifecycle_event"] === "eval:roles" || process.env["RUN_ROLE_EVALS"] === "1";

describe.skipIf(!enabled)("role model evaluations", () => {
  it("runs every role's suite against the configured model", { timeout: 15 * 60_000 }, async () => {
    const runner = await import("../model-runner.server");
    const status = runner.modelModeStatus();
    const generate: StageGenerator | null = status.enabled
      ? async ({ stage, instructions, instructionVersion, mission, upstream }) => {
          const spec = ROLE_SPECS.find((r) => r.leads.some((l) => l.stage === stage))!;
          const produces = spec.leads.find((l) => l.stage === stage)!.produces;
          return runner.generateStageContent({
            mission,
            task: {
              title: `Fixture evaluation: ${stage}`,
              description: `Write the ${stage} stage for the fixture mission.`,
              acceptanceCriteria: "Meets the stage contract and the role's rules.",
              requiredSections: stageSections(stage),
              produces,
            },
            upstream: upstream
              ? [
                  {
                    kind: "note",
                    title: FIXTURE_UPSTREAM_TITLE,
                    content: upstream,
                    contentFormat: "markdown",
                    taskKey: null,
                    requiredSections: [],
                  },
                ]
              : [],
            extraInstructions: instructions,
            instructionVersion,
            // Same checks and corrective retry as a production step.
            extraCheck: (content) => {
              const r = checkStageOutput(stage, content, FIXTURE_CHECK_CONTEXT, upstream);
              return r.ok ? null : r.failures.join("; ");
            },
          });
        }
      : null;

    const record: Record<string, RecordedEvaluation> = {};
    const lines: string[] = [];
    for (const spec of ROLE_SPECS) {
      const r = await runModelEvaluation(spec.id, generate);
      if (r.status === "not_run") {
        lines.push(`${spec.id}: not run (${r.reason})`);
        continue;
      }
      lines.push(
        `${spec.id}: ${r.status}${r.stages
          .filter((s) => !s.ok)
          .map((s) => ` · ${s.stage}: ${s.failures.join("; ")}`)
          .join("")}`,
      );
      record[spec.id] = {
        status: r.status,
        suiteVersion: SUITE_VERSION,
        ranAt: new Date().toISOString(),
        model: r.model ?? status.model ?? "unknown",
      };
    }
    process.stdout.write(
      `Role evaluations (suite ${SUITE_VERSION}, model ${status.model ?? "none"}):\n${lines.join("\n")}\n`,
    );
    if (process.env["RECORD_ROLE_EVALS"] === "1" && Object.keys(record).length)
      writeFileSync(
        new URL("./evaluations.json", import.meta.url),
        `${JSON.stringify(record, null, 2)}\n`,
      );
    expect(ROLE_SPECS.every((r) => getRoleSpec(r.id))).toBe(true);
  });
});
