/**
 * Case timeline (Studio Screen 11): the case's milestones in order, each marked done only when
 * its own record exists, with the recorded time. The first milestone without a record is next;
 * it waits on the owner when it is the owner's step. Delivery stages come from the linked build
 * mission and are drawn separately from its task graph.
 */
import type { SupervisedMission } from "./types";

export type MilestoneState = "done" | "next" | "waiting" | "upcoming";

export type CaseMilestone = {
  id: string;
  title: string;
  /** Who acts at this milestone. */
  owner: "you" | "specialists";
  at: string | null;
  state: MilestoneState;
  detail: string;
};

type Draft = Omit<CaseMilestone, "state"> & { recorded: boolean };

export function caseMilestones(mission: SupervisedMission): CaseMilestone[] {
  const drafts: Draft[] = [
    {
      id: "plan",
      title: "Approve the brief and investigation plan",
      owner: "you",
      at: mission.team?.approvedAt ?? null,
      recorded: Boolean(mission.team?.approvedAt),
      detail: "Nothing runs until you approve the bounded plan.",
    },
    {
      id: "research",
      title: "Research pass",
      owner: "specialists",
      at: mission.researchPassCompletedAt,
      recorded: Boolean(mission.researchPassCompletedAt),
      detail: mission.researchPassQueuedAt
        ? "Queued for the worker; findings and honest gaps go into the evidence register."
        : "Findings and honest gaps go into the evidence register.",
    },
    {
      id: "options",
      // You start the comparison; specialists draft the options.
      title: "Start the options comparison",
      owner: "you",
      at: null,
      recorded: Boolean(mission.proposal),
      detail: mission.proposal
        ? mission.proposal.generation.ran
          ? `Drafted by model ${mission.proposal.generation.model ?? mission.proposal.generation.provider ?? "(id not recorded)"}.`
          : "Simulated drafts: no model ran."
        : "You start it; specialists draft the options from the brief and evidence.",
    },
    {
      id: "decision",
      title: "Record your decision",
      owner: "you",
      at: mission.approval?.decidedAt ?? null,
      recorded: Boolean(mission.approval),
      detail: "Choose a direction, more evidence, a revision or closing the case.",
    },
    {
      id: "delivery",
      title: "Approve delivery",
      owner: "you",
      at: mission.delivery?.approvedAt ?? null,
      recorded: Boolean(mission.delivery),
      detail: "Starts the staged build mission; scope, design and release wait on you.",
    },
    {
      id: "expectation",
      title: "Record what you expect",
      owner: "you",
      at: mission.expectation?.recordedAt ?? null,
      recorded: Boolean(mission.expectation),
      detail: "Hypothesis, metric, baseline and observation window.",
    },
    {
      id: "observation",
      title: "Supply the observed result",
      owner: "you",
      at: mission.observation?.suppliedAt ?? null,
      recorded: Boolean(mission.observation),
      detail: "DeliverX does not measure results; you supply them.",
    },
    {
      id: "review",
      title: "Review expected against observed",
      owner: "you",
      at: mission.reviews.at(-1)?.createdAt ?? null,
      recorded: mission.reviews.length > 0,
      detail: "Saving a review proposes a follow-up; it does not start it.",
    },
  ];

  const nextIndex = drafts.findIndex((d) => !d.recorded);
  const closed = mission.stage === "cancelled";
  return drafts.map(({ recorded, ...milestone }, index) => ({
    ...milestone,
    state: recorded
      ? "done"
      : !closed && index === nextIndex
        ? milestone.owner === "you"
          ? "waiting"
          : "next"
        : "upcoming",
  }));
}

export const MILESTONE_STATE_TEXT: Record<MilestoneState, string> = {
  done: "Done",
  next: "Next",
  waiting: "Waiting on you",
  upcoming: "Not started",
};
