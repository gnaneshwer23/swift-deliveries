/**
 * The Workroom — the build as a team's workspace: a board, each agent's work plan, the plan's
 * order and the team's capacity. Read only from the delivery engine's task and artefact rows
 * (via `buildDeliveryRoom`); nothing is estimated beyond what the rows record.
 */
import { buildDeliveryRoom, type BuildOutput, type BuildStageStatus } from "./delivery-room";
import {
  LIFECYCLE_STAGE_LABELS,
  type LifecycleStage,
  type MissionBundle,
} from "@/lib/workforce/types";

export type BoardColumnId = "next" | "working" | "needs_you" | "done";

export const BOARD_COLUMNS: Array<{ id: BoardColumnId; label: string }> = [
  { id: "next", label: "Up next" },
  { id: "working", label: "Working" },
  { id: "needs_you", label: "Needs you" },
  { id: "done", label: "Done" },
];

const COLUMN_FOR: Record<BuildStageStatus, BoardColumnId> = {
  next: "next",
  working: "working",
  waiting_on_you: "needs_you",
  sent_back: "needs_you",
  failed: "needs_you",
  done: "done",
  skipped: "done",
};

/** How an agent plans one task: what it must produce, what it builds on, and its check. */
export type WorkPlan = {
  goal: string;
  mustInclude: string[];
  check: string;
  buildsOn: Array<{ title: string; owner: string; done: boolean }>;
  unblocks: string[];
};

export type WorkCard = {
  taskId: string;
  key: string;
  title: string;
  column: BoardColumnId;
  status: BuildStageStatus;
  gate: boolean;
  owner: string;
  role: string;
  stage: string | null;
  output: BuildOutput | null;
  plan: WorkPlan;
  usage: { budget: number; used: number };
};

export type TimelineLane = { stage: string; cards: WorkCard[] };

export type TeamLoad = {
  name: string;
  role: string;
  tasks: { total: number; done: number; working: number; next: number };
  usage: { budget: number; used: number };
  current: string | null;
};

export type Workroom = {
  cards: WorkCard[];
  board: Array<{ id: BoardColumnId; label: string; cards: WorkCard[] }>;
  timeline: TimelineLane[];
  team: TeamLoad[];
  usage: { budget: number; used: number };
};

function stageLabel(stage: LifecycleStage | null): string | null {
  return stage ? LIFECYCLE_STAGE_LABELS[stage].replace(/^\d+\s*·\s*/, "") : null;
}

export function buildWorkroom(bundle: MissionBundle): Workroom {
  const room = buildDeliveryRoom(bundle);
  const byId = new Map(bundle.tasks.map((t) => [t.id, t]));
  const byKey = new Map(bundle.tasks.map((t) => [t.key, t]));
  const stageById = new Map(room.stages.map((s) => [s.taskId, s]));

  const cards: WorkCard[] = room.stages.map((s) => {
    const task = byId.get(s.taskId)!;
    return {
      taskId: s.taskId,
      key: s.key,
      title: s.title,
      column: COLUMN_FOR[s.status],
      status: s.status,
      gate: s.gate,
      owner: s.owner,
      role: s.role,
      stage: stageLabel(task.stage),
      output: s.output,
      plan: {
        goal: task.description,
        mustInclude: task.requiredSections,
        check: task.acceptanceCriteria,
        buildsOn: task.dependsOn
          .map((k) => byKey.get(k))
          .filter((t): t is NonNullable<typeof t> => Boolean(t))
          .map((t) => {
            const up = stageById.get(t.id);
            return {
              title: up?.title ?? t.title,
              owner: up?.owner ?? "",
              done: t.status === "completed",
            };
          }),
        unblocks: bundle.tasks
          .filter((t) => t.dependsOn.includes(task.key))
          .map((t) => stageById.get(t.id)?.title ?? t.title),
      },
      usage: { budget: task.estimatedUsage, used: task.actualUsage },
    };
  });

  const lanes = new Map<string, WorkCard[]>();
  for (const c of cards) {
    const lane = c.stage ?? "Other";
    lanes.set(lane, [...(lanes.get(lane) ?? []), c]);
  }

  const team = new Map<string, TeamLoad>();
  for (const c of cards) {
    if (c.gate) continue;
    const t = team.get(c.owner) ?? {
      name: c.owner,
      role: c.role,
      tasks: { total: 0, done: 0, working: 0, next: 0 },
      usage: { budget: 0, used: 0 },
      current: null,
    };
    t.tasks.total += 1;
    if (c.column === "done") t.tasks.done += 1;
    else if (c.column === "working") {
      t.tasks.working += 1;
      t.current = c.title;
    } else t.tasks.next += 1;
    t.usage.budget += c.usage.budget;
    t.usage.used += c.usage.used;
    team.set(c.owner, t);
  }

  return {
    cards,
    board: BOARD_COLUMNS.map((col) => ({
      ...col,
      cards: cards.filter((c) => c.column === col.id),
    })),
    timeline: [...lanes.entries()].map(([stage, laneCards]) => ({ stage, cards: laneCards })),
    team: [...team.values()],
    usage: {
      budget: cards.reduce((n, c) => n + c.usage.budget, 0),
      used: cards.reduce((n, c) => n + c.usage.used, 0),
    },
  };
}
