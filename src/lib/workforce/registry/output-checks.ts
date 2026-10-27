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
  /** True when evidence the role was given records interviews, surveys or calls. */
  founderEvidence: boolean;
  /**
   * Names of the inputs the role was given; a [Sourced fact] must cite one of
   * them. The mission request and clarification answers are always inputs.
   */
  sources: readonly string[];
  /** Unresolved conflicts from product memory the role was shown; it must say they conflict. */
  conflictsGiven?: number;
};

/**
 * Names under which the prompt presents the mission's own inputs. A
 * [Sourced fact] cites one of these, or an upstream artefact by its title.
 */
export const SOURCE_NAMES = {
  request: "mission request",
  clarifications: "clarification answers",
} as const;

/** The inputs a role was actually given: clarification answers only when there are some. */
export function citableSources(
  clarificationAnswers: Readonly<Record<string, string | null | undefined>>,
  upstreamTitles: readonly string[],
): string[] {
  const hasAnswers = Object.values(clarificationAnswers).some((v) => v?.trim());
  return [
    SOURCE_NAMES.request,
    ...(hasAnswers ? [SOURCE_NAMES.clarifications] : []),
    ...upstreamTitles,
  ];
}

/** Stages whose output weighs evidence, and so must state any conflict it was shown. */
const CONFLICT_STAGES: readonly StageKey[] = [
  "charter",
  "market",
  "research",
  "prd",
  "evolution",
  "release",
];

const CONFLICT_WORD = /\bconflict(?:s|ed|ing)?\b/i;
const NEGATED_CONFLICT =
  /\b(?:no|not|never|none|without|nor)\b(?:\W+\w+){0,3}?\W+conflict(?:s|ed|ing)?\b/i;

/**
 * True when some sentence affirmatively says the evidence conflicts. A denial
 * such as "no conflict is present" does not count.
 */
export function acknowledgesConflict(markdown: string): boolean {
  return markdown
    .split(/(?<=[.!?])\s+|\n+/)
    .some((sentence) => CONFLICT_WORD.test(sentence) && !NEGATED_CONFLICT.test(sentence));
}

export type OutputCheck = { ok: boolean; failures: string[] };

const LABEL = new RegExp(`^\\s*[-*]\\s*\\[(${EVIDENCE_LABELS.join("|")})\\]`, "i");
const SOURCED = /^\s*[-*]\s*\[sourced fact\]/i;
const SOURCE = /\(source:\s*([^)]{3,})\)/i;
const NUMBER_CLAIM = /([$£€]\s?\d|\d+(\.\d+)?\s?(%|percent|million|billion|bn|m\b|k\b))/i;

/** Claims of research that only the founder can supply; never accepted from a model alone. */
export const INVENTED_RESEARCH: readonly RegExp[] = [
  /\bwe (interviewed|surveyed|spoke (to|with))\b/i,
  /\b(in|from) (our|the) (interviews|survey|user research)\b/i,
  /\b(customers|users|tutors|participants) (told us|said that)\b/i,
  /\b(survey|poll) of \d+/i,
  /\b\d+\s?% of (respondents|interviewees|participants)\b/i,
];

// Claims about this work's own state. Narrow on purpose: requirement text such
// as "a booking is approved by the tutor" must not trip them.
const CLAIMS_APPROVAL =
  /\b(this|the|our) (plan|charter|scope|prd|requirements|design|release|mission|work|product|prototype|app|mvp|service|feature)s?( candidate)? (has been |have been |was |were |is |are )(now )?approved\b|\b(the )?founder (has )?approved\b/i;
const CLAIMS_DEPLOYMENT =
  /\b(this|the|our) (product|release|prototype|app|mvp|service|feature)s? (has been |have been |was |were |is now |is |are now )?(deployed|released|launched|shipped|live in production)\b|\bwe(?:'ve| have)? (deployed|released|launched|shipped)\b|\bit (has been |was )?(deployed|launched|shipped)\b/i;

function bullets(section: string | undefined): string[] {
  return (section ?? "").split(/\r?\n/).filter((l) => /^\s*[-*]\s+\S/.test(l));
}

function section(markdown: string, heading: string): string | undefined {
  const key = heading.toLowerCase();
  for (const [k, v] of markdownSections(markdown))
    if (k === key || k.startsWith(`${key} `)) return v;
  return undefined;
}

/** A sourced fact names a source that was among the role's inputs. */
/** A source name as compared: case, spacing and closing punctuation do not matter. */
const sourceKey = (s: string) =>
  s
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.;:,\s]+$/, "")
    .trim();

/** The cited name must be one of the given inputs exactly; a fragment of one is not a source. */
function citesKnownSource(line: string, sources: readonly string[]): boolean {
  const cited = SOURCE.exec(line)?.[1];
  if (!cited) return false;
  const key = sourceKey(cited);
  return sources.some((s) => sourceKey(s) === key);
}

/** Every bullet in the section carries an evidence label; sourced facts cite a given input. */
function labelledClaims(
  markdown: string,
  heading: string,
  failures: string[],
  sources: readonly string[],
) {
  const lines = bullets(section(markdown, heading));
  const unlabelled = lines.filter((l) => !LABEL.test(l));
  if (unlabelled.length)
    failures.push(`${heading}: ${unlabelled.length} claim(s) without an evidence label`);
  const sourced = lines.filter((l) => SOURCED.test(l));
  const unsourced = sourced.filter((l) => !SOURCE.test(l));
  if (unsourced.length)
    failures.push(`${heading}: ${unsourced.length} sourced fact(s) without a (Source: …)`);
  const unknown = sourced.filter((l) => SOURCE.test(l) && !citesKnownSource(l, sources));
  if (unknown.length)
    failures.push(`${heading}: ${unknown.length} sourced fact(s) cite a source that was not given`);
}

/** Numbers about markets or prices are either sourced from a given input or labelled. */
function numbersAreBacked(
  markdown: string,
  heading: string,
  failures: string[],
  sources: readonly string[],
) {
  const bare = bullets(section(markdown, heading)).filter(
    (l) =>
      NUMBER_CLAIM.test(l) && !(SOURCED.test(l) ? citesKnownSource(l, sources) : LABEL.test(l)),
  );
  if (bare.length)
    failures.push(`${heading}: ${bare.length} figure(s) neither sourced nor labelled`);
}

// A label must be followed by the claim itself.
const LINE_LABEL = new RegExp(`^\\s*(?:[-*]\\s*)?\\[(${EVIDENCE_LABELS.join("|")})\\]\\s*\\S`, "i");
const LINE_SOURCED = /^\s*(?:[-*]\s*)?\[sourced fact\]/i;

/**
 * Every line of a section that states something about the world is labelled,
 * whether or not it is a bullet: a PRD may not present an unsourced claim as fact.
 */
function everyClaimLabelled(
  markdown: string,
  heading: string,
  failures: string[],
  sources: readonly string[],
) {
  const lines = (section(markdown, heading) ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  // Sub-headings organise claims; they are not claims themselves.
  const unlabelled = lines.filter((l) => !/^#{1,6}\s/.test(l) && !LINE_LABEL.test(l));
  if (unlabelled.length)
    failures.push(`${heading}: ${unlabelled.length} claim(s) without an evidence label`);
  const sourced = lines.filter((l) => LINE_SOURCED.test(l));
  if (sourced.some((l) => !SOURCE.test(l)))
    failures.push(`${heading}: sourced fact(s) without a (Source: …)`);
  else if (sourced.some((l) => !citesKnownSource(l, sources)))
    failures.push(`${heading}: sourced fact(s) cite a source that was not given`);
}

const ids = (text: string | undefined) => new Set((text ?? "").match(/\bR\d+\b/g) ?? []);

const LEADING_ID = /^\s*[-*]\s*(R\d+)\s*:/;

type Rule = (md: string, f: string[], upstream: string, ctx: OutputCheckContext) => void;

const STAGE_RULES: Partial<Record<StageKey, Rule>> = {
  charter(md, f) {
    if (/\b(we will build|the solution is|we should build)\b/i.test(section(md, "Problem") ?? ""))
      f.push("Problem: proposes a solution instead of stating the problem");
  },
  market(md, f, _u, ctx) {
    for (const h of ["Market landscape", "Competitors", "Demand hypotheses"])
      numbersAreBacked(md, h, f, ctx.sources);
    labelledClaims(md, "Demand hypotheses", f, ctx.sources);
  },
  research(md, f, _u, ctx) {
    labelledClaims(md, "Findings", f, ctx.sources);
  },
  prd(md, f, _u, ctx) {
    // Claims about the problem and its users are evidence; the rest of a PRD is proposal.
    for (const h of ["Problem statement", "Target users"])
      everyClaimLabelled(md, h, f, ctx.sources);
    const reqs = bullets(section(md, "Requirements"));
    if (!reqs.length) {
      f.push("Requirements: no requirements listed");
      return;
    }
    // Each requirement bullet starts with its own ID, numbered R1, R2, … in order.
    const reqIds = reqs.map((l) => LEADING_ID.exec(l)?.[1] ?? null);
    if (reqIds.some((id, i) => id !== `R${i + 1}`))
      f.push("Requirements: each requirement must start with its ID, numbered R1, R2, … in order");
    const known = new Set(reqIds.filter((id): id is string => id !== null));
    // Each acceptance bullet starts with the ID it checks; every requirement has one.
    const acceptance = bullets(section(md, "Acceptance criteria"));
    const accIds = acceptance.map((l) => LEADING_ID.exec(l)?.[1] ?? null);
    if (accIds.some((id) => id === null || !known.has(id)))
      f.push("Acceptance criteria: each bullet must start with the ID of a listed requirement");
    const covered = new Set(accIds);
    const missing = [...known].filter((r) => !covered.has(r));
    if (missing.length) f.push(`Acceptance criteria: none for ${missing.join(", ")}`);
  },
  ux(md, f, upstream) {
    const known = ids(upstream);
    if (!known.size) return; // upstream requirements carry no IDs to trace to
    const screens = bullets(section(md, "Screens"));
    const untraced = screens.filter((l) => !(l.match(/\bR\d+\b/g) ?? []).some((r) => known.has(r)));
    if (untraced.length)
      f.push(`Screens: ${untraced.length} screen(s) not traced to a requirement`);
    const shown = ids(section(md, "Screens"));
    const unshown = [...known].filter((r) => !shown.has(r));
    if (unshown.length) f.push(`Screens: no screen serves ${unshown.join(", ")}`);
  },
  evolution(md, f) {
    const unmeasured = bullets(section(md, "Next experiments")).filter((l) => !/measure:/i.test(l));
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
  // Only the founder approves, and nothing has shipped: true of every stage.
  if (CLAIMS_APPROVAL.test(markdown))
    failures.push("claims an approval that only the founder can give");
  if (CLAIMS_DEPLOYMENT.test(markdown))
    failures.push("claims a deployment or release that has not happened");
  // Conflicting evidence is kept and stated, never averaged away.
  if (ctx.conflictsGiven && CONFLICT_STAGES.includes(stage) && !acknowledgesConflict(markdown))
    failures.push(
      "does not state the conflicting evidence it was given; keep both sides and say they conflict",
    );
  STAGE_RULES[stage]?.(markdown, failures, upstream, ctx);
  return { ok: failures.length === 0, failures };
}

/** The stages that carry rules beyond their handoff contract. */
export const CHECKED_STAGES = Object.keys(STAGE_RULES) as StageKey[];
