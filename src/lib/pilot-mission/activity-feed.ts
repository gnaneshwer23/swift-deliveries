/**
 * "What the team did": the most recent saved activity across your projects, as short lines.
 * Read only from each project's own activity log. Known event kinds get a short label;
 * anything else shows the first sentence the record itself saved, never a guess.
 */
import { getCapability } from "@/lib/workforce/registry";
import type { PilotActivityEvent } from "./specialist-team";

export type FeedSource = {
  id: string;
  name: string;
  activity: Pick<PilotActivityEvent, "id" | "at" | "kind" | "summary" | "actor">[];
};

export type FeedItem = {
  key: string;
  projectId: string;
  projectName: string;
  at: string;
  who: string;
  what: string;
  /** "you" for owner actions, "team" for specialists and the system. */
  by: "you" | "team";
};

const LABELS: Record<string, string> = {
  "mission.created": "started the project",
  "pm_brief.drafted": "drafted the PM brief",
  "plan.proposed": "proposed a plan for your approval",
  "plan.approved": "approved the plan",
  "plan.approval_stale": "flagged the plan for re-approval",
  "research.pass.queued": "queued the research pass",
  "research.pass.started": "started research",
  "research.pass.completed": "finished the research pass",
  "research.external_gap": "listed an evidence gap",
  "research.provided_only": "worked from the evidence you supplied",
  "research_mode.set": "set the research mode",
  "evidence.saved": "saved evidence",
  "options.compared": "compared the options",
  "continuation.plan.drafted": "drafted the build plan",
  "case_room.opened": "opened the project room",
  "case_room.step_gate": "passed a step gate",
  "delivery.approved": "approved delivery",
  "prototype.approved": "approved the prototype",
  "pack.exported": "downloaded the project package",
  "meeting.notes_added": "added meeting notes",
  "meeting.notes_removed": "removed meeting notes",
  "watchtower.config_saved": "updated monitoring",
  "task.started": "started a task",
  "task.completed": "finished a task",
  "research.cited": "cited a source",
  "prototype.built": "built the prototype",
  "prototype.verify_failed": "flagged a prototype check that failed",
  "meeting.proposal_accepted": "accepted a task from meeting notes",
  "meeting.proposal_dismissed": "dismissed a task from meeting notes",
  "meeting.proposal_proposed": "reopened a task from meeting notes",
};

/** Owner-only actions: recorded with the owner's id rather than "human". */
const OWNER_KINDS = new Set([
  "plan.approved",
  "delivery.approved",
  "prototype.approved",
  "pack.exported",
  "meeting.notes_added",
  "meeting.notes_removed",
  "watchtower.config_saved",
  "research_mode.set",
  "case_room.step_gate",
  "meeting.proposal_accepted",
  "meeting.proposal_dismissed",
  "meeting.proposal_proposed",
  // Favourite, rename and archive are saved only by the owner (kept out of the feed).
  "studio.meta_saved",
]);

/** Housekeeping that is not work: kept in the record, left out of the feed. */
export const HIDDEN_KINDS = new Set(["studio.meta_saved"]);

function firstSentence(text: string): string {
  const s = text.trim().split(/(?<=[.!?])\s/)[0] ?? "";
  return s.length > 90 ? `${s.slice(0, 87).trimEnd()}…` : s;
}

function actorOf(e: FeedSource["activity"][number]): { who: string; by: "you" | "team" } {
  if (e.actor === "human" || (OWNER_KINDS.has(e.kind) && e.actor !== "system")) {
    return { who: "You", by: "you" };
  }
  if (e.actor === "system") return { who: "DeliverX", by: "team" };
  const role = getCapability(e.actor);
  if (role) return { who: role.name.replace(/\s+agent$/i, ""), by: "team" };
  // Not a role and not the owner: a model run (e.g. an options comparison) or other system step.
  return { who: "DeliverX", by: "team" };
}

/** Who did it and what, in the feed's words; `what` is empty when nothing can be said. */
export function describeEvent(e: FeedSource["activity"][number]): {
  who: string;
  by: "you" | "team";
  what: string;
} {
  const { who, by } = actorOf(e);
  return { who, by, what: LABELS[e.kind] ?? firstSentence(e.summary) };
}

export function buildActivityFeed(projects: FeedSource[], limit = 6): FeedItem[] {
  const items: FeedItem[] = [];
  for (const p of projects) {
    for (const e of p.activity) {
      if (HIDDEN_KINDS.has(e.kind) || !Date.parse(e.at)) continue;
      const { who, by, what } = describeEvent(e);
      if (!what) continue;
      items.push({
        key: `${p.id}:${e.id}`,
        projectId: p.id,
        projectName: p.name,
        at: e.at,
        who,
        what,
        by,
      });
    }
  }
  return items.sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, limit);
}

/** "10:42" today, "Yesterday", or "3 Nov". */
export function feedTime(at: string, now = new Date()): string {
  const d = new Date(at);
  const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day(now) - day(d)) / 86_400_000);
  if (diff === 0) return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
