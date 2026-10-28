/**
 * R9 — Cross-cutting honesty surface derived from the mission record.
 */
import type { SupervisedMission } from "./types";
import { commerceUnitFor } from "./commerce";

export type InterviewEvidenceLabel =
  "planning" | "rehearsal" | "recruitment" | "completed" | "analysis" | "not_interview";

export type HonestyPosture = {
  version: "honesty-v1";
  buildabilityVsDesirability: string;
  interviewLabels: Array<{ evidenceId: string; label: InterviewEvidenceLabel; note: string }>;
  costSplit: string[];
  staleEvidence: Array<{ evidenceId: string; statement: string; guidance: string }>;
  notifications: string;
  recovery: string;
  accountability: string;
  accessibility: string;
  deliverables: string;
  dataLifecycle: string;
};

function classifyInterview(statement: string, source: string): InterviewEvidenceLabel {
  const text = `${statement} ${source}`.toLowerCase();
  if (/rehearsal|synthetic interview|simulated interview/.test(text)) return "rehearsal";
  if (/recruit|outreach|panel invite/.test(text)) return "recruitment";
  if (/completed interview|interviewed on|customer said/.test(text)) return "completed";
  if (/analysis of interview|interview themes/.test(text)) return "analysis";
  if (/interview guide|interview plan|draft questions/.test(text)) return "planning";
  return "not_interview";
}

export function buildHonestyPosture(mission: SupervisedMission): HonestyPosture {
  const unit = commerceUnitFor(mission);
  const interviewLabels = mission.evidence
    .map((e) => {
      const label = classifyInterview(e.statement, e.source);
      if (label === "not_interview") return null;
      return {
        evidenceId: e.id,
        label,
        note:
          label === "rehearsal"
            ? "Rehearsal only — not founder-supplied evidence."
            : label === "planning"
              ? "Planning artefact — not a completed interview."
              : label === "completed"
                ? "Treat as completed only if the founder supplied the notes."
                : `Labelled ${label} from wording on the register.`,
      };
    })
    .filter(Boolean) as HonestyPosture["interviewLabels"];

  const dated = mission.evidence.filter((e) =>
    /\b20\d{2}-\d{2}-\d{2}\b|\b20\d{2}\b/.test(e.statement + e.source),
  );
  const undatedSupplied = mission.evidence.filter(
    (e) => e.classification === "supplied" && !/\b20\d{2}/.test(e.statement + e.source),
  );

  return {
    version: "honesty-v1",
    buildabilityVsDesirability:
      "PM briefing keeps technical feasibility separate from customer-problem evidence and next-investment judgement.",
    interviewLabels,
    costSplit: [
      `Current commercial unit on this case: ${unit}.`,
      "Investigation, Continuation, storage, and monitoring are separate ceilings — monitoring units are not live until a Watchtower runner ships.",
      `Mission usage on record: ${mission.usageConsumed}/${mission.usageCeiling}.`,
    ],
    staleEvidence: [
      ...dated.slice(0, 3).map((e) => ({
        evidenceId: e.id,
        statement: e.statement.slice(0, 120),
        guidance: "Has a date cue — recheck before reuse in a new case.",
      })),
      ...undatedSupplied.slice(0, 3).map((e) => ({
        evidenceId: e.id,
        statement: e.statement.slice(0, 120),
        guidance: "No date on the statement/source — add a date before treating as current.",
      })),
    ],
    notifications: mission.studioMeta?.notifyWhenReady
      ? "Notify-when-ready preference is on. Delivery channels are not active yet — check the case record."
      : "Notify-when-ready is off. Digests/mute/dedupe ship with the notifier.",
    recovery: mission.job.lastError
      ? `Last job failure on record: ${mission.job.lastError}. Durable lease/reconnect — failures are stored, not hidden.`
      : "No job failure on record. Execution uses durable leases; reconnect shows the saved stage.",
    accountability:
      "Counterevidence and gaps stay on the register when you disagree with a recommendation. Source independence is preferred over single-model agreement.",
    accessibility:
      "Canvas and portfolio expose list views and keyboard links. Prefer reduced-motion OS settings; decorative motion is non-semantic.",
    deliverables:
      "Specific outputs require human approval (plan, path, prototype, case step gate). Release authority stays with you.",
    dataLifecycle:
      "Exports are permission-aware to this workspace. Retention, deletion, and redaction controls stay on the workspace admin path — not invented here.",
  };
}
