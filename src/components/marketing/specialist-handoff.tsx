"use client";

import { useState } from "react";
import { SpecialistScene } from "@/components/marketing/specialist-workforce";

const STEPS = [
  {
    id: "evidence",
    label: "Evidence",
    task: "Evidence brief finished from supplied sources.",
    reason: "The question needs a shared starting point.",
    evidence: "Owner-supplied sources, with gaps left open.",
    artefact: "Evidence brief handed to Options.",
  },
  {
    id: "options",
    label: "Options",
    task: "Compared options finished against the brief.",
    reason: "A direction needs the trade-offs in view.",
    evidence: "Constraints and gaps carried from the brief.",
    artefact: "Options note handed to Challenge.",
  },
  {
    id: "challenge",
    label: "Challenge",
    task: "Challenge of the recommendation finished.",
    reason: "A single draft is not an independent check.",
    evidence: "Objections and unresolved questions.",
    artefact: "Challenge note handed to Decision.",
  },
  {
    id: "decision",
    label: "Decision",
    task: "Owner decision recorded.",
    reason: "The next step stays a human decision.",
    evidence: "Options, objections and remaining uncertainty.",
    artefact: "Decision record handed to Builder.",
  },
  {
    id: "builder",
    label: "Builder",
    task: "Bounded draft finished from the decision.",
    reason: "Build follows the approved scope.",
    evidence: "Decision record and stated limitations.",
    artefact: "Draft pack handed to Export.",
  },
  {
    id: "export",
    label: "Export",
    task: "Pack assembled and waiting.",
    reason: "The owner approves before the pack is exported.",
    evidence: "Decision record and artefact versions.",
    artefact: "Export held until the owner approves.",
  },
] as const;

type StepId = (typeof STEPS)[number]["id"];

export function SpecialistHandoff() {
  const [selected, setSelected] = useState<StepId>("evidence");
  const step = STEPS.find((item) => item.id === selected) ?? STEPS[0];

  return (
    <div className="psi-walkthrough psi-workforce mt-8">
      <div className="psi-step-selector" role="group" aria-label="Specialist contribution">
        {STEPS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={item.id === step.id}
            onClick={() => setSelected(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="psi-walk-panel">
        <SpecialistScene role={step.id} />
        <div className="psi-walk-copy">
          <p>
            <strong>Task finished.</strong> {step.task}
          </p>
          <p>
            <strong>Reason.</strong> {step.reason}
          </p>
          <p>
            <strong>Evidence.</strong> {step.evidence}
          </p>
          <p>
            <strong>Artefact handed on.</strong> {step.artefact}
          </p>
        </div>
      </div>
    </div>
  );
}
