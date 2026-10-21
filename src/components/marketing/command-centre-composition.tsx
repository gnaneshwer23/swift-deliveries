import { useState } from "react";
import { INTENT_LABELS, type MissionIntent } from "@/lib/workforce/types";
import { WAVE1_AVAILABLE_IDS } from "@/lib/workforce/registry";
import {
  CheckCircle2,
  Clock3,
  FlaskConical,
  Lock,
  Search,
  ShieldCheck,
  Wrench,
} from "lucide-react";

const SCENARIOS: Record<
  MissionIntent,
  {
    hint: string;
    request: string;
    permission: string;
    credits: number;
    capabilities: Array<{ id: string; role: string }>;
    tasks: Array<{ title: string; cap: string; status: "ready" | "gated" }>;
    deliverable: string;
    evidenceTag: string;
  }
> = {
  investigate: {
    hint: "Sourced brief · facts vs assumptions",
    request:
      "Investigate whether we should add a sponsor reporting dashboard for healthcare delivery leads — separate sourced facts from assumptions.",
    permission: "Plan → Create (Internal)",
    credits: 18,
    capabilities: [
      { id: "DX-011", role: "Market & Competitor Research" },
      { id: "DX-012", role: "User & Evidence Synthesis" },
      { id: "DX-020", role: "Decision Brief Structuring" },
    ],
    tasks: [
      {
        title: "Scope decision criteria & stakeholder constraints",
        cap: "DX-001",
        status: "ready",
      },
      { title: "Synthesise comparator evidence & buyer signals", cap: "DX-011", status: "ready" },
      {
        title: "Compile decision brief with separated assumptions",
        cap: "DX-020",
        status: "gated",
      },
    ],
    deliverable: "Decision Brief + Evidence Matrix",
    evidenceTag: "Sourced facts · Assumptions separated",
  },
  prototype: {
    hint: "Product brief + interactive HTML pack",
    request:
      "Prototype a workspace usage ceiling & approval notification drawer with clear hard-stop state and audit summary.",
    permission: "Create (Sandbox HTML)",
    credits: 24,
    capabilities: [
      { id: "DX-021", role: "PRD & Flow Specification" },
      { id: "DX-023", role: "UX Flow & Wireframe Architect" },
      { id: "DX-035", role: "Interactive HTML Prototype Builder" },
    ],
    tasks: [
      { title: "Draft interaction states & acceptance criteria", cap: "DX-021", status: "ready" },
      { title: "Compose low-risk sandboxed HTML wireframe", cap: "DX-035", status: "ready" },
      { title: "Run accessibility & self-review verification", cap: "DX-049", status: "gated" },
    ],
    deliverable: "Product Spec + Sandboxed HTML Preview",
    evidenceTag: "Agent-reviewed · Non-production",
  },
  improve: {
    hint: "Friction diagnosis + bounded changes",
    request:
      "Improve mobile checkout drop-off between basket review and payment confirmation without altering Stripe webhook contracts.",
    permission: "Execute internally (Bounded)",
    credits: 21,
    capabilities: [
      { id: "DX-018", role: "Funnel & Friction Diagnostics" },
      { id: "DX-041", role: "Technical Implementation Planner" },
      { id: "DX-071", role: "Analytics & Experiment Design" },
    ],
    tasks: [
      {
        title: "Isolate high-friction step & form validation drop-offs",
        cap: "DX-018",
        status: "ready",
      },
      { title: "Propose bounded remediation diff & guardrails", cap: "DX-041", status: "ready" },
      {
        title: "Define verification telemetry & rollback criteria",
        cap: "DX-071",
        status: "gated",
      },
    ],
    deliverable: "Remediation Plan + Telemetry Spec",
    evidenceTag: "Automatically tested · Ceiling enforced",
  },
};

const LIFECYCLE_STEPS = ["Mission", "Plan", "Approve", "Execute", "Deliver"] as const;

/**
 * Interactive Command Centre concept showcase for marketing.
 * Mirrors Stage 1 intake + plan approval chrome — explicitly labelled as a preview.
 */
export function CommandCentreComposition() {
  const [selectedIntent, setSelectedIntent] = useState<MissionIntent>("investigate");
  const wave1 = WAVE1_AVAILABLE_IDS.length;
  const active = SCENARIOS[selectedIntent];

  return (
    <div className="cc-compose" role="region" aria-label="Interactive Command Centre preview">
      {/* Window Top Chrome */}
      <div className="cc-compose-chrome">
        <div className="cc-compose-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="cc-compose-url">
          <Lock className="size-3 text-emerald-700" aria-hidden="true" />
          <span>deliverx.dev/command</span>
          <span className="cc-compose-chrome-tag">Stage 1 Supervised Console</span>
        </div>
        <div className="cc-compose-usage">
          <span className="cc-compose-usage-dot" />
          <span>12 / 100 credits · {wave1} Available</span>
        </div>
      </div>

      {/* Multi-pane console body */}
      <div className="cc-compose-shell">
        {/* Mini dark rail */}
        <div className="cc-compose-rail" aria-hidden="true">
          <div className="cc-compose-rail-brand">
            Deliver<span>X</span>
          </div>
          <div className="cc-compose-rail-nav">
            <span className="is-active">Command Centre</span>
            <span>Projects</span>
            <span>Capability Registry</span>
            <span>Audit &amp; Usage</span>
          </div>
          <div className="cc-compose-rail-meter">
            <div className="cc-compose-rail-meter-top">
              <span>Ceiling</span>
              <strong>88 left</strong>
            </div>
            <div className="cc-compose-rail-bar">
              <span style={{ width: "18%" }} />
            </div>
            <small>Hard-stop enforced</small>
          </div>
        </div>

        {/* Main interactive canvas */}
        <div className="cc-compose-body">
          {/* Lifecycle Stepper */}
          <div className="cc-compose-stepper" aria-label="Mission lifecycle stage">
            {LIFECYCLE_STEPS.map((step, index) => {
              const state = index < 2 ? "done" : index === 2 ? "current" : "upcoming";
              return (
                <div key={step} className={`cc-compose-step is-${state}`}>
                  <span className="cc-compose-step-num">{index + 1}</span>
                  <span className="cc-compose-step-label">{step}</span>
                </div>
              );
            })}
          </div>

          <div className="cc-compose-header-row">
            <div>
              <div className="cc-compose-kicker">Interactive Preview · Select a mission intent</div>
              <div className="cc-compose-title">Commission &amp; approve bounded AI work</div>
            </div>
            <span className="cc-compose-gate-badge">
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              Human gate active
            </span>
          </div>

          {/* Interactive Intent Selector */}
          <div className="cc-compose-intents" role="tablist" aria-label="Preview mission intents">
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
                  className={`cc-compose-intent${isSelected ? " is-active" : ""}`}
                >
                  <div className="cc-compose-intent-top">
                    <Icon className="size-3.5" aria-hidden="true" />
                    <strong>{INTENT_LABELS[item.id]}</strong>
                  </div>
                  <span>{SCENARIOS[item.id].hint}</span>
                </button>
              );
            })}
          </div>

          {/* Request & Proposed Plan Card */}
          <div className="cc-compose-panel">
            <div className="cc-compose-panel-top">
              <span className="cc-compose-label">Mission brief</span>
              <span className="cc-compose-perm">{active.permission}</span>
            </div>
            <div className="cc-compose-request">{active.request}</div>

            {/* Assigned Wave 1 capabilities */}
            <div className="cc-compose-caps">
              {active.capabilities.map((c) => (
                <span key={c.id} className="cc-compose-cap-chip">
                  <code>{c.id}</code>
                  <span>{c.role}</span>
                </span>
              ))}
            </div>

            {/* Proposed Tasks */}
            <div className="cc-compose-tasklist">
              {active.tasks.map((t, idx) => (
                <div key={t.title} className="cc-compose-task-item">
                  <div className="cc-compose-task-left">
                    {t.status === "ready" ? (
                      <CheckCircle2 className="size-3.5 text-emerald-700 shrink-0" />
                    ) : (
                      <Clock3 className="size-3.5 text-amber-700 shrink-0" />
                    )}
                    <span>
                      {idx + 1}. {t.title}
                    </span>
                  </div>
                  <code>{t.cap}</code>
                </div>
              ))}
            </div>

            {/* Footer Gate Bar */}
            <div className="cc-compose-footer">
              <div className="cc-compose-meta">
                <span>
                  Est. <strong>{active.credits} credits</strong>
                </span>
                <span>·</span>
                <span>{active.deliverable}</span>
              </div>
              <div className="cc-compose-actions">
                <span className="cc-compose-btn primary">Approve plan &amp; queue</span>
                <span className="cc-compose-btn">Revise scope</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
