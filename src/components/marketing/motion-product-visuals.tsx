import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { CtaLink } from "./cta-link";

/* ============================================================================
   1. Motion-Style Duotone Gradient Vector Icons (#849BE5 -> #3D61DD)
   ============================================================================ */

export function ProductDiscoveryIcon({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="2.5" y="3" width="19" height="18" rx="4" fill="#F6F9FF" />
      <path
        d="M6.5 8.5h11M6.5 12h7M6.5 15.5h5"
        stroke="#849BE5"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="16.5" cy="15.5" r="3.5" fill="#CAD4F4" stroke="url(#dx-grad-1)" strokeWidth="1.5" />
      <path d="m19 18 2.2 2.2" stroke="url(#dx-grad-1)" strokeWidth="1.8" strokeLinecap="round" />
      <rect
        x="2.5"
        y="3"
        width="19"
        height="18"
        rx="4"
        stroke="url(#dx-grad-1)"
        strokeWidth="1.5"
      />
      <defs>
        <linearGradient id="dx-grad-1" x1="12" y1="3" x2="12" y2="21" gradientUnits="userSpaceOnUse">
          <stop stopColor="#849BE5" />
          <stop offset="1" stopColor="#3D61DD" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function ProductPrdIcon({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M5 5.5A2.5 2.5 0 0 1 7.5 3h6.8L19 7.7v10.8a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 18.5v-13Z"
        fill="#F6F9FF"
        stroke="url(#dx-grad-2)"
        strokeWidth="1.5"
      />
      <path d="M14 3v5h5" fill="#CAD4F4" />
      <path d="M14 3v5h5" stroke="url(#dx-grad-2)" strokeWidth="1.5" strokeLinejoin="round" />
      <path
        d="M8.5 11.5h7M8.5 14.5h7M8.5 17.5h4.5"
        stroke="url(#dx-grad-2)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="dx-grad-2" x1="12" y1="3" x2="12" y2="21" gradientUnits="userSpaceOnUse">
          <stop stopColor="#849BE5" />
          <stop offset="1" stopColor="#3D61DD" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function ProductPrototypeIcon({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="2.5" y="4" width="19" height="16" rx="3.5" fill="#F6F9FF" stroke="url(#dx-grad-3)" strokeWidth="1.5" />
      <path d="M2.5 8.5h19" stroke="url(#dx-grad-3)" strokeWidth="1.4" />
      <rect x="5.5" y="11" width="5.5" height="6.5" rx="1.5" fill="#CAD4F4" />
      <rect x="13" y="11" width="5.5" height="3" rx="1" fill="#9AADEC" />
      <rect x="13" y="15" width="5.5" height="2.5" rx="1" fill="#DEE5FB" />
      <defs>
        <linearGradient id="dx-grad-3" x1="12" y1="4" x2="12" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="#849BE5" />
          <stop offset="1" stopColor="#3D61DD" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function ProductImproveIcon({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="2.5" y="3.5" width="19" height="17" rx="3.5" fill="#F6F9FF" stroke="url(#dx-grad-4)" strokeWidth="1.5" />
      <path d="M6.5 16.5v-4M10.5 16.5v-6.5M14.5 16.5v-3.5M18 16.5V8" stroke="url(#dx-grad-4)" strokeWidth="2" strokeLinecap="round" />
      <path d="m6.5 10 4-2.5 3.5 2 4-3" stroke="#3D61DD" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <defs>
        <linearGradient id="dx-grad-4" x1="12" y1="3.5" x2="12" y2="20.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#849BE5" />
          <stop offset="1" stopColor="#3D61DD" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function MissionPlannerIcon({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 3 4 7v10l8 4 8-4V7l-8-4Z"
        fill="#F6F9FF"
        stroke="url(#dx-grad-5)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M4 7l8 4 8-4M12 11v10" stroke="url(#dx-grad-5)" strokeWidth="1.5" />
      <defs>
        <linearGradient id="dx-grad-5" x1="12" y1="3" x2="12" y2="21" gradientUnits="userSpaceOnUse">
          <stop stopColor="#849BE5" />
          <stop offset="1" stopColor="#3D61DD" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function ApprovalGateIcon({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 2.8 4.5 6v5.8c0 5.1 3.2 8.7 7.5 9.9 4.3-1.2 7.5-4.8 7.5-9.9V6L12 2.8Z"
        fill="#F6F9FF"
        stroke="url(#dx-grad-6)"
        strokeWidth="1.5"
      />
      <path
        d="m8.8 12.2 2.2 2.2 4.5-4.6"
        stroke="url(#dx-grad-6)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="dx-grad-6" x1="12" y1="2.8" x2="12" y2="21.7" gradientUnits="userSpaceOnUse">
          <stop stopColor="#849BE5" />
          <stop offset="1" stopColor="#3D61DD" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function BudgetShieldIcon({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="3" y="4.5" width="18" height="15" rx="3.5" fill="#F6F9FF" stroke="url(#dx-grad-7)" strokeWidth="1.5" />
      <path d="M3 9.5h18" stroke="url(#dx-grad-7)" strokeWidth="1.5" />
      <rect x="6.5" y="13" width="6" height="3" rx="1" fill="#CAD4F4" />
      <circle cx="16.5" cy="14.5" r="1.8" fill="#3D61DD" />
      <defs>
        <linearGradient id="dx-grad-7" x1="12" y1="4.5" x2="12" y2="19.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#849BE5" />
          <stop offset="1" stopColor="#3D61DD" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ============================================================================
   2. Hero Interactive Module (#ai-tools-module — modeled directly on Motion)
   ============================================================================ */

type HeroToolKey =
  | "discovery"
  | "prd"
  | "prototype"
  | "diagnostics"
  | "planner"
  | "approval"
  | "evidence";

interface HeroToolSpec {
  id: HeroToolKey;
  label: string;
  intentBadge: string;
  headline: string;
  subline: string;
  permission: string;
  credits: string;
  qualityLabel: string;
  stageTitle: string;
  objective: string;
  tasks: Array<{
    stage: string;
    name: string;
    role: string;
    status: "Completed" | "Running" | "Awaiting Approval";
    output: string;
  }>;
  callout: {
    tone: "blue" | "emerald" | "amber";
    title: string;
    detail: string;
  };
}

const HERO_TOOLS: HeroToolSpec[] = [
  {
    id: "discovery",
    label: "AI Product Discovery",
    intentBadge: "Investigate · Decision Research",
    headline: "Turn a strategic product question into a sourced decision brief",
    subline:
      "Problem Framing, Web & Market Research, and Evidence Verification agents separate sourced facts from working assumptions before you commit roadmap capacity.",
    permission: "Plan → Create",
    credits: "14 / 100 credits",
    qualityLabel: "Agent-reviewed · Evidence Classified",
    stageTitle: "Product Discovery Mission · Sponsor Reporting Dashboard",
    objective:
      "Investigate whether we should build a Sponsor Objective Health Dashboard for healthcare & education delivery leads vs. syncing straight to Jira.",
    tasks: [
      {
        stage: "01 · Framing",
        name: "Frame decision scope, buyer constraints & evaluation criteria",
        role: "Problem-Framing Agent",
        status: "Completed",
        output: "Problem Statement & Decision Rubric",
      },
      {
        stage: "02 · Research",
        name: "Synthesise competitor capabilities & pilot buyer interviews",
        role: "Research Synthesis Agent",
        status: "Completed",
        output: "12 Sourced Facts · 4 Explicit Assumptions",
      },
      {
        stage: "03 · Verification",
        name: "Cross-check factual claims against primary source citations",
        role: "Evidence Verification Agent",
        status: "Running",
        output: "Decision Brief & Evidence Matrix",
      },
    ],
    callout: {
      tone: "emerald",
      title: "Sourced Facts ≠ Assumptions",
      detail:
        "Every claim in your Decision Brief is tagged Sourced Fact, Assumption, Inference, or Speculative — zero hallucinated certainty.",
    },
  },
  {
    id: "prd",
    label: "AI PRDs & Specs",
    intentBadge: "Plan & Specify · Product Management",
    headline: "Go from rough product notes to a traceable PRD & user stories",
    subline:
      "Automatically detects missing requirements, asks clarifying questions, and drafts structured PRDs with observable acceptance criteria.",
    permission: "Plan → Create",
    credits: "16 / 100 credits",
    qualityLabel: "Automatically tested · Schema Validated",
    stageTitle: "PRD & Requirements Mission · Workspace Credit Ceiling Alerts",
    objective:
      "Draft a complete PRD, user stories, and edge-case acceptance criteria for real-time workspace budget alerts and hard-stop notifications.",
    tasks: [
      {
        stage: "01 · Discovery",
        name: "Extract user problems, personas & non-goals from product notes",
        role: "Product Discovery Agent",
        status: "Completed",
        output: "Scope Baseline & Clarifications Cleared",
      },
      {
        stage: "02 · Specification",
        name: "Author functional requirements, state transitions & edge cases",
        role: "PRD Agent",
        status: "Completed",
        output: "Structured PRD v1.2 (8 Sections)",
      },
      {
        stage: "03 · Criteria",
        name: "Generate Given/When/Then acceptance criteria & test strategy",
        role: "Test Strategy Agent",
        status: "Completed",
        output: "14 Observable Acceptance Criteria",
      },
    ],
    callout: {
      tone: "blue",
      title: "Every requirement links to an objective",
      detail:
        "Unlinked scope items are flagged automatically so product specs never drift from the approved business case.",
    },
  },
  {
    id: "prototype",
    label: "AI Prototyper",
    intentBadge: "Prototype · Sandboxed UI & Architecture",
    headline: "Build inspectable UI prototypes inside a safe sandbox",
    subline:
      "Wireframing, Software Architect, and Code Review specialists produce an interactive HTML prototype and component spec — never an unapproved production deploy.",
    permission: "Execute internally (Sandboxed)",
    credits: "18 / 100 credits",
    qualityLabel: "Automatically tested · Sandboxed Preview",
    stageTitle: "Sandboxed Prototype Mission · External Attestation Review Drawer",
    objective:
      "Prototype an interactive external attestation review screen showing frozen artefact SHA-256 provenance and three fixed verification statements.",
    tasks: [
      {
        stage: "01 · Architecture",
        name: "Define component boundaries, state model & trust constraints",
        role: "Software Architect Agent",
        status: "Completed",
        output: "Component & API Contract Spec",
      },
      {
        stage: "02 · Wireframe & UI",
        name: "Build interactive sandboxed HTML/CSS prototype for stakeholder review",
        role: "Wireframing Agent",
        status: "Completed",
        output: "Live Sandboxed HTML Prototype",
      },
      {
        stage: "03 · QA & Review",
        name: "Verify accessibility contrast, keyboard flow & requirement coverage",
        role: "Code Review Agent",
        status: "Completed",
        output: "Review Pass · 0 Unapproved External Calls",
      },
    ],
    callout: {
      tone: "emerald",
      title: "Sandboxed preview — production stays untouched",
      detail:
        "Share and inspect the live interactive prototype in Command Centre before committing engineering sprint capacity.",
    },
  },
  {
    id: "diagnostics",
    label: "AI UX & Flow Audit",
    intentBadge: "Improve · Funnel & Workflow Diagnostics",
    headline: "Diagnose product drop-off and UX friction with ranked fixes",
    subline:
      "Isolate root causes across onboarding, checkout, or activation flows and generate a bounded remediation plan with effort and risk scores.",
    permission: "Execute internally",
    credits: "15 / 100 credits",
    qualityLabel: "Agent-reviewed · Impact Ranked",
    stageTitle: "Flow Improvement Mission · Mobile Checkout & Onboarding Funnel",
    objective:
      "Diagnose the 38% drop-off between plan selection and workspace onboarding completion on mobile viewports and propose bounded fixes.",
    tasks: [
      {
        stage: "01 · Diagnosis",
        name: "Map touchpoints and isolate mobile form & redirect friction",
        role: "Problem-Framing Agent",
        status: "Completed",
        output: "3 Root Causes Identified",
      },
      {
        stage: "02 · Remediation",
        name: "Rank UX and state-preservation fixes by impact vs. engineering effort",
        role: "Software Architect Agent",
        status: "Completed",
        output: "Prioritized Remediation Backlog",
      },
      {
        stage: "03 · Verification",
        name: "Define regression checks and post-release conversion guardrails",
        role: "Test Strategy Agent",
        status: "Running",
        output: "Verification & Rollback Plan",
      },
    ],
    callout: {
      tone: "amber",
      title: "Proactive bottleneck detection",
      detail:
        "Flags high-friction steps and missing validation states before they silently erode activation and retention.",
    },
  },
  {
    id: "planner",
    label: "AI Mission Planner",
    intentBadge: "Orchestration · Dependency Task Graph",
    headline: "Decompose any product goal into a coordinated specialist plan",
    subline:
      "Chief of Staff and Mission Planning capabilities match each task to verified roles from our 15-department registry with upfront credit estimates.",
    permission: "Plan (0 Credits Spent)",
    credits: "0 credits to plan",
    qualityLabel: "Schema Validated · Ready for Approval",
    stageTitle: "Mission Plan · Q2 Product Launch & Readiness Pack",
    objective:
      "Coordinate competitive positioning, PRD freeze, interactive prototype review, and release readiness checklist for Q2 product launch.",
    tasks: [
      {
        stage: "Stage 1 · Plan",
        name: "Synthesise market positioning & requirements baseline",
        role: "Chief of Staff Agent",
        status: "Completed",
        output: "Dependency Graph (4 Tasks)",
      },
      {
        stage: "Stage 2 · Gate",
        name: "Hold execution at Human Approval Gate with credit & permission summary",
        role: "Approval Service",
        status: "Awaiting Approval",
        output: "Waiting for Operator Sign-Off",
      },
      {
        stage: "Stage 3 · Deliver",
        name: "Assemble final Delivery Report with quality & evidence labels",
        role: "Test Strategy Agent",
        status: "Awaiting Approval",
        output: "Queued after Plan Approval",
      },
    ],
    callout: {
      tone: "blue",
      title: "Planning is always free and non-destructive",
      detail:
        "Inspect the entire task graph, revise scope, or answer clarifications before a single workspace credit is consumed.",
    },
  },
  {
    id: "approval",
    label: "AI Approval Gates",
    intentBadge: "Governance · 4-Tier Permission Ladder",
    headline: "Supervise every mission with explicit permission boundaries",
    subline:
      "Plan → Create → Execute internally → Act externally. Consequential external actions stay locked behind a separate human approval gate.",
    permission: "Act externally (Locked until signed off)",
    credits: "Hard-stop ceiling active",
    qualityLabel: "Human-in-the-Loop Enforced",
    stageTitle: "Permission Gate · External Stakeholder Notification & Publish",
    objective:
      "Prepare product launch brief and draft external stakeholder announcement (external publish gated for explicit operator authorization).",
    tasks: [
      {
        stage: "Internal · Allowed",
        name: "Draft launch brief, release notes & risk register inside workspace",
        role: "PRD Agent",
        status: "Completed",
        output: "Internal Artefact Created",
      },
      {
        stage: "External · Gated",
        name: "Publish release brief to external stakeholder channel",
        role: "Chief of Staff Agent",
        status: "Awaiting Approval",
        output: "Blocked · Requires External Action Approval",
      },
      {
        stage: "Audit · Logged",
        name: "Record operator approval decision and timestamp in immutable ledger",
        role: "Audit Service",
        status: "Completed",
        output: "Append-Only Audit Event Recorded",
      },
    ],
    callout: {
      tone: "amber",
      title: "External actions never run silently",
      detail:
        "Internal tasks complete safely first while any external action pauses at an explicit secondary approval gate.",
    },
  },
  {
    id: "evidence",
    label: "AI Evidence Reports",
    intentBadge: "Deliver & Prove · Epistemic Honesty",
    headline: "Receive audit-ready delivery reports and verifiable provenance",
    subline:
      "Every completed mission produces inspectable artefacts, separated evidence classes, explicit limitations, and discrete quality labels.",
    permission: "Deliver → Human Review",
    credits: "100% Traceable Spend",
    qualityLabel: "Human-reviewed · Open Badges 3.0 Ready",
    stageTitle: "Delivery Report · Healthcare Workflow & Case-to-Backlog Pack",
    objective:
      "Deliver final executive report with classified evidence, explicit limitations, and human-review sign-off.",
    tasks: [
      {
        stage: "01 · Evidence",
        name: "Classify 18 claims into Sourced Facts, Assumptions & Inferences",
        role: "Evidence Verification Agent",
        status: "Completed",
        output: "100% Provenance Linked",
      },
      {
        stage: "02 · Quality",
        name: "Attach discrete quality badges (Agent-reviewed, Automatically tested)",
        role: "Code Review Agent",
        status: "Completed",
        output: "No Unqualified 'Verified' Claims",
      },
      {
        stage: "03 · Sign-off",
        name: "Operator marks deliverable Human-reviewed in Command Centre",
        role: "Workspace Operator",
        status: "Completed",
        output: "Human-Reviewed Badge Recorded",
      },
    ],
    callout: {
      tone: "emerald",
      title: "A claim is not evidence. A score is not verification.",
      detail:
        "Quality labels match real recorded events — and career Verified status lights only after independent external attestation.",
    },
  },
];

function renderToolIcon(id: HeroToolKey) {
  switch (id) {
    case "discovery":
      return <ProductDiscoveryIcon className="size-5" />;
    case "prd":
      return <ProductPrdIcon className="size-5" />;
    case "prototype":
      return <ProductPrototypeIcon className="size-5" />;
    case "diagnostics":
      return <ProductImproveIcon className="size-5" />;
    case "planner":
      return <MissionPlannerIcon className="size-5" />;
    case "approval":
      return <ApprovalGateIcon className="size-5" />;
    case "evidence":
      return <BudgetShieldIcon className="size-5" />;
  }
}

export function HeroProductInteractiveModule() {
  const [activeId, setActiveId] = useState<HeroToolKey>("discovery");
  const [selectedIds, setSelectedIds] = useState<HeroToolKey[]>([
    "discovery",
    "prd",
    "prototype",
    "approval",
  ]);

  const activeTool = HERO_TOOLS.find((t) => t.id === activeId) ?? HERO_TOOLS[0]!;

  function handleSelectTool(id: HeroToolKey) {
    setActiveId(id);
    setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }

  function handleToggleCheck(id: HeroToolKey, e: React.MouseEvent) {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter((item) => item !== id) : prev) : [...prev, id],
    );
    setActiveId(id);
  }

  return (
    <div id="ai-tools-module" className="motion-hero-module">
      {/* Left Column: "What AI product tools would you like to use?" */}
      <div className="motion-hero-tools-col">
        <h2 className="motion-hero-tools-heading">
          <span>What </span>
          <span className="motion-text-gradient-ai">Product AI tools</span>
          <span> would you like to use?</span>
        </h2>

        <div className="motion-hero-tools-grid" role="tablist" aria-label="Product AI capabilities">
          {HERO_TOOLS.map((tool) => {
            const isChecked = selectedIds.includes(tool.id);
            const isActive = activeId === tool.id;
            return (
              <div
                key={tool.id}
                role="tab"
                tabIndex={0}
                aria-selected={isActive}
                onClick={() => handleSelectTool(tool.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelectTool(tool.id);
                  }
                }}
                className={`motion-tool-tile${isActive ? " is-active" : ""}${isChecked ? " is-checked" : ""}`}
              >
                <div className="motion-tool-icon-wrap">{renderToolIcon(tool.id)}</div>
                <div className="motion-tool-label">{tool.label}</div>
                <button
                  type="button"
                  aria-label={`Select ${tool.label}`}
                  onClick={(e) => handleToggleCheck(tool.id, e)}
                  className={`motion-tool-check${isChecked ? " is-checked" : ""}`}
                >
                  <svg fill="none" viewBox="0 0 18 18" className="size-3">
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.2"
                      d="m3.8 9.8 3 3 7.5-7.6"
                    />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>

        <div className="motion-hero-tools-cta">
          <CtaLink
            signedInTo="/command"
            signedInLabel="Open Command Centre →"
            signedOutLabel="Try DeliverX for free →"
            className="motion-btn-primary w-full justify-center"
          />
          <p className="motion-cta-sub">
            {selectedIds.length} product capabilities selected · Plan for free, approve before execution.
          </p>
        </div>
      </div>

      {/* Right Column: Live Interactive Product Command Stage */}
      <div className="motion-hero-stage-col">
        <div className="motion-stage-pastel-canvas">
          <div className="motion-stage-window">
            {/* Window Topbar */}
            <div className="motion-stage-topbar">
              <div className="motion-stage-dots" aria-hidden="true">
                <span className="bg-[#FF5F57]" />
                <span className="bg-[#FEBC2E]" />
                <span className="bg-[#28C840]" />
              </div>
              <div className="motion-stage-tab-pill">{activeTool.stageTitle}</div>
              <div className="motion-stage-badges">
                <span className="motion-pill-blue">{activeTool.permission}</span>
                <span className="motion-pill-slate">{activeTool.credits}</span>
              </div>
            </div>

            {/* Window Body */}
            <div className="motion-stage-body">
              <div className="motion-stage-header-row">
                <div>
                  <span className="motion-stage-eyebrow">{activeTool.intentBadge}</span>
                  <h3 className="motion-stage-h3">{activeTool.headline}</h3>
                </div>
                <span className="motion-pill-emerald">{activeTool.qualityLabel}</span>
              </div>

              <p className="motion-stage-desc">{activeTool.subline}</p>

              {/* Mission Objective Box */}
              <div className="motion-stage-objective">
                <span className="motion-stage-objective-label">Mission Brief</span>
                <p>{activeTool.objective}</p>
              </div>

              {/* Structured Task & Specialist Table (Modeled on Motion's clean stage rows) */}
              <div className="motion-stage-table">
                <div className="motion-stage-table-head">
                  <span>STAGE &amp; TASK</span>
                  <span>SPECIALIST ROLE</span>
                  <span>STATUS</span>
                  <span>DELIVERABLE / PROOF</span>
                </div>
                {activeTool.tasks.map((task) => (
                  <div className="motion-stage-table-row" key={task.name}>
                    <div className="motion-stage-task-cell">
                      <span className="motion-stage-tag">{task.stage}</span>
                      <strong>{task.name}</strong>
                    </div>
                    <div className="motion-stage-role-cell">{task.role}</div>
                    <div>
                      <span
                        className={`motion-status-badge ${
                          task.status === "Completed"
                            ? "is-completed"
                            : task.status === "Running"
                              ? "is-running"
                              : "is-gate"
                        }`}
                      >
                        {task.status}
                      </span>
                    </div>
                    <div className="motion-stage-output-cell">{task.output}</div>
                  </div>
                ))}
              </div>

              {/* Bottom Callout + Action */}
              <div className={`motion-stage-callout is-${activeTool.callout.tone}`}>
                <div>
                  <strong>{activeTool.callout.title}</strong>
                  <p>{activeTool.callout.detail}</p>
                </div>
                <Link to="/command" className="motion-stage-inline-link">
                  Run in Command Centre →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   3. Clean Product UI Mockup Cards for the 5 Alternating Accordion Sections
      (Inspired directly by Motion's pastel-framed floating UI cards)
   ============================================================================ */

export function ProductAccordionVisual({ visualId }: { visualId: string }) {
  switch (visualId) {
    /* SECTION 1: AI Product Discovery & Research (Investigate) */
    case "discovery-notes-to-brief":
      return (
        <div className="motion-visual-canvas">
          <div className="motion-split-transform-card">
            <div className="motion-messy-stack" aria-label="Raw product inputs">
              <div className="motion-note-card rotate-[-2deg]">
                <span className="motion-note-tag">Slack · #product-strategy</span>
                <h5>Sponsor Dashboard vs. Jira Sync?</h5>
                <ul>
                  <li>• COOs want weekly objective health, not ticket counts</li>
                  <li>• Will engineers refuse a second task tracker?</li>
                  <li>• Need pricing hypothesis (£750/mo per active project?)</li>
                </ul>
              </div>
              <div className="motion-note-card rotate-[1.5deg]">
                <span className="motion-note-tag">Discovery Call · Fluent Institute</span>
                <h5>Pilot Unfreeze Criteria</h5>
                <ul>
                  <li>• Upload PDF business case → freeze baseline checksum</li>
                  <li>• Map capability needs per workstream</li>
                  <li>• Flag any work item missing an objective link</li>
                </ul>
              </div>
            </div>

            <div className="motion-transform-arrow" aria-hidden="true">
              →
            </div>

            <div className="motion-clean-ui-card">
              <div className="motion-ui-card-head">
                <div>
                  <span className="motion-pill-blue">Investigate Deliverable</span>
                  <h4>Structured Decision Brief</h4>
                </div>
                <span className="motion-pill-emerald">Agent-reviewed</span>
              </div>
              <div className="motion-ui-list">
                <div className="motion-ui-row">
                  <span className="motion-dot-emerald" />
                  <div>
                    <strong>Sourced Fact · Buyer Role</strong>
                    <p>Sponsors buy project outcomes &amp; objective health, not seats.</p>
                  </div>
                  <span className="motion-badge-fact">Sourced Fact</span>
                </div>
                <div className="motion-ui-row">
                  <span className="motion-dot-emerald" />
                  <div>
                    <strong>Sourced Fact · Engineering Adoption</strong>
                    <p>Keep tasks minimal in v1; sync to Jira/Linear in v2.</p>
                  </div>
                  <span className="motion-badge-fact">Sourced Fact</span>
                </div>
                <div className="motion-ui-row">
                  <span className="motion-dot-amber" />
                  <div>
                    <strong>Working Assumption · Pricing</strong>
                    <p>£750/month per active project with free contributors.</p>
                  </div>
                  <span className="motion-badge-assumption">Assumption</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );

    case "discovery-evidence-separation":
      return (
        <div className="motion-visual-canvas">
          <div className="motion-clean-ui-card max-w-xl mx-auto">
            <div className="motion-alert-banner-red">
              <span className="motion-alert-icon">!</span>
              <strong>2 unverified claims</strong> separated from Sourced Facts before plan sign-off
            </div>
            <div className="motion-ui-list mt-4">
              <div className="motion-ui-row">
                <span className="motion-check-circle is-done">✓</span>
                <div className="flex-1">
                  <strong>Claim 01 · UK/EU Data Residency Requirement</strong>
                  <p>Cited directly from NHS &amp; Higher-Ed procurement checklist §4.2</p>
                </div>
                <span className="motion-badge-fact">Sourced Fact</span>
              </div>
              <div className="motion-ui-row">
                <span className="motion-check-circle is-done">✓</span>
                <div className="flex-1">
                  <strong>Claim 02 · 48-Hour Meeting Approval SLA</strong>
                  <p>Derived from pilot kill-signal metric target (≥75% cleared)</p>
                </div>
                <span className="motion-badge-inference">Inference</span>
              </div>
              <div className="motion-ui-row">
                <span className="motion-check-circle is-warn">!</span>
                <div className="flex-1">
                  <strong>Claim 03 · 60% First-Pass AI Draft Acceptance</strong>
                  <p>Flagged as an explicit working hypothesis until Week 4 pilot data</p>
                </div>
                <span className="motion-badge-assumption">Assumption</span>
              </div>
            </div>
          </div>
        </div>
      );

    case "discovery-clarification-gate":
      return (
        <div className="motion-visual-canvas">
          <div className="motion-clean-ui-card max-w-xl mx-auto">
            <div className="motion-ui-card-head">
              <div>
                <span className="motion-pill-amber">Status · Needs Clarification</span>
                <h4>Problem-Framing Agent · 2 Questions Before Planning</h4>
              </div>
              <span className="motion-pill-slate">0 Credits Spent</span>
            </div>
            <p className="text-xs text-[#475467] mb-3">
              DeliverX pauses on underspecified briefs instead of hallucinating scope:
            </p>
            <div className="space-y-3">
              <div className="rounded-xl border border-[#DCE4FE] bg-[#F8FAFF] p-3.5">
                <p className="text-xs font-semibold text-[#101828]">
                  Q1. Who is the primary decision-maker for this brief (e.g., COO sponsor, Product Lead, or Engineering Manager)?
                </p>
                <div className="mt-2 rounded-lg bg-white px-3 py-2 text-xs text-[#2C77E7] font-medium border border-[#CAD4F4]">
                  ✓ Answered: COO / Head of Delivery running 5–30 change projects/year
                </div>
              </div>
              <div className="rounded-xl border border-[#DCE4FE] bg-[#F8FAFF] p-3.5">
                <p className="text-xs font-semibold text-[#101828]">
                  Q2. What constraints or non-goals must the recommendation respect?
                </p>
                <div className="mt-2 rounded-lg bg-white px-3 py-2 text-xs text-[#2C77E7] font-medium border border-[#CAD4F4]">
                  ✓ Answered: Do not build Gantt charts or timesheets; keep tasks minimal
                </div>
              </div>
            </div>
          </div>
        </div>
      );

    /* SECTION 2: AI PRD, Specs & Sandboxed Prototyping (Prototype) */
    case "prototype-prd-and-ui":
      return (
        <div className="motion-visual-canvas">
          <div className="motion-clean-ui-card">
            <div className="motion-ui-card-head">
              <div>
                <span className="motion-pill-blue">Prototype Deliverable Pack</span>
                <h4>PRD Specification + Live Sandboxed UI</h4>
              </div>
              <span className="motion-pill-emerald">Automatically tested</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-3.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#3D61DD]">
                  Artefact 01 · Structured PRD
                </span>
                <h5 className="text-sm font-bold text-[#101828] mt-1">
                  Baseline Freeze &amp; Change Request Flow
                </h5>
                <ul className="mt-2 space-y-1.5 text-xs text-[#475467]">
                  <li>• SHA-256 baseline checksum on sponsor sign-off</li>
                  <li>• Every work item links to a named case objective</li>
                  <li>• Scope/cost deltas require an explicit Change Request</li>
                </ul>
              </div>
              <div className="rounded-xl border border-[#CAD4F4] bg-white p-3.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#1CAC5E]">
                    Artefact 02 · HTML Sandbox
                  </span>
                  <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                    Isolated Preview
                  </span>
                </div>
                <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
                    <span>Objective #2 · Patient Onboarding</span>
                    <span className="text-emerald-600">On Track</span>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div className="h-full w-4/5 bg-[#2C77E7] rounded-full" />
                  </div>
                  <div className="mt-2 flex gap-2">
                    <span className="text-[11px] bg-blue-600 text-white px-2.5 py-1 rounded font-medium">
                      Approve Change (+£4k)
                    </span>
                    <span className="text-[11px] bg-white border border-slate-300 text-slate-700 px-2.5 py-1 rounded">
                      Inspect Diff
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );

    case "prototype-acceptance-criteria":
      return (
        <div className="motion-visual-canvas">
          <div className="motion-clean-ui-card max-w-xl mx-auto">
            <div className="motion-ui-card-head">
              <div>
                <span className="motion-pill-blue">Requirements Engineering</span>
                <h4>Observable Acceptance Criteria &amp; Test Suite</h4>
              </div>
              <span className="motion-pill-emerald">3 / 3 Checks Passed</span>
            </div>
            <div className="motion-ui-list mt-3">
              <div className="motion-ui-row">
                <span className="motion-check-circle is-done">✓</span>
                <div className="flex-1">
                  <strong>AC-01 · Unlinked Work Item Flagging</strong>
                  <p>Given a task with no parent objective, flag it in the Sponsor risk log.</p>
                </div>
                <span className="motion-badge-fact">Tested</span>
              </div>
              <div className="motion-ui-row">
                <span className="motion-check-circle is-done">✓</span>
                <div className="flex-1">
                  <strong>AC-02 · Deterministic Credit Hard-Stop</strong>
                  <p>When workspace consumption hits 100/100 credits, halt billable tasks immediately.</p>
                </div>
                <span className="motion-badge-fact">Tested</span>
              </div>
              <div className="motion-ui-row">
                <span className="motion-check-circle is-done">✓</span>
                <div className="flex-1">
                  <strong>AC-03 · External Action Hold</strong>
                  <p>Lock any external email/deploy task until secondary approval is recorded.</p>
                </div>
                <span className="motion-badge-fact">Tested</span>
              </div>
            </div>
          </div>
        </div>
      );

    case "prototype-dependency-timeline":
      return (
        <div className="motion-visual-canvas">
          {/* Modeled directly on Motion's gantt-overdue.png */}
          <div className="motion-clean-ui-card">
            <div className="motion-ui-card-head">
              <h4>Product Mission Dependency Graph</h4>
              <span className="motion-pill-blue">Coordinated Specialist Handoffs</span>
            </div>
            <div className="mt-3 space-y-2.5">
              <div className="grid grid-cols-[150px_1fr] items-center gap-3">
                <span className="text-xs font-semibold text-slate-700">1. Problem Framing</span>
                <div className="h-7 rounded-lg bg-emerald-100 text-emerald-900 text-xs font-semibold flex items-center px-3 w-[45%]">
                  Completed · 4 credits
                </div>
              </div>
              <div className="grid grid-cols-[150px_1fr] items-center gap-3">
                <span className="text-xs font-semibold text-slate-700">2. PRD &amp; User Stories</span>
                <div className="h-7 rounded-lg bg-blue-100 text-blue-900 text-xs font-semibold flex items-center px-3 ml-[20%] w-[52%]">
                  Completed · 6 credits
                </div>
              </div>
              <div className="grid grid-cols-[150px_1fr] items-center gap-3 relative">
                <span className="text-xs font-semibold text-slate-700">3. HTML UI Sandbox</span>
                <div className="h-7 rounded-lg bg-indigo-100 border border-indigo-400 text-indigo-950 text-xs font-semibold flex items-center px-3 ml-[40%] w-[48%]">
                  Running in Sandbox · 5 credits
                </div>
              </div>
              <div className="grid grid-cols-[150px_1fr] items-center gap-3">
                <span className="text-xs font-semibold text-slate-700">4. Code &amp; QA Review</span>
                <div className="h-7 rounded-lg bg-amber-100 text-amber-900 text-xs font-semibold flex items-center px-3 ml-[58%] w-[40%]">
                  Queued after Step 3 · 3 credits
                </div>
              </div>
            </div>
          </div>
        </div>
      );

    /* SECTION 3: AI Product Diagnostics & Flow Optimization (Improve) */
    case "improve-funnel-diagnosis":
      return (
        <div className="motion-visual-canvas">
          <div className="motion-clean-ui-card max-w-xl mx-auto">
            <div className="motion-alert-banner-red">
              <span className="motion-alert-icon">!</span>
              <strong>38% drop-off detected</strong> between mobile plan selection and onboarding step 2
            </div>
            <div className="mt-4 space-y-2.5">
              <div className="rounded-xl border border-slate-200 p-3 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase text-rose-600">Root Cause #1 · P0 Impact</span>
                  <h5 className="text-sm font-semibold text-slate-900">
                    Unauthenticated CTA drops ?redirect=/command destination parameter
                  </h5>
                </div>
                <span className="motion-pill-emerald">Fix Ready</span>
              </div>
              <div className="rounded-xl border border-slate-200 p-3 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase text-amber-600">Root Cause #2 · P1 Impact</span>
                  <h5 className="text-sm font-semibold text-slate-900">
                    Mobile form requires 6 fields before showing sample mission preview
                  </h5>
                </div>
                <span className="motion-pill-blue">Scoped</span>
              </div>
            </div>
          </div>
        </div>
      );

    case "improve-remediation-backlog":
      return (
        <div className="motion-visual-canvas">
          <div className="motion-clean-ui-card">
            <div className="motion-ui-card-head">
              <div>
                <span className="motion-pill-blue">Improve Deliverable</span>
                <h4>Prioritized Remediation &amp; Verification Plan</h4>
              </div>
              <span className="motion-pill-emerald">Bounded Scope</span>
            </div>
            <div className="motion-ui-list mt-3">
              <div className="motion-ui-row">
                <span className="motion-dot-emerald" />
                <div className="flex-1">
                  <strong>Step 1 · Preserve redirect destination across login &amp; signup</strong>
                  <p>Impact: High · Effort: S · Verification: Automated route redirect test</p>
                </div>
                <span className="motion-badge-fact">Approved</span>
              </div>
              <div className="motion-ui-row">
                <span className="motion-dot-emerald" />
                <div className="flex-1">
                  <strong>Step 2 · Add 1-click Quick-Fill Product Brief chips in Command Centre</strong>
                  <p>Impact: High · Effort: S · Verification: Operator onboarding smoke test</p>
                </div>
                <span className="motion-badge-fact">Approved</span>
              </div>
            </div>
          </div>
        </div>
      );

    case "improve-context-synthesis":
      return (
        <div className="motion-visual-canvas">
          <div className="motion-clean-ui-card max-w-xl mx-auto">
            <div className="motion-ui-card-head">
              <h4>Your Product Context + AI Specialist Audit</h4>
              <span className="motion-pill-blue">Zero Context Loss</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div className="rounded-xl bg-[#F8FAFF] border border-[#DCE4FE] p-3">
                <span className="text-[11px] font-bold uppercase text-[#3D61DD]">Your Constraints</span>
                <p className="text-xs text-slate-700 mt-1.5 leading-relaxed">
                  “Keep existing Stripe webhook schema intact and do not alter legacy career tables.”
                </p>
              </div>
              <div className="rounded-xl bg-emerald-50/70 border border-emerald-200 p-3">
                <span className="text-[11px] font-bold uppercase text-emerald-800">AI Architect Output</span>
                <p className="text-xs text-slate-700 mt-1.5 leading-relaxed">
                  All remediation steps scoped strictly to client route guards and additive `wf_*` tables.
                </p>
              </div>
            </div>
          </div>
        </div>
      );

    /* SECTION 4: Supervised Mission Lifecycle & Permission Gates */
    case "lifecycle-five-stages":
      return (
        <div className="motion-visual-canvas">
          <div className="motion-clean-ui-card">
            <div className="motion-ui-card-head">
              <h4>Deterministic 5-Stage Mission State Machine</h4>
              <span className="motion-pill-emerald">Enforced in Code</span>
            </div>
            <div className="grid grid-cols-5 gap-2 mt-4">
              {[
                { step: "01", name: "Mission", sub: "Intent & Brief", state: "done" },
                { step: "02", name: "Plan", sub: "Tasks & Cost", state: "done" },
                { step: "03", name: "Approve", sub: "Human Gate", state: "gate" },
                { step: "04", name: "Execute", sub: "Bounded Run", state: "active" },
                { step: "05", name: "Deliver", sub: "Evidence Report", state: "pending" },
              ].map((s) => (
                <div
                  key={s.step}
                  className={`rounded-xl p-3 border text-center ${
                    s.state === "gate"
                      ? "bg-[#EEF5FF] border-[#2C77E7] ring-2 ring-[#2C77E7]/20"
                      : s.state === "done"
                        ? "bg-emerald-50/70 border-emerald-200"
                        : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <span className="text-[10px] font-mono font-bold text-slate-500">STEP {s.step}</span>
                  <strong className="block text-sm text-slate-900 mt-0.5">{s.name}</strong>
                  <small className="block text-[11px] text-slate-600 mt-0.5">{s.sub}</small>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case "lifecycle-permission-ladder":
      return (
        <div className="motion-visual-canvas">
          <div className="motion-clean-ui-card max-w-xl mx-auto">
            <div className="motion-ui-card-head">
              <h4>Four-Tier Permission Ladder</h4>
              <span className="motion-pill-amber">External Gate Locked</span>
            </div>
            <div className="mt-3 space-y-2">
              {[
                { tier: "Tier 1 · Plan", desc: "Propose task graph & estimate credits", status: "Allowed" },
                { tier: "Tier 2 · Create", desc: "Draft internal PRDs, briefs & HTML prototypes", status: "Allowed" },
                { tier: "Tier 3 · Execute internally", desc: "Run sandboxed checks & evidence verification", status: "Approved" },
                { tier: "Tier 4 · Act externally", desc: "Send emails, deploy code, or mutate external APIs", status: "Requires 2nd Sign-off" },
              ].map((t, idx) => (
                <div
                  key={t.tier}
                  className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 border ${
                    idx === 3 ? "bg-amber-50/80 border-amber-300" : "bg-white border-slate-200"
                  }`}
                >
                  <div>
                    <strong className="text-xs font-bold text-slate-900 block">{t.tier}</strong>
                    <span className="text-xs text-slate-600">{t.desc}</span>
                  </div>
                  <span className={idx === 3 ? "motion-badge-assumption" : "motion-badge-fact"}>
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case "lifecycle-audit-trail":
      return (
        <div className="motion-visual-canvas">
          <div className="motion-clean-ui-card max-w-xl mx-auto">
            <div className="motion-ui-card-head">
              <h4>Append-Only Supervision &amp; Audit Ledger</h4>
              <span className="motion-pill-blue">Service-Role Enforced</span>
            </div>
            <div className="mt-3 space-y-2 font-mono text-xs">
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-2.5 flex justify-between">
                <span className="text-emerald-700 font-semibold">mission.plan_approved</span>
                <span className="text-slate-500">Operator · Ceiling: 18 credits</span>
              </div>
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-2.5 flex justify-between">
                <span className="text-blue-700 font-semibold">task.completed (DX-023 PRD Agent)</span>
                <span className="text-slate-500">-6 credits · 84 remaining</span>
              </div>
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-2.5 flex justify-between">
                <span className="text-purple-700 font-semibold">artefact.human_reviewed</span>
                <span className="text-slate-500">Signed off by Operator</span>
              </div>
            </div>
          </div>
        </div>
      );

    /* SECTION 5: Workforce Governance, Budgets & Capability Registry */
    case "governance-budget-charts":
    default:
      return (
        <div className="motion-visual-canvas">
          {/* Modeled directly on Motion's dashboard-charts.png */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div className="motion-clean-ui-card text-center">
              <h4 className="text-sm font-bold text-slate-900">Workspace Credit Ceiling</h4>
              <div className="my-4 mx-auto size-36 rounded-full border-[14px] border-[#2C77E7] border-r-[#4ECDC4] border-b-[#CAD4F4] flex flex-col items-center justify-center">
                <strong className="text-2xl font-extrabold text-slate-900">100</strong>
                <span className="text-[11px] text-slate-500">Credit Hard-Stop</span>
              </div>
              <p className="text-xs text-slate-600">
                Deterministic budget service halts execution before any overspend occurs.
              </p>
            </div>
            <div className="motion-clean-ui-card">
              <h4 className="text-sm font-bold text-slate-900 mb-3">150-Role Capability Registry</h4>
              <div className="space-y-2.5 text-xs">
                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <span>Wave 1 · Active &amp; Evaluated</span>
                    <span className="text-emerald-700">12 Roles Available</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-emerald-100 overflow-hidden">
                    <div className="h-full w-full bg-emerald-500 rounded-full" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <span>Waves 2–5 · 15 Departments</span>
                    <span className="text-slate-600">138 Roles Planned</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full w-3/5 bg-[#849BE5] rounded-full" />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 pt-1">
                  Planned capabilities are never offered as live execution until evaluated.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
  }
}

/* ============================================================================
   4. Desktop + Mobile Command Centre Showcase (Modeled on desktop-mobile.png)
   ============================================================================ */

export function DesktopMobileCommandShowcase() {
  return (
    <div className="motion-device-showcase">
      <div className="motion-desktop-frame">
        {/* Top Floating Notification Banner (like Motion's 'Design Sync · Join on Zoom' card) */}
        <div className="motion-floating-gate-banner">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#2C77E7]">
              Human Approval Gate · Ready for Review
            </span>
            <p className="text-sm font-bold text-[#101828]">
              Q4 Product Launch &amp; Onboarding Redesign Plan (4 Tasks · 18 Credits)
            </p>
          </div>
          <Link to="/command" className="motion-btn-primary text-xs px-3.5 py-2">
            Review &amp; Approve Plan
          </Link>
        </div>

        {/* Desktop App Window */}
        <div className="motion-app-window">
          <div className="motion-app-sidebar">
            <div className="font-bold text-sm text-slate-900 mb-4 flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-[#2C77E7]" />
              DeliverX Command
            </div>
            <div className="space-y-1 text-xs text-slate-600">
              <div className="bg-[#EEF5FF] text-[#2C77E7] font-semibold px-2.5 py-1.5 rounded-lg">
                Command Centre
              </div>
              <div className="px-2.5 py-1.5">Active Missions (3)</div>
              <div className="px-2.5 py-1.5">Product Specs &amp; PRDs</div>
              <div className="px-2.5 py-1.5">Sandboxed Prototypes</div>
              <div className="px-2.5 py-1.5">Capability Registry (150)</div>
              <div className="px-2.5 py-1.5">Evidence &amp; Prove</div>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-200 text-[11px] text-slate-500">
              <strong className="text-slate-800 block">Workspace Budget</strong>
              <span>82 / 100 credits remaining</span>
              <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                <div className="h-full w-[82%] bg-[#2C77E7]" />
              </div>
            </div>
          </div>

          <div className="motion-app-main">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
              <div>
                <span className="text-[11px] text-slate-500">
                  Product Portfolio / Q4 Onboarding &amp; Checkout
                </span>
                <h4 className="text-base font-bold text-slate-900">
                  Mission: Diagnose &amp; Prototype Mobile Onboarding Flow
                </h4>
              </div>
              <div className="flex gap-1.5">
                <span className="motion-pill-blue">Group by: Lifecycle Stage</span>
                <span className="motion-pill-emerald">Ceiling: 100 Credits</span>
              </div>
            </div>

            <div className="mt-3 space-y-3 text-xs">
              <div>
                <div className="font-bold text-amber-800 bg-amber-50 inline-block px-2.5 py-0.5 rounded mb-1.5">
                  01 · Discovery &amp; Framing (2 Tasks)
                </div>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg bg-white">
                  <div className="p-2.5 flex items-center justify-between gap-2">
                    <span className="font-medium text-slate-900">
                      ✓ Frame mobile drop-off root causes &amp; buyer constraints
                    </span>
                    <span className="text-slate-500">Problem-Framing Agent</span>
                    <span className="motion-badge-fact">Completed · 4 cr</span>
                  </div>
                  <div className="p-2.5 flex items-center justify-between gap-2">
                    <span className="font-medium text-slate-900">
                      ✓ Verify funnel telemetry vs. session replay evidence
                    </span>
                    <span className="text-slate-500">Evidence Verification Agent</span>
                    <span className="motion-badge-fact">Completed · 5 cr</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="font-bold text-blue-800 bg-blue-50 inline-block px-2.5 py-0.5 rounded mb-1.5">
                  02 · Specification &amp; Sandboxed Prototype (2 Tasks)
                </div>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg bg-white">
                  <div className="p-2.5 flex items-center justify-between gap-2">
                    <span className="font-medium text-slate-900">
                      ✓ Author PRD &amp; Given/When/Then acceptance criteria
                    </span>
                    <span className="text-slate-500">PRD Agent</span>
                    <span className="motion-badge-fact">Agent-reviewed</span>
                  </div>
                  <div className="p-2.5 flex items-center justify-between gap-2">
                    <span className="font-medium text-slate-900">
                      ● Generate interactive HTML prototype in isolated sandbox
                    </span>
                    <span className="text-slate-500">Wireframing Agent</span>
                    <span className="motion-badge-inference">Automatically tested</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Companion Card */}
      <div className="motion-mobile-frame">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[#2C77E7] font-bold">
          Mobile Supervision View
        </div>
        <h4 className="text-base font-bold text-slate-900 mt-1">Q4 Onboarding Delivery Report</h4>
        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
          Objective: Reduce mobile onboarding drop-off while preserving workspace RLS and budget gates.
        </p>
        <div className="mt-3 pt-3 border-t border-slate-200">
          <div className="text-xs font-bold text-slate-900 mb-2">📌 Key Deliverables</div>
          <ul className="space-y-1.5 text-xs text-slate-700">
            <li className="bg-slate-100 px-2.5 py-1 rounded">✓ Sourced Decision Brief</li>
            <li className="bg-slate-100 px-2.5 py-1 rounded">✓ Structured PRD &amp; Stories</li>
            <li className="bg-slate-100 px-2.5 py-1 rounded">✓ Sandboxed HTML Prototype</li>
            <li className="bg-emerald-50 text-emerald-800 font-semibold px-2.5 py-1 rounded">
              ✓ Marked Human-Reviewed
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
