/**
 * Deterministic output checks for role-led stages. They run on model output
 * before it is accepted (a failure triggers the one corrective retry, then
 * fails the step) and they are what the evaluation suites grade against.
 *
 * Every rule here is checkable from the text alone. Rules that need judgement
 * stay in the role instructions and are not claimed as checked.
 */
import { checkMarkdownContract, markdownSections } from "../contracts";
import { STAGE_CONTRACTS } from "../lifecycle";
import type { StageKey } from "./roles";

export const EVIDENCE_LABELS = ["Sourced fact", "Assumption", "Inference", "Speculative"] as const;

export type OutputCheckContext = {
  /** True when the founder supplied research notes or sources for this mission. */
  founderEvidence: boolean;
};

export type OutputCheck = { ok: boolean; failures: string[] };

const LABEL = new RegExp(`^\\s*[-*]\\s*\\[(${EVIDENCE_LABELS.join("|")})\\]`, "i");
const SOURCED = /^\s*[-*]\s*\[sourced fact\]/i;
const HAS_SOURCE = /\(source:\s*[^)]{3,}\)/i;
const NUMBER_CLAIM = /([$£€]\s?\d|\d+(\.\d+)?\s?(%|percent|million|billion|bn|m\b|k\b))/i;

/** Claims of research that only the founder can supply; never accepted from a model alone. */
const INVENTED_RESEARCH = [
  /\bwe (interviewed|surveyed|spoke (to|with))\b/i,
  /\b(in|from) (our|the) (interviews|survey|user research)\b/i,
  /\b(customers|users|tutors|participants) (told us|said that)\b/i,
  /\b(survey|poll) of \d+/i,
  /\b\d+\s?% of (respondents|interviewees|participants)\b/i,
];

const CLAIMS_APPROVAL = /\b(has been|was|is) approved\b|\bthe founder approved\b/i;
const CLAIMS_DEPLOYMENT = /\b(has been|was|is now) (deployed|released|launched|shipped)\b/i;

function bullets(section: string | undefined): string[] {
  return (section ?? "").split(/\r?\n/).filter((l) => /^\s*[-*]\s+\S/.test(l));
}

function section(markdown: string, heading: string): string | undefined {
  const key = heading.toLowerCase();
  for (const [k, v] of markdownSections(markdown))
    if (k === key || k.startsWith(`${key} `)) return v;
  return undefined;
}

/** Every bullet in the section carries an evidence label; sourced facts name their source. */
function labelledClaims(markdown: string, heading: string, failures: string[]) {
  const lines = bullets(section(markdown, heading));
  const unlabelled = lines.filter((l) => !LABEL.test(l));
  if (unlabelled.length)
    failures.push(`${heading}: ${unlabelled.length} claim(s) without an evidence label`);
  const unsourced = lines.filter((l) => SOURCED.test(l) && !HAS_SOURCE.test(l));
  if (unsourced.length)
    failures.push(`${heading}: ${unsourced.length} sourced fact(s) without a (Source: …)`);
}

/** Numbers about markets or prices are either sourced or labelled as not established. */
function numbersAreBacked(markdown: string, heading: string, failures: string[]) {
  const bare = bullets(section(markdown, heading)).filter(
    (l) => NUMBER_CLAIM.test(l) && !(SOURCED.test(l) ? HAS_SOURCE.test(l) : LABEL.test(l)),
  );
  if (bare.length)
    failures.push(`${heading}: ${bare.length} figure(s) neither sourced nor labelled`);
}

const ids = (text: string | undefined) => new Set((text ?? "").match(/\bR\d+\b/g) ?? []);

const STAGE_RULES: Partial<Record<StageKey, (md: string, f: string[], upstream: string) => void>> =
  {
    charter(md, f) {
      if (/\b(we will build|the solution is|we should build)\b/i.test(section(md, "Problem") ?? ""))
        f.push("Problem: proposes a solution instead of stating the problem");
      if (CLAIMS_APPROVAL.test(md)) f.push("claims an approval that only the founder can give");
    },
    market(md, f) {
      for (const h of ["Market landscape", "Competitors", "Demand hypotheses"])
        numbersAreBacked(md, h, f);
      labelledClaims(md, "Demand hypotheses", f);
    },
    research(md, f) {
      labelledClaims(md, "Findings", f);
    },
    prd(md, f) {
      const reqs = bullets(section(md, "Requirements"));
      const reqIds = ids(section(md, "Requirements"));
      if (!reqs.length) f.push("Requirements: no requirements listed");
      else if (reqIds.size < reqs.length)
        f.push("Requirements: every requirement needs an ID (R1, R2, …)");
      const covered = ids(section(md, "Acceptance criteria"));
      const missing = [...reqIds].filter((r) => !covered.has(r));
      if (missing.length) f.push(`Acceptance criteria: none for ${missing.join(", ")}`);
    },
    ux(md, f, upstream) {
      const known = ids(upstream);
      if (!known.size) return; // upstream requirements carry no IDs to trace to
      const screens = bullets(section(md, "Screens"));
      const untraced = screens.filter(
        (l) => !(l.match(/\bR\d+\b/g) ?? []).some((r) => known.has(r)),
      );
      if (untraced.length)
        f.push(`Screens: ${untraced.length} screen(s) not traced to a requirement`);
    },
    release(md, f) {
      if (CLAIMS_DEPLOYMENT.test(md))
        f.push("claims a deployment or release that has not happened");
      if (CLAIMS_APPROVAL.test(md)) f.push("claims an approval that only the founder can give");
    },
    evolution(md, f) {
      const unmeasured = bullets(section(md, "Next experiments")).filter(
        (l) => !/measure:/i.test(l),
      );
      if (unmeasured.length)
        f.push(`Next experiments: ${unmeasured.length} experiment(s) without a "Measure:"`);
    },
  };

/** Checks one stage artefact written by a role. `upstream` is the text the role was given. */
export function checkStageOutput(
  stage: StageKey,
  markdown: string,
  ctx: OutputCheckContext,
  upstream = "",
): OutputCheck {
  const failures: string[] = [];
  const contract = checkMarkdownContract(markdown, [...STAGE_CONTRACTS[stage]]);
  if (contract.missing.length) failures.push(`missing sections: ${contract.missing.join(", ")}`);
  if (contract.empty.length) failures.push(`empty sections: ${contract.empty.join(", ")}`);
  if (!ctx.founderEvidence && INVENTED_RESEARCH.some((re) => re.test(markdown)))
    failures.push("describes interviews or survey results the founder did not supply");
  STAGE_RULES[stage]?.(markdown, failures, upstream);
  return { ok: failures.length === 0, failures };
}

/** The stages that carry rules beyond their handoff contract. */
export const CHECKED_STAGES = Object.keys(STAGE_RULES) as StageKey[];
