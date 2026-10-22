import { useState } from "react";
import { INTENT_LABELS, type MissionIntent } from "@/lib/workforce/types";
import { CheckCircle2, Clock3, FlaskConical, Search, ShieldCheck, Wrench } from "lucide-react";

const SCENARIOS: Record<
  MissionIntent,
  {
    request: string;
    permission: string;
    credits: number;
    tasks: Array<{ title: string; status: "ready" | "gated" }>;
    deliverable: string;
  }
> = {
  investigate: {
    request:
      "Evaluate a sponsor reporting dashboard for healthcare delivery leads — separating sourced facts from working assumptions.",
    permission: "Plan → Create",
    credits: 18,
    tasks: [
      { title: "Scope decision criteria & stakeholder constraints", status: "ready" },
      { title: "Synthesise comparator evidence & buyer signals", status: "ready" },
      { title: "Compile decision brief with separated assumptions", status: "gated" },
    ],
    deliverable: "Decision Brief & Evidence Matrix",
  },
  prototype: {
    request:
      "Design a workspace budget-ceiling notification drawer with a clear hard-stop state and approval summary.",
    permission: "Sandboxed Create",
    credits: 24,
    tasks: [
      { title: "Draft interaction states & acceptance criteria", status: "ready" },
      { title: "Compose interactive sandboxed HTML prototype", status: "ready" },
      { title: "Run accessibility & quality review checks", status: "gated" },
    ],
    deliverable: "Product Spec & Interactive Prototype",
  },
  improve: {
    request:
      "Diagnose mobile checkout drop-off between basket review and payment confirmation and propose a bounded fix.",
    permission: "Internal Execution",
    credits: 21,
    tasks: [
      { title: "Isolate high-friction form validation steps", status: "ready" },
      { title: "Draft bounded remediation diff & guardrails", status: "ready" },
      { title: "Define verification metrics & rollback criteria", status: "gated" },
    ],
    deliverable: "Friction Diagnosis & Remediation Plan",
  },
};

/**
 * Clean, Finsage-inspired 3D sculptural hero showcase with minimal interactive plan card.
 */
export function CommandCentreComposition() {
  const [selectedIntent, setSelectedIntent] = useState<MissionIntent>("investigate");
  const active = SCENARIOS[selectedIntent];

  return (
    <div className="finsage-showcase" role="region" aria-label="Interactive Command Centre preview">
      {/* 3D Sculptural Centrepiece */}
      <div className="finsage-3d-frame">
        <img
          src="/assets/3d/command-core.jpg"
          alt="3D sculptural representation of the DeliverX human approval gate prism"
          className="finsage-3d-img"
          loading="eager"
        />
        <div className="finsage-floating-badge">
          <ShieldCheck className="size-3.5 text-emerald-400" aria-hidden="true" />
          <span>Human Approval Gate</span>
        </div>
      </div>

      {/* Minimal Interactive Plan Card */}
      <div className="finsage-card-body">
        <div className="finsage-tabs" role="tablist" aria-label="Preview mission intents">
          {(
            [
              { id: "investigate", icon: Search },
              { id: "prototype", icon: FlaskConical },
              { id: "improve", icon: Wrench },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const isSelected = selectedIntent === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setSelectedIntent(item.id)}
                className={`finsage-tab${isSelected ? " is-active" : ""}`}
              >
                <Icon className="size-3.5" aria-hidden="true" />
                <span>{INTENT_LABELS[item.id]}</span>
              </button>
            );
          })}
        </div>

        <div className="finsage-plan-box">
          <div className="finsage-plan-head">
            <span className="finsage-plan-kicker">Proposed Mission Plan</span>
            <span className="finsage-plan-pill">{active.permission}</span>
          </div>
          <p className="finsage-plan-request">{active.request}</p>

          <div className="finsage-task-list">
            {active.tasks.map((t, idx) => (
              <div key={t.title} className="finsage-task-row">
                {t.status === "ready" ? (
                  <CheckCircle2 className="size-3.5 text-emerald-700 shrink-0" />
                ) : (
                  <Clock3 className="size-3.5 text-amber-700 shrink-0" />
                )}
                <span>
                  {idx + 1}. {t.title}
                </span>
              </div>
            ))}
          </div>

          <div className="finsage-plan-foot">
            <div className="finsage-plan-meta">
              <strong>{active.credits} credits</strong>
              <span>·</span>
              <span>{active.deliverable}</span>
            </div>
            <span className="finsage-approve-pill">Approve Plan →</span>
          </div>
        </div>
      </div>
    </div>
  );
}
