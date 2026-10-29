/**
 * Claims boundary — what may be said externally vs what is on the mission record.
 */
import type { SupervisedMission } from "./types";
import { buildPmBriefingPack } from "./pm-briefing-pack";

export type ClaimsBoundary = {
  onRecord: string[];
  inference: string[];
  notClaimed: string[];
  qualityNote: string;
};

export function buildClaimsBoundary(mission: SupervisedMission): ClaimsBoundary {
  const pack = buildPmBriefingPack(mission);
  const supplied = mission.evidence.filter((e) => e.classification === "supplied");
  const gaps = mission.evidence.filter((e) => e.classification === "gap");
  const assumptions = mission.evidence.filter((e) => e.classification === "assumption");

  const onRecord: string[] = [];
  if (supplied.length) {
    onRecord.push(
      `${supplied.length} supplied finding${supplied.length === 1 ? "" : "s"} with source or founder text on the register.`,
    );
  } else {
    onRecord.push("No founder-supplied or cited findings on the register yet.");
  }
  if (mission.approval) {
    onRecord.push("Human next path is recorded on this case.");
  }
  if (mission.exportBody) {
    onRecord.push("Decision pack export is stored on the mission record.");
  }

  const inference: string[] = [];
  if (assumptions.length) {
    inference.push(
      `${assumptions.length} assumption${assumptions.length === 1 ? "" : "s"} — label as inference in external copy.`,
    );
  }
  if (pack.ready && pack.recommendation) {
    inference.push(
      `Agent recommendation (${pack.recommendation}) is Agent-reviewed / rules-derived — not externally attested unless you say so.`,
    );
  }
  if (mission.proposal?.generation.label) {
    inference.push(`Options comparison: ${mission.proposal.generation.label}.`);
  }

  const notClaimed: string[] = [
    "No generic “Verified” badge — use Agent-reviewed, Simulated draft, Human-reviewed, or Externally attested when you cite quality.",
    "No customer interviews unless founder-supplied notes are on the evidence register.",
    "No observed product outcomes unless you recorded them in outcome review.",
  ];
  if (gaps.length) {
    notClaimed.push(
      `${gaps.length} open gap${gaps.length === 1 ? "" : "s"} — do not imply certainty where the register marks unknown.`,
    );
  }

  return {
    onRecord,
    inference,
    notClaimed,
    qualityNote:
      "External copy must match record labels. Simulated drafts stay labelled; gates stay human-only.",
  };
}
