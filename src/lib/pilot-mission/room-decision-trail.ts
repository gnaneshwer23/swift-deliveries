/**
 * A short, auditable trail of how this case moved: specialist handoffs that were
 * saved, who proposed each decision, and what the owner approved.
 * Derived assignments are not shown as if agents had already talked.
 */
import { decisionLog, evidenceRegister, type EvidenceLabel } from "./case-log";
import type { SupervisedMission } from "./types";
import { AGENT_RECOMMENDATION_LABELS } from "./verdict";

export type RoomTrailKind = "handoff" | "recommendation" | "decision" | "evidence";

export type RoomTrailRow = {
  id: string;
  kind: RoomTrailKind;
  title: string;
  detail: string;
  badge: string;
};

export type RoomDecisionTrail = {
  intro: string;
  rows: RoomTrailRow[];
};

const EVIDENCE_ORDER: EvidenceLabel[] = [
  "Source-backed",
  "User-provided",
  "Assumption",
  "Unverified",
];

function decisionBadge(id: string, superseded: string | null): string {
  if (superseded) return "No longer applies";
  if (id === "expectation" || id.startsWith("review")) return "On record";
  return "Human approval";
}

export function buildRoomDecisionTrail(mission: SupervisedMission): RoomDecisionTrail {
  const rows: RoomTrailRow[] = [];
  const persisted = mission.teamCollaboration ?? null;

  if (persisted) {
    for (const handoff of persisted.handoffs) {
      if (handoff.id.endsWith("-use")) continue;
      rows.push({
        id: `handoff-${handoff.id}`,
        kind: "handoff",
        title: `${handoff.fromActor} → ${handoff.toActor}`,
        detail: handoff.findingSummary,
        badge: handoff.productionLabel,
      });
    }
    if (persisted.recommendation) {
      const rec = persisted.recommendation;
      rows.push({
        id: "recommendation",
        kind: "recommendation",
        title: `Recommendation: ${AGENT_RECOMMENDATION_LABELS[rec.recommendation]}`,
        detail: rec.rationale,
        badge: rec.productionLabel,
      });
    }
  }

  for (const decision of decisionLog(mission)) {
    rows.push({
      id: `decision-${decision.id}`,
      kind: "decision",
      title: decision.title,
      detail: `${decision.proposedBy} ${decision.approved}`,
      badge: decisionBadge(decision.id, decision.superseded),
    });
  }

  const register = evidenceRegister(mission);
  if (register.length) {
    const counts = EVIDENCE_ORDER.map((label) => {
      const n = register.filter((item) => item.label === label).length;
      return n ? `${n} ${label.toLowerCase()}` : null;
    }).filter((line): line is string => Boolean(line));
    rows.push({
      id: "evidence",
      kind: "evidence",
      title: "Evidence on the record",
      detail: counts.join(", "),
      badge: "Evidence",
    });
  }

  const intro = persisted
    ? "Specialist handoffs, who proposed what, and your approvals — from the saved record. This is not a chat transcript."
    : mission.team
      ? "No specialist handoff is saved yet. The decisions below are the plan and your approvals, not an agent conversation."
      : "Decisions and handoffs appear here once they are saved on this case.";

  return { intro, rows };
}

/** Same trail, as a short section inside the project package. */
export function decisionTrailMarkdown(mission: SupervisedMission): string {
  const trail = buildRoomDecisionTrail(mission);
  const lines = [`## How the team decided`, ``, trail.intro, ``];
  const shown = trail.rows.filter((row) => row.kind !== "evidence");
  if (!shown.length) {
    lines.push("No handoff or decision is saved on this case yet.", ``);
    return lines.join("\n");
  }
  for (const row of shown) {
    lines.push(`- **${row.title}** — ${row.badge}`, `  ${row.detail}`, ``);
  }
  const evidence = trail.rows.find((row) => row.kind === "evidence");
  if (evidence) {
    lines.push(`- **${evidence.title}** — ${evidence.detail}`, ``);
  }
  return lines.join("\n");
}
