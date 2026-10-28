/**
 * R4 — Artefacts follow the authorised path (not always PRD/code).
 */
import type { HumanNextPath } from "./verdict";
import { HUMAN_NEXT_PATH_LABELS } from "./verdict";

export type PathArtefactGuide = {
  path: HumanNextPath;
  pathLabel: string;
  expectedArtefacts: Array<{ type: string; note: string }>;
  notAutomatic: string;
};

export function pathArtefactGuide(path: HumanNextPath): PathArtefactGuide {
  const pathLabel = HUMAN_NEXT_PATH_LABELS[path];
  switch (path) {
    case "authorise_bounded_test":
      return {
        path,
        pathLabel,
        expectedArtefacts: [
          { type: "Experiment brief", note: "Hypothesis, metric, window — human-gated." },
          {
            type: "Measurement plan",
            note: "What you will observe; DeliverX does not invent results.",
          },
          {
            type: "Optional sandboxed prototype",
            note: "Only after a separate prototype approval.",
          },
        ],
        notAutomatic: "Choosing this path does not start a product build by itself.",
      };
    case "authorise_gather_evidence":
      return {
        path,
        pathLabel,
        expectedArtefacts: [
          { type: "Evidence plan", note: "Named gaps and who supplies findings." },
          {
            type: "Interview guide (planning only)",
            note: "Labelled planning/rehearsal until real interviews are authorised and completed.",
          },
          { type: "Source checklist", note: "What to recheck with dates before reuse." },
        ],
        notAutomatic: "No recruitment or outreach runs without a later human gate.",
      };
    case "authorise_revise":
      return {
        path,
        pathLabel,
        expectedArtefacts: [
          { type: "Revised proposition note", note: "What changed and why." },
          {
            type: "Fresh investigation brief",
            note: "New scope for a follow-up Investigation unit.",
          },
        ],
        notAutomatic: "Revision does not silently replace the prior record.",
      };
    case "close_case":
      return {
        path,
        pathLabel,
        expectedArtefacts: [
          { type: "Close note", note: "Why the case is closed; findings retained with dates." },
          { type: "Archive export", note: "Executive or full archive when you download." },
        ],
        notAutomatic: "Closing does not delete the mission record.",
      };
    case "founder_requested_continuation":
      return {
        path,
        pathLabel,
        expectedArtefacts: [
          { type: "Continuation plan", note: "Unresolved risks labelled on the record." },
          { type: "Case-room artefacts", note: "Only after step gates you approve." },
        ],
        notAutomatic:
          "Does not start silent build — continuation still requires case-room human gates.",
      };
    default: {
      const _exhaustive: never = path;
      return _exhaustive;
    }
  }
}
