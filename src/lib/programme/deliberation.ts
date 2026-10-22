/**
 * Multi-agent deliberation protocol (deterministic adjudication).
 *
 * 1. Independent positions — every panellist scores options through its own
 *    department lens before seeing anyone else's view. This is deliberate:
 *    debate-first setups drift to false consensus.
 * 2. Critique round — positions are shared. A panellist changes its vote only
 *    when it was near-indifferent (low margin) and the leading option is
 *    almost as good under its own lens. Every change records who persuaded it.
 *    Confident dissent is kept, never averaged away.
 * 3. Vetoes — departments with red lines (Security, Finance, QA) block options
 *    that breach them, regardless of popularity.
 * 4. Tally — expertise-weighted shares over non-vetoed options. Adopted only
 *    with a weighted supermajority; otherwise escalated to the human operator.
 *    High-impact decisions always need human ratification.
 *
 * The tally is code, not a model: the rules are inspectable and replayable.
 */
import { DEPARTMENT_LENSES, VETO_RULES, displayName, member } from "./roster";
import { hashSeed, rng } from "./rng";
import {
  CRITERIA,
  CRITERION_LABELS,
  type Criterion,
  type DecisionOption,
  type DecisionRecord,
  type DecisionSpec,
  type Position,
  type Veto,
} from "./types";

export const SUPERMAJORITY = 0.6;
/** Margin (in utility) under which a panellist is open to persuasion. */
export const PERSUADABLE_MARGIN = 0.04;
/** How close the leader must be, under the panellist's own lens, to switch. */
export const SWITCH_TOLERANCE = 0.06;
/** Individual judgement spread so identical lenses do not vote as one bloc. */
const JUDGEMENT_NOISE = 0.05;

function utility(capabilityId: string, option: DecisionOption, noise: number): number {
  const weights = DEPARTMENT_LENSES[member(capabilityId).departmentNumber]!;
  let u = 0;
  for (const c of CRITERIA) u += weights[c] * option.scores[c];
  return u + noise;
}

function strongest(capabilityId: string, option: DecisionOption): Criterion {
  const w = DEPARTMENT_LENSES[member(capabilityId).departmentNumber]!;
  return [...CRITERIA].sort((a, b) => w[b] * option.scores[b] - w[a] * option.scores[a])[0]!;
}

function weakest(capabilityId: string, option: DecisionOption): Criterion {
  const w = DEPARTMENT_LENSES[member(capabilityId).departmentNumber]!;
  return [...CRITERIA]
    .filter((c) => w[c] > 0.05)
    .sort((a, b) => w[b] * (1 - option.scores[b]) - w[a] * (1 - option.scores[a]))[0]!;
}

export function voteWeight(spec: DecisionSpec, capabilityId: string): number {
  if (capabilityId === spec.owner) return 1.5;
  return spec.domainDepartments.includes(member(capabilityId).departmentNumber) ? 2 : 1;
}

function tallyOf(
  positions: Position[],
  options: DecisionOption[],
  vetoed: Set<string>,
): Array<{ optionId: string; share: number; vetoed: boolean }> {
  const live = positions.filter((p) => !vetoed.has(p.optionId));
  const total = live.reduce((s, p) => s + p.weight, 0) || 1;
  return options
    .map((o) => ({
      optionId: o.id,
      share: vetoed.has(o.id)
        ? 0
        : live.filter((p) => p.optionId === o.id).reduce((s, p) => s + p.weight, 0) / total,
      vetoed: vetoed.has(o.id),
    }))
    .sort((a, b) => b.share - a.share);
}

export function deliberate(spec: DecisionSpec, seed: string): DecisionRecord {
  const panel = Array.from(new Set([spec.owner, ...spec.panel]));
  const byId = new Map(spec.options.map((o) => [o.id, o]));

  // Round 1 — independent.
  const utilities = new Map<string, Map<string, number>>();
  const round1: Position[] = panel.map((id) => {
    const rand = rng(hashSeed(seed, spec.key, id));
    const us = new Map(
      spec.options.map((o) => [o.id, utility(id, o, (rand() * 2 - 1) * JUDGEMENT_NOISE)]),
    );
    utilities.set(id, us);
    const ranked = [...us.entries()].sort((a, b) => b[1] - a[1]);
    const [bestId, bestU] = ranked[0]!;
    const margin = ranked[1] ? bestU - ranked[1][1] : 1;
    const best = byId.get(bestId)!;
    return {
      capabilityId: id,
      optionId: bestId,
      confidence: Math.min(1, Math.max(0, margin / 0.2)),
      weight: voteWeight(spec, id),
      rationale: `Strongest on ${CRITERION_LABELS[strongest(id, best)]} under the ${member(id).department} lens.`,
      concern: `Watch ${CRITERION_LABELS[weakest(id, best)]}.`,
    };
  });

  // Vetoes are visible to everyone in round 2.
  const vetoes: Veto[] = [];
  for (const id of panel) {
    const dept = member(id).departmentNumber;
    for (const rule of VETO_RULES.filter((r) => r.departmentNumber === dept)) {
      for (const o of spec.options) {
        if (
          o.scores[rule.criterion] < rule.below &&
          !vetoes.some(
            (v) => v.optionId === o.id && member(v.capabilityId).departmentNumber === dept,
          )
        ) {
          vetoes.push({ capabilityId: id, optionId: o.id, reason: rule.reason });
        }
      }
    }
  }
  const vetoed = new Set(vetoes.map((v) => v.optionId));

  // Round 2 — critique and bounded persuasion.
  const t1 = tallyOf(round1, spec.options, vetoed);
  const leader = t1.find((t) => !t.vetoed)?.optionId ?? null;
  const advocate = (optionId: string) =>
    round1
      .filter((p) => p.optionId === optionId)
      .sort((a, b) => b.weight * b.confidence - a.weight * a.confidence)[0];

  const round2: Position[] = round1.map((p) => {
    const us = utilities.get(p.capabilityId)!;
    const mustMove = vetoed.has(p.optionId);
    const persuadable =
      leader !== null &&
      p.optionId !== leader &&
      p.confidence * 0.2 < PERSUADABLE_MARGIN &&
      us.get(p.optionId)! - us.get(leader)! <= SWITCH_TOLERANCE;
    if (!mustMove && !persuadable) return p;

    const target = mustMove
      ? ([...us.entries()].filter(([o]) => !vetoed.has(o)).sort((a, b) => b[1] - a[1])[0]?.[0] ??
        null)
      : leader;
    if (!target || target === p.optionId) return p;
    const by = mustMove
      ? vetoes.find((v) => v.optionId === p.optionId)!.capabilityId
      : advocate(target)?.capabilityId;
    const targetOption = byId.get(target)!;
    return {
      ...p,
      optionId: target,
      revisedFrom: p.optionId,
      ...(by ? { persuadedBy: by } : {}),
      confidence: Math.min(p.confidence, 0.5),
      rationale: mustMove
        ? `Original choice was vetoed; next best under own lens is strongest on ${CRITERION_LABELS[strongest(p.capabilityId, targetOption)]}.`
        : `Was near-indifferent; persuaded by ${by ? displayName(by) : "the panel"} that ${targetOption.label} is acceptable on ${CRITERION_LABELS[strongest(p.capabilityId, targetOption)]}.`,
    };
  });

  const tally = tallyOf(round2, spec.options, vetoed);
  const top = tally.find((t) => !t.vetoed) ?? null;
  const adopted = !!top && top.share >= SUPERMAJORITY;
  // (Evidence gaps are flagged by the red team below and always reach the operator.)
  const chosen = top?.optionId ?? null;

  const dissent = round2
    .filter((p) => chosen && p.optionId !== chosen)
    .map((p) => ({
      capabilityId: p.capabilityId,
      optionId: p.optionId,
      note: `${displayName(p.capabilityId)} maintains ${byId.get(p.optionId)!.label}: ${p.rationale} ${p.concern}`,
    }));

  const rationale = !top
    ? "Every option was vetoed; the operator must reframe the options."
    : adopted
      ? `${byId.get(top.optionId)!.label} reached ${Math.round(top.share * 100)}% of expertise-weighted support (threshold ${SUPERMAJORITY * 100}%)${vetoed.size ? ` after ${vetoed.size} option(s) were vetoed` : ""}.`
      : `No option reached the ${SUPERMAJORITY * 100}% weighted supermajority (leader ${byId.get(top.optionId)!.label} at ${Math.round(top.share * 100)}%); escalated to the operator.`;

  // Red team: Decision Intelligence (DX-004) challenges the leader on its weakest criterion.
  const leaderOpt = chosen ? byId.get(chosen)! : null;
  const weakestCriterion = leaderOpt
    ? [...CRITERIA].sort((a, b) => leaderOpt.scores[a] - leaderOpt.scores[b])[0]!
    : "evidence";
  const evidenceGap = !!leaderOpt && leaderOpt.scores.evidence < 0.5;
  const challenge = {
    by: "DX-004",
    weakest: CRITERION_LABELS[weakestCriterion],
    evidenceGap,
    note: leaderOpt
      ? `${leaderOpt.label} is weakest on ${CRITERION_LABELS[weakestCriterion]} (${leaderOpt.scores[weakestCriterion].toFixed(2)}).${evidenceGap ? " Evidence is thin: run a low-cost validation experiment before treating this as settled." : ""} Agreement between agents sharing one underlying model is not independent verification.`
      : "No viable option to challenge.",
  };

  // Sensitivity: would the panel's choice change if one criterion were ignored entirely?
  const flipsWithout: string[] = [];
  if (chosen) {
    for (const drop of CRITERIA) {
      const votes = new Map<string, number>();
      for (const id of panel) {
        const w = DEPARTMENT_LENSES[member(id).departmentNumber]!;
        let best: string | null = null;
        let bestU = -Infinity;
        for (const o of spec.options) {
          if (vetoed.has(o.id)) continue;
          let u = 0;
          for (const c of CRITERIA) if (c !== drop) u += w[c] * o.scores[c];
          if (u > bestU) [best, bestU] = [o.id, u];
        }
        if (best) votes.set(best, (votes.get(best) ?? 0) + voteWeight(spec, id));
      }
      const winner = [...votes.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
      if (winner && winner !== chosen) flipsWithout.push(CRITERION_LABELS[drop]);
    }
  }

  return {
    key: spec.key,
    question: spec.question,
    owner: spec.owner,
    challenge,
    sensitivity: { robust: flipsWithout.length === 0, flipsWithout },
    reviewCondition: evidenceGap
      ? "Revisit after 5+ real customer interviews or a validation experiment produce evidence."
      : "Revisit if a key assumption is invalidated by real usage data or new evidence.",
    options: spec.options,
    round1,
    round2,
    vetoes,
    tally,
    outcome: adopted ? "adopted" : "escalated",
    chosenOptionId: chosen,
    rationale,
    dissent,
    confidence: top ? Number(top.share.toFixed(2)) : 0,
    needsHumanRatification: !adopted || spec.impact === "high" || evidenceGap,
  };
}
