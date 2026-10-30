import { buildInvestigationCommitment } from "@/lib/pilot-mission/investigation-commitment";
import { buildPmBrief } from "@/lib/pilot-mission/pm-brief";
import { honestyBadges } from "@/lib/pilot-mission/theatre";
import type { SupervisedMission } from "@/lib/pilot-mission/types";
import type { MissionTheatreActions } from "@/components/command/mission-theatre";
import { SupervisedBriefEditor } from "@/components/command/supervised-brief-editor";

/** Scope stage — PM interpretation, editable brief, and pre-approval provider/usage disclosure. */
export function InvestigationScopeReview({
  mission,
  missionId,
  missionOpen,
  usageWarning,
  research,
  onDone,
  onError,
}: {
  mission: SupervisedMission;
  missionId: string;
  missionOpen: boolean;
  usageWarning: string | null;
  research: MissionTheatreActions["research"];
  onDone: () => Promise<void>;
  onError: (error: unknown) => void;
}) {
  const brief = buildPmBrief(mission);
  const badges = honestyBadges(mission);
  const providerConfigured = research.tools.some((tool) => tool.available);
  const providerLabel =
    research.tools
      .filter((tool) => tool.available)
      .map((tool) => tool.label)
      .join(" · ") || "Not configured";

  const commitment = buildInvestigationCommitment({
    question: mission.brief.question,
    researchMode: mission.researchMode ?? "combined",
    researchProviderConfigured: providerConfigured,
    researchProviderLabel: providerLabel,
    allowanceLoad: usageWarning ? { status: "failed", reason: usageWarning } : { status: "demo" },
    workspaceUsage:
      mission.usageCeiling > 0
        ? { ceiling: mission.usageCeiling, consumed: mission.usageConsumed }
        : null,
    canStart: !usageWarning,
    blockedReason: usageWarning ?? research.blockReason,
  });

  return (
    <section className="ps-scope-review" aria-label="PM understanding">
      <p className="cc-kicker">{brief.team.initiatingAgent}</p>
      <h2 className="ps-scope-review-title">Here&apos;s what we understood</h2>
      <p className="text-sm">{brief.problemStatement}</p>
      <ul className="ps-honesty-badges" aria-label="How this was produced">
        {badges.map((b) => (
          <li key={b.id}>{b.label}</li>
        ))}
      </ul>

      <dl className="ps-scope-review-grid">
        <div>
          <dt>Intended outcome</dt>
          <dd className="text-sm">{mission.brief.outcome}</dd>
        </div>
        <div>
          <dt>Constraints &amp; non-goals</dt>
          <dd className="text-sm">{mission.brief.constraints}</dd>
        </div>
      </dl>

      <div className="ps-theatre-columns">
        <div>
          <h3 className="text-sm font-medium">Known</h3>
          <ul className="text-sm cc-muted">
            {brief.knowns.map((item) => (
              <li key={item.slice(0, 48)}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-medium">Unknowns (honest)</h3>
          <ul className="text-sm cc-muted">
            {brief.unknowns.map((item) => (
              <li key={item.slice(0, 48)}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <SupervisedBriefEditor
        recordVersion={mission.version}
        missionId={missionId}
        initial={mission.brief}
        locked={!missionOpen || Boolean(mission.team?.approvedAt)}
        onDone={onDone}
        onError={onError}
        defaultOpen
      />

      <details className="ps-commitment mt-4">
        <summary>Before you approve — plan, providers &amp; usage</summary>
        <p className="text-sm mt-2">{commitment.interpretation}</p>
        <h4 className="text-xs font-medium mt-3 mb-1">Sources</h4>
        <ul className="cc-muted text-xs">
          {commitment.sources.map((line) => (
            <li key={line.slice(0, 48)}>{line}</li>
          ))}
        </ul>
        {research.externalGaps.length ? (
          <>
            <h4 className="text-xs font-medium mt-2 mb-1">Provider gaps (no invented results)</h4>
            <ul className="cc-muted text-xs">
              {research.externalGaps.map((line) => (
                <li key={line.slice(0, 48)}>{line}</li>
              ))}
            </ul>
          </>
        ) : null}
        <h4 className="text-xs font-medium mt-2 mb-1">Limits</h4>
        <ul className="cc-muted text-xs">
          {commitment.limits.map((line) => (
            <li key={line.slice(0, 48)}>{line}</li>
          ))}
        </ul>
        <p className="text-sm mt-2" role="status">
          {commitment.allowanceLine}
        </p>
        <p className="cc-muted text-xs mt-1">
          Mission usage on record: {mission.usageConsumed} of {mission.usageCeiling || "—"} units
          reserved for this case. {brief.roughCost.detail}
        </p>
      </details>
    </section>
  );
}
