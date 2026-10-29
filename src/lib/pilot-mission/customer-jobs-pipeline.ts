/**
 * Five-job investigation pipeline — maps Quiet Studio progress to founder-facing labels.
 * State is derived from persisted `stage` only (no simulated progress).
 */
import { PROGRESS_STEPS, stepState, type SupervisedMission } from "./types";

export const CUSTOMER_JOBS = [
  {
    id: "brief",
    label: "Frame the opportunity",
    detail: "Problem, audience, and constraints you supplied.",
  },
  {
    id: "evidence",
    label: "Test assumptions",
    detail: "Evidence register and honest gaps — not invented interviews.",
  },
  {
    id: "alternatives",
    label: "Compare paths",
    detail: "Specialist options after research, before your gate.",
  },
  {
    id: "decision",
    label: "Choose with evidence",
    detail: "Human path recorded; agents never auto-pass.",
  },
  {
    id: "export",
    label: "Deliver & learn",
    detail: "Approved work, exports, and outcome review on record.",
  },
] as const;

export type CustomerJobId = (typeof CUSTOMER_JOBS)[number]["id"];

export type CustomerJobRow = {
  id: CustomerJobId;
  label: string;
  detail: string;
  state: "done" | "current" | "upcoming";
};

/** Collapse artefact + export stages into the fifth job. */
function jobStepIndex(jobId: CustomerJobId): number {
  if (jobId === "export") {
    return PROGRESS_STEPS.findIndex((s) => s.id === "artefact");
  }
  return PROGRESS_STEPS.findIndex((s) => s.id === jobId);
}

export function buildCustomerJobsPipeline(mission: SupervisedMission): CustomerJobRow[] {
  return CUSTOMER_JOBS.map((job) => {
    const stepIndex = jobStepIndex(job.id);
    let state = stepState(mission.stage, stepIndex);
    if (job.id === "export") {
      const artefactState = stepState(mission.stage, jobStepIndex("export"));
      const exportState = stepState(
        mission.stage,
        PROGRESS_STEPS.findIndex((s) => s.id === "export"),
      );
      if (exportState === "done" || artefactState === "done") state = "done";
      else if (artefactState === "current" || exportState === "current") state = "current";
      else state = "upcoming";
    }
    return { ...job, state };
  });
}
