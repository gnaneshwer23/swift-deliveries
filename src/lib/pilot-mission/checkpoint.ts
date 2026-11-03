/**
 * The project checkpoint: where the work stands, read only from the saved record.
 * Status, the last thing that happened, the next step, the steps already done (kept on the
 * record, not run again by you), and anything to check before acting. Nothing is guessed:
 * a field with no saved source says so.
 */
import { buildActivityFeed, feedTime, HIDDEN_KINDS } from "./activity-feed";
import { buildFirstProject } from "./first-project";
import { missionNeedsAttention } from "./portfolio";
import { lastActivityAt, quietDaysSince, STALL_DAYS } from "./projects-dashboard";
import { studioInboxFields } from "./studio-inbox";
import type { SupervisedMission } from "./types";

export type CheckpointStatus =
  "waiting_on_you" | "team_working" | "in_progress" | "done" | "stopped";

export const CHECKPOINT_STATUS_LABEL: Record<CheckpointStatus, string> = {
  waiting_on_you: "Waiting on you",
  team_working: "Team working",
  in_progress: "In progress",
  done: "Done",
  stopped: "Stopped",
};

export type Checkpoint = {
  status: CheckpointStatus;
  quietDays: number;
  stalled: boolean;
  lastAction: { who: string; what: string; when: string } | null;
  next: { title: string; detail: string };
  done: string[];
  checks: string[];
};

type Next = { id: string; title: string; detail: string };

/** Usage at or above this share of the ceiling is flagged before acting. */
const USAGE_WARN = 0.8;

function statusFor(mission: SupervisedMission, next: Next, now: number): CheckpointStatus {
  if (mission.stage === "cancelled") return "stopped";
  // Once the package is out, recording what happened afterwards is optional.
  if (mission.stage === "exported" || next.id === "follow_up_approved") return "done";
  // A worker holds the step until its lease ends; only then is recovering it yours to do.
  const leaseUntil = mission.job.leaseUntil ? Date.parse(mission.job.leaseUntil) : NaN;
  if (mission.job.status === "leased" && (!Number.isFinite(leaseUntil) || leaseUntil > now)) {
    return "team_working";
  }
  if (next.id === "research_queued") return "team_working";
  if (missionNeedsAttention(next.id)) return "waiting_on_you";
  return "in_progress";
}

export function buildCheckpoint(
  mission: SupervisedMission,
  next: Next,
  now: number = Date.now(),
): Checkpoint {
  const status = statusFor(mission, next, now);
  const activity = mission.activity.filter((e) => !HIDDEN_KINDS.has(e.kind));
  const last = lastActivityAt({ updatedAt: mission.updatedAt, recentActivity: activity });
  const quietDays = quietDaysSince(last, now);

  const [latest] = buildActivityFeed(
    [{ id: mission.id, name: mission.brief.question, activity }],
    1,
  );

  const path = buildFirstProject([
    {
      id: mission.id,
      question: mission.brief.question,
      stage: mission.stage,
      archived: false,
      updatedAt: mission.updatedAt,
      planApproved: Boolean(mission.team?.approvedAt),
      decisionRecorded: Boolean(mission.approval),
      delivery: Boolean(mission.delivery),
      observationRecorded: Boolean(mission.observation),
    },
  ]);

  const checks: string[] = [];
  const inbox = studioInboxFields(mission);
  if (mission.job.status === "failed") {
    checks.push(
      `The last comparison failed${mission.job.lastError ? `: ${mission.job.lastError}` : "."}`,
    );
  }
  if (inbox.investigationPaused) checks.push("The investigation is paused.");
  if (inbox.openQuestionCount > 0) {
    checks.push(
      `${inbox.openQuestionCount} open ${inbox.openQuestionCount === 1 ? "question" : "questions"} from the team.`,
    );
  }
  if (inbox.researchPassQueued) {
    checks.push("Specialists are still researching; their findings are not on the record yet.");
  }
  if (mission.usageCeiling > 0 && mission.usageConsumed >= mission.usageCeiling * USAGE_WARN) {
    checks.push(
      `Usage is at ${mission.usageConsumed} of ${mission.usageCeiling}. Steps stop at the ceiling.`,
    );
  }

  return {
    status,
    quietDays,
    stalled:
      (status === "waiting_on_you" || status === "in_progress" || status === "team_working") &&
      quietDays >= STALL_DAYS,
    lastAction: latest
      ? { who: latest.who, what: latest.what, when: feedTime(latest.at, new Date(now)) }
      : null,
    next: { title: next.title, detail: next.detail },
    done: path ? path.steps.filter((s) => s.done).map((s) => s.label) : [],
    checks,
  };
}
