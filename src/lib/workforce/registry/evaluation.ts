/**
 * Role evaluation suites. Each assignable role has one, in two parts:
 *
 * 1. Fixture checks (run in CI): the role's output checks accept the good
 *    fixture for every stage it leads and reject each bad fixture with the
 *    expected failure. This proves the suite works, not that the role does.
 * 2. Model evaluation (run with `npm run eval:roles`): the role writes each
 *    stage for the fixture mission under its instructions, and the output
 *    checks grade it. Without a configured model the result is "not run".
 *
 * A role's evaluation status only becomes "passed" from a recorded model
 * evaluation (evaluations.ts).
 */
import { structureCheckLog } from "../executor";
import { STAGE_CONTRACTS } from "../lifecycle";
import {
  FIXTURE_MISSION,
  FIXTURE_UPSTREAM_TITLE,
  PROTOTYPE_FIXTURES,
  STAGE_FIXTURES,
} from "./eval-fixtures";
import { roleInstructions } from "./instructions";
import { checkStageOutput, citableSources, type OutputCheckContext } from "./output-checks";
import { getRoleSpec, type StageKey } from "./roles";

export const SUITE_VERSION = "2";

/** What a role may cite when writing a fixture stage: the base inputs and the fixture upstream. */
export const FIXTURE_CHECK_CONTEXT: OutputCheckContext = {
  founderEvidence: false,
  sources: citableSources(FIXTURE_MISSION.clarificationAnswers, [FIXTURE_UPSTREAM_TITLE]),
};

export type FixtureCase = { stage: string; name: string; passed: boolean; detail: string };

/** Part 1: the role's checks, run against labelled fixtures. */
export function runFixtureChecks(roleId: string): FixtureCase[] {
  const spec = getRoleSpec(roleId);
  if (!spec) throw new Error(`${roleId} has no role definition`);

  if (spec.executionMode === "deterministic") return structureCheckCases();

  const cases: FixtureCase[] = [];
  for (const { stage } of spec.leads) {
    const fixture = STAGE_FIXTURES.find((f) => f.stage === stage);
    if (!fixture) {
      cases.push({ stage, name: "fixture exists", passed: false, detail: "no fixture for stage" });
      continue;
    }
    const ctx = FIXTURE_CHECK_CONTEXT;
    const good = checkStageOutput(stage, fixture.good, ctx, fixture.upstream);
    cases.push({
      stage,
      name: "accepts output that meets every rule",
      passed: good.ok,
      detail: good.failures.join("; ") || "accepted",
    });
    for (const bad of fixture.bad) {
      const r = checkStageOutput(stage, bad.output, ctx, fixture.upstream);
      const caught = !r.ok && r.failures.some((f) => bad.expect.test(f));
      cases.push({
        stage,
        name: `rejects: ${bad.name}`,
        passed: caught,
        detail: r.failures.join("; ") || "accepted (should have been rejected)",
      });
    }
  }
  return cases;
}

/** DX-071 is deterministic: its suite runs the real structure check on fixtures. */
function structureCheckCases(): FixtureCase[] {
  const mission = { id: "fixture", workspaceId: "fixture" } as never;
  const task = { id: "fixture-task" };
  const proto = (content: string) => [
    {
      kind: "prototype_html" as const,
      title: "Fixture prototype",
      content,
      contentFormat: "html" as const,
      taskKey: "prototype",
      requiredSections: [],
    },
  ];
  const none = structureCheckLog(mission, task, []);
  const good = structureCheckLog(mission, task, proto(PROTOTYPE_FIXTURES.good));
  const broken = structureCheckLog(mission, task, proto(PROTOTYPE_FIXTURES.broken));
  return [
    {
      stage: "verify",
      name: "reports nothing to check as a failure, with no tested label",
      passed: !none.passed && none.artefact === null,
      detail: none.detail,
    },
    {
      stage: "verify",
      name: "labels a prototype automatically tested only when every check passes",
      passed: good.passed && good.artefact?.qualityLabels.includes("automatically_tested") === true,
      detail: good.detail,
    },
    {
      stage: "verify",
      name: "withholds the tested label when a check fails",
      passed: !broken.passed && broken.artefact?.qualityLabels.length === 0,
      detail: broken.detail,
    },
  ];
}

export type StageGenerator = (input: {
  stage: StageKey;
  instructions: string;
  instructionVersion: string;
  mission: typeof FIXTURE_MISSION;
  upstream: string;
}) => Promise<{
  content: string;
  mode: "model" | "simulated";
  model?: string;
  note?: string;
  failure?: { class: string; detail: string };
}>;

export type ModelEvaluation =
  | { status: "not_run"; reason: string }
  | {
      status: "passed" | "failed";
      model: string | null;
      stages: Array<{ stage: StageKey; ok: boolean; failures: string[] }>;
    };

/** Part 2: the role writes each stage it leads for the fixture mission; the checks grade it. */
export async function runModelEvaluation(
  roleId: string,
  generate: StageGenerator | null,
): Promise<ModelEvaluation> {
  const spec = getRoleSpec(roleId);
  if (!spec) throw new Error(`${roleId} has no role definition`);
  if (spec.executionMode === "deterministic")
    return { status: "not_run", reason: "deterministic role: graded by its fixture checks only" };
  if (!generate) return { status: "not_run", reason: "no model is configured" };

  const stages: Array<{ stage: StageKey; ok: boolean; failures: string[] }> = [];
  let model: string | null = null;
  for (const { stage } of spec.leads) {
    const fixture = STAGE_FIXTURES.find((f) => f.stage === stage)!;
    const instructions = roleInstructions(roleId, stage)!;
    const out = await generate({
      stage,
      instructions: instructions.text,
      instructionVersion: instructions.version,
      mission: FIXTURE_MISSION,
      upstream: fixture.upstream,
    });
    if (out.failure?.class === "contract_failed") {
      // The model answered but its output failed the checks twice: a failed evaluation.
      stages.push({ stage, ok: false, failures: [out.failure.detail] });
      continue;
    }
    if (out.mode !== "model")
      return { status: "not_run", reason: out.note ?? "the model did not return output" };
    model = out.model ?? model;
    const r = checkStageOutput(stage, out.content, FIXTURE_CHECK_CONTEXT, fixture.upstream);
    stages.push({ stage, ok: r.ok, failures: r.failures });
  }
  return { status: stages.every((s) => s.ok) ? "passed" : "failed", model, stages };
}

/** The sections a stage must contain, for building a generation task. */
export function stageSections(stage: StageKey): string[] {
  return [...STAGE_CONTRACTS[stage]];
}
