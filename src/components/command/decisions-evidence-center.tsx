import { Link } from "@tanstack/react-router";
import { buildMissionInspection } from "@/lib/pilot-mission/mission-inspection";
import { ensureTeamCollaboration } from "@/lib/pilot-mission/team-collaboration";
import type { SupervisedMission } from "@/lib/pilot-mission/types";
import { nextRequiredAction } from "@/lib/pilot-mission/types";
import {
  AGENT_RECOMMENDATION_LABELS,
  HUMAN_NEXT_PATH_LABELS,
  deriveAgentRecommendation,
  normalizeDecisionChoice,
} from "@/lib/pilot-mission/verdict";
import { LearningChain } from "@/components/command/supervised-learning-loop";

export function DecisionsEvidenceCenter({ mission }: { mission: SupervisedMission }) {
  const inspection = buildMissionInspection(mission);
  const next = nextRequiredAction(mission);
  const draft = deriveAgentRecommendation(mission);
  const team = ensureTeamCollaboration(mission);

  const supplied = mission.evidence.filter((e) => e.classification === "supplied");
  const assumptions = mission.evidence.filter((e) => e.classification === "assumption");
  const gaps = mission.evidence.filter((e) => e.classification === "gap");

  return (
    <section className="ps-indigo-decisions" aria-label="Decisions and evidence center">
      <header className="mb-4">
        <p className="ps-exec-section-kicker">Decisions &amp; evidence center</p>
        <p className="cc-muted text-sm mb-0">
          Active gate, record-backed evidence tiers, and outcome learning — no auto-pass.
        </p>
      </header>

      <article className="ps-exec-card ps-indigo-active-gate">
        <p className="ps-exec-section-kicker">Active human gate</p>
        <h3 className="text-base font-semibold mt-1">{next.title}</h3>
        <p className="cc-muted text-sm mb-0">{next.detail}</p>
        {inspection.decisionAttention && inspection.decisionAttention.id !== next.id ? (
          <p className="cc-muted text-xs mt-2 mb-0">
            Inspection also flags: {inspection.decisionAttention.title}
          </p>
        ) : null}
      </article>

      <div className="ps-indigo-evidence-tiers mt-4">
        <section className="ps-exec-card">
          <p className="ps-exec-section-kicker">Evidence</p>
          {supplied.length ? (
            <ul className="cc-muted text-sm ps-indigo-list mb-0">
              {supplied.slice(0, 6).map((e) => (
                <li key={e.id}>
                  [{e.id}] {e.statement}
                </li>
              ))}
            </ul>
          ) : (
            <p className="cc-muted text-sm mb-0">No supplied findings on the register.</p>
          )}
        </section>
        <section className="ps-exec-card">
          <p className="ps-exec-section-kicker">Inference</p>
          {assumptions.length ? (
            <ul className="cc-muted text-sm ps-indigo-list mb-0">
              {assumptions.slice(0, 6).map((e) => (
                <li key={e.id}>
                  [{e.id}] {e.statement}
                </li>
              ))}
            </ul>
          ) : (
            <p className="cc-muted text-sm mb-0">No assumptions recorded.</p>
          )}
        </section>
        <section className="ps-exec-card">
          <p className="ps-exec-section-kicker">Uncertainty</p>
          {gaps.length ? (
            <ul className="cc-muted text-sm ps-indigo-list mb-0">
              {gaps.slice(0, 6).map((e) => (
                <li key={e.id}>
                  [{e.id}] {e.statement}
                </li>
              ))}
            </ul>
          ) : (
            <p className="cc-muted text-sm mb-0">
              No gaps marked — add honest unknowns when needed.
            </p>
          )}
        </section>
      </div>

      {team?.recommendation ? (
        <section className="ps-exec-card mt-4" aria-label="Anti-overdependence counterargument">
          <p className="ps-exec-section-kicker">Anti-overdependence counterargument</p>
          <p className="text-sm">
            Agent recommendation ({AGENT_RECOMMENDATION_LABELS[draft.recommendation]}):{" "}
            {team.recommendation.rationale}
          </p>
          <p className="ps-exec-meta mb-0">
            Production: {team.recommendation.productionLabel}
            {team.recommendation.executionLimited ? " · execution-limited" : ""}
          </p>
        </section>
      ) : (
        <section className="ps-exec-card mt-4">
          <p className="ps-exec-section-kicker">Anti-overdependence counterargument</p>
          <p className="cc-muted text-sm mb-0">
            No structured recommendation on teamCollaboration yet — challenge stays with you until
            research completes.
          </p>
        </section>
      )}

      {mission.approval ? (
        <section className="ps-exec-card mt-4" aria-label="Human decision record">
          <p className="ps-exec-section-kicker">Human decision record</p>
          <p className="text-sm">
            Path: {HUMAN_NEXT_PATH_LABELS[normalizeDecisionChoice(mission.approval.choice)]}
            {mission.approval.agentRecommendation
              ? ` · Agent had: ${AGENT_RECOMMENDATION_LABELS[mission.approval.agentRecommendation]}`
              : ""}
          </p>
          {mission.approval.note ? (
            <p className="cc-muted text-sm">{mission.approval.note}</p>
          ) : null}
          <p className="ps-exec-meta mb-0">Decided {mission.approval.decidedAt}</p>
        </section>
      ) : (
        <section className="ps-exec-card mt-4">
          <p className="ps-exec-section-kicker">Human decision record</p>
          <p className="cc-muted text-sm mb-0">No human path recorded on this case yet.</p>
        </section>
      )}

      <section className="ps-exec-card mt-4" aria-label="Outcome learning loop">
        <p className="ps-exec-section-kicker">Outcome learning loop</p>
        <LearningChain mission={mission} />
        <Link
          to="/command/supervised/$missionId"
          params={{ missionId: mission.id }}
          hash="pr-outcomes"
          className="cc-muted text-xs mt-2 inline-block"
        >
          Open full outcome review ↓
        </Link>
      </section>
    </section>
  );
}
