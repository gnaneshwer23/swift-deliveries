import { buildClaimsBoundary } from "@/lib/pilot-mission/claims-boundary";
import { buildInvestigationCommitment } from "@/lib/pilot-mission/investigation-commitment";
import type { SupervisedMission } from "@/lib/pilot-mission/types";
import { nextRequiredAction } from "@/lib/pilot-mission/types";

/** Right rail: anti-overdependence, claims boundary, working context — all from persisted fields. */
export function IndigoCaseRail({ mission }: { mission: SupervisedMission }) {
  const claims = buildClaimsBoundary(mission);
  const next = nextRequiredAction(mission);
  const commitment = buildInvestigationCommitment({
    question: mission.brief.question,
    researchMode: mission.researchMode ?? "combined",
    researchProviderConfigured: Boolean(mission.researchProvider),
    researchProviderLabel: mission.researchProvider ?? "not configured",
    allowanceLoad: { status: "demo" },
    workspaceUsage:
      mission.usageCeiling > 0
        ? { ceiling: mission.usageCeiling, consumed: mission.usageConsumed }
        : null,
    canStart: true,
    blockedReason: null,
  });

  return (
    <aside className="ps-indigo-case-rail" aria-label="Working context">
      <section className="ps-exec-card">
        <p className="ps-exec-section-kicker">Anti-overdependence</p>
        <h3 className="text-sm font-semibold mt-1 mb-0">You stay the decision owner</h3>
        <p className="cc-muted text-sm mb-0">
          Agents draft and specialists research; only explicit human clicks pass gates. Next on this
          case: <strong>{next.title}</strong>.
        </p>
      </section>

      <section className="ps-exec-card">
        <p className="ps-exec-section-kicker">Claims boundary</p>
        <ul className="cc-muted text-sm grid gap-2 mb-0 ps-indigo-list">
          {claims.onRecord.map((line) => (
            <li key={line.slice(0, 48)}>{line}</li>
          ))}
        </ul>
        {claims.inference.length ? (
          <>
            <p className="ps-exec-meta mt-3 mb-1">Inference / agent-reviewed</p>
            <ul className="cc-muted text-xs grid gap-1 mb-0 ps-indigo-list">
              {claims.inference.map((line) => (
                <li key={line.slice(0, 48)}>{line}</li>
              ))}
            </ul>
          </>
        ) : null}
        <p className="cc-muted text-xs mt-3 mb-0">{claims.qualityNote}</p>
      </section>

      <section className="ps-exec-card">
        <p className="ps-exec-section-kicker">Personal working context</p>
        <p className="text-sm mb-2">{commitment.interpretation}</p>
        <ul className="cc-muted text-xs grid gap-1 mb-0 ps-indigo-list">
          {commitment.limits.slice(0, 4).map((line) => (
            <li key={line.slice(0, 48)}>{line}</li>
          ))}
        </ul>
        <p className="ps-exec-meta mt-3 mb-0">{commitment.allowanceLine}</p>
      </section>
    </aside>
  );
}
