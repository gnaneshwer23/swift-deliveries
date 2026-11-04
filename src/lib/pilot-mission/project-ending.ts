/**
 * What “completed” means on a supervised case, read from the saved record.
 *
 * A stored decision-pack export finishes the case. Later learning and a proposed
 * follow-up stay visible as human gates. Agents never pass those gates.
 */
import { nextGateLabel } from "./next-gate";
import { nextRequiredAction, type SupervisedMission } from "./types";

export type ProjectEnding = {
  /** The decision pack is stored, and the case is not waiting on that export or a follow-up approval. */
  completed: boolean;
  meaning: string;
  /** The next thing a person must do. Null when nothing is required to finish. */
  nextHumanGate: string | null;
  /** Shown while delivery is underway, before the pack export counts as completion. */
  howItEnds: string;
};

const MEANING =
  "Completed means the decision pack is saved on this case. Optional learning — an observed result you supply later — is separate and is not required to finish. A sandboxed prototype is a separate approval.";

const HOW_IT_ENDS =
  "This project ends when the decision pack is exported. Charter, PRD and other delivery documents appear only after each stage saves them. While the build is running, progress is the stages already saved — there is no estimated timer. Human gates stay yours: agents can stop at a gate, and only you can pass it.";

/** Learning steps that stay available after the pack is saved. */
const OPTIONAL_AFTER_PACK = new Set(["observation", "review", "expectation"]);

/** Steps where the team is busy, so there is no human gate yet. */
const NOT_A_HUMAN_GATE = new Set([
  "completed",
  "follow_up_approved",
  "cancelled",
  "research_queued",
]);

type Next = { id: string; title: string };

export function projectEnding(mission: SupervisedMission, next?: Next): ProjectEnding {
  const gate = next ?? nextRequiredAction(mission);
  const packSaved = Boolean(mission.exportBody);
  const completed =
    packSaved &&
    mission.stage !== "cancelled" &&
    gate.id !== "export" &&
    gate.id !== "approve_follow_up";

  let nextHumanGate: string | null = null;
  if (mission.stage !== "cancelled" && !NOT_A_HUMAN_GATE.has(gate.id)) {
    const label = nextGateLabel(gate);
    nextHumanGate =
      completed && OPTIONAL_AFTER_PACK.has(gate.id)
        ? `${label} (optional — not required to finish)`
        : label;
  }

  return { completed, meaning: MEANING, nextHumanGate, howItEnds: HOW_IT_ENDS };
}
