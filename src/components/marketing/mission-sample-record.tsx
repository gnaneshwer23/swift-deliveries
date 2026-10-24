import { useId, useState } from "react";
import { downloadText } from "@/lib/marketing/product-resources";

const RECORDS = [
  {
    title: "Mission brief",
    body: "# Mission brief · onboarding improvement\n\nIllustrative sample. No customer research was performed.\n\nQuestion: Which onboarding change should we investigate first?\nAudience: New users setting up a small software product.\nDesired outcome: Identify a bounded experiment worth investigating.\nConstraints: Do not contact users, modify the live product or deploy.\nEvidence required: Authorised setup notes and a description of the current flow.\nAcceptance: Compare alternatives, preserve evidence gaps and obtain an owner decision.",
  },
  {
    title: "Evidence register",
    body: "# Evidence register\n\nHypothetical teaching material, not genuine customer evidence.\n\nE-01 · Sample owner assertion: setup asks for several details before the first useful action. Source: illustrative setup description. Not independently observed.\nE-02 · Agent inference: some details might be deferred. Derived from E-01; not a validated user need.\nG-01 · Missing: actual abandonment location and baseline completion data.\nG-02 · Missing: authorised customer notes explaining why people leave.\n\nNext recipient: Product Discovery. Do not convert these assumptions into findings.",
  },
  {
    title: "Decision record",
    body: "# Decision record · D-01\n\nIllustrative recommendation. No real owner approval or mission is recorded.\n\nQuestion: Which onboarding change should we investigate first?\nOption A: Shorten setup by removing fields. Risk: useful information may be lost.\nOption B: Defer optional details until after the first useful action. Risk: later completion may suffer.\nOption C: Explain why each detail is needed. Risk: extra explanation may not address the actual cause.\n\nProvisional recommendation: Investigate B, subject to evidence and owner review.\nBasis: Hypothesis E-02 from the sample evidence register, not measured behaviour.\nReviewer objection: Without abandonment data, the cause is unknown. Gather evidence before approving implementation.\nOwner decision: Pending. Approve investigation only, request more evidence, or reject.\nNext recipient: Experiment planning after the owner's scoped decision.\nNo weighted vote is a probability that this will work.",
  },
  {
    title: "Experiment brief",
    body: "# Experiment brief · A-01\n\nIllustrative planning document. No experiment has run and no result is claimed.\n\nHypothesis: Deferring optional details could help users reach the first useful action.\nProposed change: Explore a staged setup flow; do not change the live product.\nMeasure: Setup completion and time to first useful action, with later profile completion as a guardrail.\nBaseline: Not supplied; establish before any experiment.\nObservation window: To be agreed with the owner based on traffic and measurement quality.\nApproval: Required for the specific experiment scope and any external action.\nActual outcome: Not observed.\nNext review: Compare actual observations with the hypothesis; retain uncertainty.\nLinked record: D-01. Connected outcome review remains planned.",
  },
];

export function MissionSampleRecord() {
  const [active, setActive] = useState(0);
  const id = useId();
  const record = RECORDS[active]!;
  return (
    <div className="mission-record">
      <p className="psi-fine-print">
        Illustrative sample · hypothetical material · no customer results or real approvals
      </p>
      <div className="mission-record-selector" role="group" aria-label="Inspect sample documents">
        {RECORDS.map((item, index) => (
          <button
            key={item.title}
            type="button"
            aria-pressed={active === index}
            aria-controls={id}
            onClick={() => setActive(index)}
          >
            {item.title}
          </button>
        ))}
      </div>
      <div
        id={id}
        className="mission-record-body"
        role="region"
        aria-label={record.title}
        tabIndex={0}
      >
        <pre>{record.body}</pre>
      </div>
      <button
        type="button"
        className="dxl-btn dxl-btn-ghost"
        onClick={() => downloadText(`deliverx-onboarding-sample-${active + 1}.md`, record.body)}
      >
        Download sample {record.title.toLowerCase()}
      </button>
    </div>
  );
}
