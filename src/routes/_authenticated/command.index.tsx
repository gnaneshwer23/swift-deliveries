import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { CommandShell } from "@/components/command/command-shell";
import { SupervisedMissionStart } from "@/components/command/supervised-mission-start";
import { useSession } from "@/hooks/use-session";
import { firstActionFor } from "@/lib/product-journey";
import { firstNameOf } from "@/lib/dx-profile";
import { myProfileQuery } from "@/lib/profile-queries";
import { commandCentreBootstrapQuery } from "@/lib/workforce-queries";
import { createMission, createWfProject } from "@/lib/workforce.functions";
import {
  INTENT_LABELS,
  PERMISSION_LABELS,
  STATUS_LABELS,
  type MissionIntent,
} from "@/lib/workforce/types";
import { WAVE1_AVAILABLE_IDS } from "@/lib/workforce/registry";
import {
  ProductDiscoveryIcon,
  ProductPrototypeIcon,
  ProductImproveIcon,
} from "@/components/marketing/motion-product-visuals";
import { Compass, FlaskConical, Rocket, Search, ShieldCheck, Sparkles, Wrench } from "lucide-react";

export const Route = createFileRoute("/_authenticated/command/")({
  head: () => ({
    meta: [
      { title: "Product workspace — DeliverX" },
      {
        name: "description",
        content:
          "Turn a product question into evidence, a decision you control, and work you can review.",
      },
    ],
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(commandCentreBootstrapQuery);
  },
  component: CommandHome,
});

const INTENTS: Array<{
  intent: MissionIntent;
  icon: typeof Search;
  duotoneIcon: typeof ProductDiscoveryIcon;
  tag: string;
  blurb: string;
  deliverable: string;
  placeholder: string;
  samples: Array<{ label: string; text: string }>;
}> = [
  {
    intent: "investigate",
    icon: Search,
    duotoneIcon: ProductDiscoveryIcon,
    tag: "Product Discovery & Research",
    blurb:
      "Research a strategic or product decision and return a brief with sourced facts separated from assumptions.",
    deliverable: "Decision Brief + Evidence Matrix",
    placeholder:
      "Investigate whether we should add a sponsor dashboard for healthcare delivery leads, for the COO audience…",
    samples: [
      {
        label: "Build vs. Partner Decision Brief",
        text: "Investigate whether we should add a sponsor reporting dashboard for delivery leads, for the COO audience, comparing build vs partner options.",
      },
      {
        label: "Enterprise Pricing & Buyer Objections",
        text: "Investigate enterprise buyer objections to usage-based credit ceilings for product operations teams.",
      },
      {
        label: "UK/EU Data Residency Requirements",
        text: "Investigate UK and EU public-sector procurement and data residency requirements for AI-assisted project delivery workspaces.",
      },
    ],
  },
  {
    intent: "prototype",
    icon: FlaskConical,
    duotoneIcon: ProductPrototypeIcon,
    tag: "PRD & Sandboxed UI Prototype",
    blurb:
      "Produce a reviewable product specification plus a lightweight sandboxed HTML prototype.",
    deliverable: "PRD + Interactive HTML Pack",
    placeholder:
      "Prototype a notification settings drawer with a clear save confirmation for workspace admins…",
    samples: [
      {
        label: "Credit Ceiling Alert Drawer PRD + UI",
        text: "Prototype a workspace credit ceiling alert drawer with hard-stop state and approval history for workspace operators.",
      },
      {
        label: "Product Evidence Review Flow",
        text: "Prototype a product evidence review screen showing source citations, assumptions and approval history for product leads.",
      },
      {
        label: "Baseline Freeze & Change Request Modal",
        text: "Prototype a sponsor baseline freeze and scope change request approval modal with SHA-256 checksum display.",
      },
    ],
  },
  {
    intent: "improve",
    icon: Wrench,
    duotoneIcon: ProductImproveIcon,
    tag: "Flow & Funnel Diagnostics",
    blurb:
      "Diagnose friction in an existing product workflow and propose bounded changes — never an unapproved deploy.",
    deliverable: "Friction Diagnosis + Remediation Plan",
    placeholder:
      "Improve mobile checkout abandonment between basket review and payment confirmation…",
    samples: [
      {
        label: "Mobile Checkout Drop-Off Audit",
        text: "Improve mobile checkout drop-off between basket review and payment confirmation without changing Stripe webhook schemas.",
      },
      {
        label: "Onboarding Intake Clarification Flow",
        text: "Improve mission clarification turnaround when operators submit single-sentence briefs in Command Centre.",
      },
      {
        label: "Weekly Delivery Loop Approval SLA",
        text: "Improve sponsor approval turnaround on weekly delivery action queues so 75%+ clear within 48 hours.",
      },
    ],
  },
  {
    intent: "build",
    icon: Rocket,
    duotoneIcon: ProductPrototypeIcon,
    tag: "End-to-End Product Mission",
    blurb:
      "Take one objective through all eight lifecycle stages — parallel discovery, PRD, design, sandboxed build, verification and release — with human gates at scope, design and release.",
    deliverable: "Charter → PRD → Design → Prototype → Verified Release Pack",
    placeholder:
      "Build a subscription meal-planning app for busy parents that turns pantry photos into weekly plans and shopping lists…",
    samples: [
      {
        label: "Freelancer Invoicing Assistant",
        text: "Build an invoicing and late-payment assistant for UK freelancers that drafts invoices, tracks payment status and nudges clients politely.",
      },
      {
        label: "SME Cash-Flow Forecaster",
        text: "Build a cash-flow forecasting tool for UK small businesses that flags shortfalls six weeks ahead for founders and their accountants.",
      },
      {
        label: "Research-to-Roadmap Radar",
        text: "Build a technology radar for product teams that turns new research papers into adopt, experiment, monitor or reject recommendations.",
      },
    ],
  },
];

function CommandHome() {
  const { data, isError, error, isLoading } = useQuery(commandCentreBootstrapQuery);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [intent, setIntent] = useState<MissionIntent>("investigate");
  const [requestText, setRequestText] = useState("");
  const [projectId, setProjectId] = useState<string>("");
  const [newProjectName, setNewProjectName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [missionFilter, setMissionFilter] = useState<
    "all" | "awaiting" | "completed" | "investigate" | "prototype" | "improve" | "build"
  >("all");

  const { data: profile } = useQuery(myProfileQuery);
  // Public sample cards may pass an intent and a sample prompt. A private brief is never written here.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const qIntent = params.get("intent");
    const qPrompt = params.get("prompt");
    if (
      qIntent === "investigate" ||
      qIntent === "prototype" ||
      qIntent === "improve" ||
      qIntent === "build"
    ) {
      setIntent(qIntent);
    }
    if (profile?.firstIdea) {
      setRequestText((current) => current || profile.firstIdea);
    } else if (qPrompt && qPrompt.trim().length > 0 && qPrompt.trim().length < 180) {
      setRequestText((current) => current || qPrompt.trim());
    }
    if (params.has("idea") || params.has("prompt")) {
      params.delete("idea");
      params.delete("prompt");
      const next = params.toString();
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}${next ? `?${next}` : ""}${window.location.hash}`,
      );
    }
  }, [profile?.firstIdea]);

  const activeIntent = useMemo(() => {
    return INTENTS.find((i) => i.intent === intent) ?? INTENTS[0]!;
  }, [intent]);

  const createProject = useMutation({
    mutationFn: () =>
      createWfProject({
        data: { name: newProjectName.trim() || "First project" },
      }),
    onSuccess: async (project) => {
      setProjectId(project.id);
      setNewProjectName("");
      await queryClient.invalidateQueries({ queryKey: ["command"] });
    },
    onError: (err) => setFormError(err instanceof Error ? err.message : "Could not create project"),
  });

  const startMission = useMutation({
    mutationFn: async () => {
      let pid = projectId;
      if (!pid) {
        if (data?.projects[0]) {
          pid = data.projects[0].id;
        } else {
          const project = await createWfProject({
            data: { name: newProjectName.trim() || "First project" },
          });
          pid = project.id;
        }
      }
      return createMission({
        data: {
          projectId: pid,
          intent,
          requestText: requestText.trim(),
        },
      });
    },
    onSuccess: async (bundle) => {
      await queryClient.invalidateQueries({ queryKey: ["command"] });
      void navigate({
        to: "/command/missions/$missionId",
        params: { missionId: bundle.mission.id },
      });
    },
    onError: (err) => setFormError(err instanceof Error ? err.message : "Could not start mission"),
  });

  if (isLoading) {
    return (
      <CommandShell title="Command Centre" subtitle="Loading your product workforce workspace…">
        <p className="text-sm" style={{ color: "var(--x-slate-light)" }}>
          Preparing supervised workforce shell…
        </p>
      </CommandShell>
    );
  }

  if (isError || !data) {
    return (
      <CommandShell title="Command Centre" subtitle="Could not load workspace">
        <div className="cc-panel">
          <h2 className="cc-panel-title">Something went wrong</h2>
          <p className="cc-muted">
            {error instanceof Error
              ? error.message
              : "Check that workforce migrations are applied and you are signed in."}
          </p>
          <Link to="/login" className="cc-btn cc-btn-secondary mt-4 inline-flex">
            Sign in again
          </Link>
        </div>
      </CommandShell>
    );
  }

  const selectedProjectId = projectId || data.projects[0]?.id || "";
  const remainingCredits = Math.max(0, data.workspace.usageCeiling - data.workspace.usageConsumed);
  const awaitingCount = data.recentMissions.filter(
    (m) => m.status === "awaiting_approval" || m.status === "needs_clarification",
  ).length;
  const completedCount = data.recentMissions.filter((m) => m.status === "completed").length;
  const runningCount = data.recentMissions.filter((m) => m.status === "running").length;

  const filteredMissions = data.recentMissions.filter((m) => {
    if (missionFilter === "awaiting")
      return m.status === "awaiting_approval" || m.status === "needs_clarification";
    if (missionFilter === "completed") return m.status === "completed";
    if (
      missionFilter === "investigate" ||
      missionFilter === "prototype" ||
      missionFilter === "improve" ||
      missionFilter === "build"
    )
      return m.intent === missionFilter;
    return true;
  });

  return (
    <CommandShell
      title="Product workspace"
      subtitle="A product question, the evidence behind it, your decision, and work you can review."
      usage={{
        consumed: data.workspace.usageConsumed,
        ceiling: data.workspace.usageCeiling,
      }}
    >
      <WelcomeBanner />
      <SupervisedMissionStart />

      {/* Clean 4-Metric Operational Summary Strip */}
      <section className="cc-kpi-strip" aria-label="Workspace operational summary">
        <div className="cc-kpi-card">
          <div className="flex items-center justify-between gap-2">
            <span className="cc-kpi-label">Credits Remaining</span>
          </div>
          <strong className="cc-kpi-value">
            {remainingCredits} <small>/ {data.workspace.usageCeiling}</small>
          </strong>
          <span className="cc-kpi-sub">
            {data.workspace.usageConsumed} consumed · deterministic hard-stop enforced
          </span>
        </div>
        <div className="cc-kpi-card">
          <span className="cc-kpi-label">Human Supervision Queue</span>
          <strong className="cc-kpi-value">{awaitingCount}</strong>
          <span className="cc-kpi-sub">
            {awaitingCount > 0
              ? `${awaitingCount} awaiting your plan sign-off or clarification`
              : "No decisions are waiting"}
          </span>
        </div>
        <div className="cc-kpi-card">
          <span className="cc-kpi-label">Delivered Reports</span>
          <strong className="cc-kpi-value">
            {completedCount} <small>of {data.recentMissions.length}</small>
          </strong>
          <span className="cc-kpi-sub">
            {runningCount > 0
              ? `${runningCount} currently executing`
              : "Completed missions keep reviewable artefacts"}
          </span>
        </div>
        <div className="cc-kpi-card">
          <span className="cc-kpi-label">Role foundations</span>
          <strong className="cc-kpi-value">
            {WAVE1_AVAILABLE_IDS.length} <small>available</small>
          </strong>
          <span className="cc-kpi-sub">
            Planned catalogue roles do not run.{" "}
            <Link to="/command/capabilities" className="underline">
              Inspect status
            </Link>
          </span>
        </div>
      </section>

      {/* Unified Mission Composer Card */}
      <section
        id="mission-composer"
        className="cc-composer-card"
        aria-label="Commission a supervised mission"
      >
        <div className="cc-composer-head">
          <div>
            <p className="cc-kicker">
              <ShieldCheck className="size-3.5" /> Product question, evidence, your decision
            </p>
            <h2 className="cc-hero-title">Investigate one question</h2>
            <p className="cc-muted text-sm">
              Specialist contributions draft the work. You approve the plan before anything
              proceeds. Missing evidence stays visible.
            </p>
          </div>

          {/* Inline Project Container Selector */}
          <div className="cc-composer-project">
            <label className="cc-label mb-1" htmlFor="project">
              Product container
            </label>
            {data.projects.length ? (
              <select
                id="project"
                className="cc-input"
                value={selectedProjectId}
                onChange={(e) => setProjectId(e.target.value)}
              >
                {data.projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex gap-2">
                <input
                  className="cc-input"
                  placeholder="First product container…"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                />
                <button
                  type="button"
                  className="cc-btn cc-btn-secondary"
                  disabled={createProject.isPending}
                  onClick={() => createProject.mutate()}
                >
                  Create
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 3 Product Intent Tabs with Motion-Style Duotone Icons */}
        <div className="cc-intent-grid" role="tablist" aria-label="Select mission intent">
          {INTENTS.map((item) => {
            const Icon = item.icon;
            const DuotoneIcon = item.duotoneIcon;
            const active = intent === item.intent;
            const unavailable = item.intent === "build" && !data.features.productMission;
            return (
              <button
                key={item.intent}
                type="button"
                role="tab"
                aria-selected={active}
                aria-disabled={unavailable}
                title={
                  unavailable
                    ? "Available once the product-mission database migration is applied."
                    : undefined
                }
                className={`cc-intent${active ? " active" : ""}`}
                onClick={() => {
                  if (unavailable) {
                    setFormError(
                      "Product missions are not enabled on this workspace yet: the product-mission database migration has not been applied.",
                    );
                    return;
                  }
                  setFormError(null);
                  setIntent(item.intent);
                }}
              >
                <div className="cc-intent-top-row">
                  <div className="cc-intent-duotone-box" aria-hidden="true">
                    <DuotoneIcon className="size-7" />
                  </div>
                  <div className="cc-intent-meta">
                    <span className="cc-intent-badge">
                      <Icon className="size-3" /> {item.tag}
                    </span>
                    <strong>{INTENT_LABELS[item.intent]}</strong>
                  </div>
                </div>
                <span>{item.blurb}</span>
                <small className="cc-intent-deliverable">Deliverable: {item.deliverable}</small>
              </button>
            );
          })}
        </div>

        {/* Brief Input */}
        <div className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
            <label className="cc-label mb-0" htmlFor="mission-request">
              Mission brief ({INTENT_LABELS[activeIntent.intent]})
            </label>
            <span className="flex flex-wrap gap-1.5">
              <span className="cc-chip">Output: {activeIntent.deliverable}</span>
              <span
                className="cc-gen-badge"
                data-mode={data.features.modelMode.enabled ? "model" : "simulated"}
                title={
                  data.features.modelMode.enabled
                    ? `Stage outputs are generated by ${data.features.modelMode.model} via ${data.features.modelMode.provider}.`
                    : "No model is enabled: stage outputs are deterministic, clearly labelled simulated drafts."
                }
              >
                {data.features.modelMode.enabled
                  ? `Model: ${data.features.modelMode.model}`
                  : "Simulated mode"}
              </span>
            </span>
          </div>
          <textarea
            id="mission-request"
            className="cc-input cc-textarea"
            rows={4}
            placeholder={activeIntent.placeholder}
            value={requestText}
            onChange={(e) => setRequestText(e.target.value)}
          />

          {/* Compact Guided Product Playbook Starters */}
          <div className="cc-sample-row">
            <span className="cc-sample-label">Product Playbook Starter:</span>
            {activeIntent.samples.map((sample) => (
              <button
                key={sample.label}
                type="button"
                className="cc-sample-chip"
                onClick={() => setRequestText(sample.text)}
              >
                {sample.label} →
              </button>
            ))}
          </div>
        </div>

        {formError ? <p className="cc-error mt-3">{formError}</p> : null}

        <div
          className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4"
          style={{ borderColor: "var(--x-border)" }}
        >
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="cc-btn cc-btn-primary"
              disabled={startMission.isPending || requestText.trim().length < 3}
              onClick={() => {
                setFormError(null);
                startMission.mutate();
              }}
            >
              {startMission.isPending ? "Generating plan…" : "Draft mission plan →"}
            </button>
            <span className="cc-muted text-xs">
              Zero credits spent during planning. Execution waits for your approval.
            </span>
          </div>
          <div className="cc-lifecycle-mini" aria-label="Supervision sequence">
            <span>Mission</span>
            <span>→</span>
            <span>Plan</span>
            <span>→</span>
            <span className="is-gate">Approve</span>
            <span>→</span>
            <span>Execute</span>
            <span>→</span>
            <span>Deliver</span>
          </div>
        </div>
      </section>

      {/* Recent Missions & Supervision Ledger */}
      <section className="cc-panel">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="cc-panel-title mb-0">Product Missions &amp; Supervision Ledger</h2>
            <span className="cc-muted text-xs">
              {filteredMissions.length} of {data.recentMissions.length} missions shown
            </span>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { id: "all", label: `All (${data.recentMissions.length})` },
                { id: "awaiting", label: `Awaiting Gate (${awaitingCount})` },
                { id: "completed", label: `Delivered (${completedCount})` },
                { id: "investigate", label: "Investigate" },
                { id: "prototype", label: "Prototype" },
                { id: "improve", label: "Improve" },
                { id: "build", label: "Product" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMissionFilter(tab.id)}
                className={`rounded-full px-3 py-1 text-xs font-semibold border transition cursor-pointer ${
                  missionFilter === tab.id
                    ? "border-[#2C77E7] bg-[#EEF5FF] text-[#2C77E7]"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {filteredMissions.length === 0 ? (
          <p className="cc-muted mt-4">
            {data.recentMissions.length === 0 ? (
              <>
                No missions yet. Start with the product question above. The plan waits for your
                decision before downstream work runs.
              </>
            ) : (
              "No missions match the selected filter."
            )}
          </p>
        ) : (
          <ul className="cc-mission-list mt-4">
            {filteredMissions.map((m) => (
              <li key={m.id}>
                <Link
                  to="/command/missions/$missionId"
                  params={{ missionId: m.id }}
                  className="cc-mission-row"
                >
                  <div>
                    <strong>{m.title}</strong>
                    <span className="cc-muted">
                      {INTENT_LABELS[m.intent]} · {STATUS_LABELS[m.status]} · Ceiling:{" "}
                      {PERMISSION_LABELS[m.permissionCeiling]}
                    </span>
                  </div>
                  <span className={`cc-status cc-status-${m.status}`}>
                    {STATUS_LABELS[m.status]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </CommandShell>
  );
}

function WelcomeBanner() {
  const { user } = useSession();
  const { data: profile } = useQuery(myProfileQuery);
  const next = firstActionFor(profile ?? { goal: "", firstIdea: "" });
  return (
    <section className="cc-welcome" aria-label="Welcome">
      <div>
        <h2>Welcome{user ? `, ${firstNameOf(user, profile)}` : ""}.</h2>
        <p>
          {profile?.role ? `${profile.role} · ${profile.teamSize} · ` : ""}
          {next.reason}
        </p>
      </div>
      <div className="cc-welcome-actions">
        <Link to={next.href} className="cc-btn cc-btn-primary">
          {next.label} →
        </Link>
        <Link to="/onboarding" className="cc-btn cc-btn-secondary">
          Edit setup
        </Link>
      </div>
    </section>
  );
}
