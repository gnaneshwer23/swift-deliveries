import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CommandShell } from "@/components/command/command-shell";
import { commandCentreBootstrapQuery } from "@/lib/workforce-queries";
import {
  createMission,
  createWfProject,
  resetWorkspacePreviewCredits,
} from "@/lib/workforce.functions";
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
import { FlaskConical, RotateCcw, Search, ShieldCheck, Wrench } from "lucide-react";

export const Route = createFileRoute("/_authenticated/command/")({
  head: () => ({
    meta: [
      { title: "Command Centre — DeliverX" },
      {
        name: "description",
        content:
          "Commission supervised AI product missions: investigate, prototype, or improve — with plans, approvals, and usage ceilings.",
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
        label: "External Attestation Review Flow",
        text: "Prototype an external attestation review screen showing frozen artefact provenance for hiring managers.",
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

  const resetCredits = useMutation({
    mutationFn: () => resetWorkspacePreviewCredits(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["command"] });
    },
    onError: (err) => setFormError(err instanceof Error ? err.message : "Could not reset credits"),
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
      <CommandShell title="Command Centre" subtitle="Loading your workspace…">
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

  return (
    <CommandShell
      title="Command Centre"
      subtitle="Supervised AI Product Workforce · Mission intake, plan approval & execution monitor"
      usage={{
        consumed: data.workspace.usageConsumed,
        ceiling: data.workspace.usageCeiling,
      }}
    >
      {/* Clean 4-Metric Operational Summary Strip */}
      <section className="cc-kpi-strip" aria-label="Workspace operational summary">
        <div className="cc-kpi-card">
          <div className="flex items-center justify-between gap-2">
            <span className="cc-kpi-label">Credits Remaining</span>
            {data.workspace.usageConsumed > 0 ? (
              <button
                type="button"
                onClick={() => resetCredits.mutate()}
                disabled={resetCredits.isPending}
                className="cc-reset-credits-btn"
                title="Reset workspace credit allowance back to 100 credits"
              >
                <RotateCcw className="size-3" />
                {resetCredits.isPending ? "Resetting…" : "Reset credits"}
              </button>
            ) : null}
          </div>
          <strong className="cc-kpi-value">
            {remainingCredits} <small>/ {data.workspace.usageCeiling}</small>
          </strong>
          <span className="cc-kpi-sub">
            {data.workspace.usageConsumed} consumed · hard-stop ceiling enforced
          </span>
        </div>
        <div className="cc-kpi-card">
          <span className="cc-kpi-label">Active Supervision</span>
          <strong className="cc-kpi-value">{data.recentMissions.length}</strong>
          <span className="cc-kpi-sub">
            {awaitingCount > 0
              ? `${awaitingCount} awaiting your review or approval`
              : "All missions up to date"}
          </span>
        </div>
        <div className="cc-kpi-card">
          <span className="cc-kpi-label">Project Containers</span>
          <strong className="cc-kpi-value">{data.projects.length}</strong>
          <span className="cc-kpi-sub">
            <Link to="/command/projects" className="underline">
              Manage projects
            </Link>
          </span>
        </div>
        <div className="cc-kpi-card">
          <span className="cc-kpi-label">Available Capabilities</span>
          <strong className="cc-kpi-value">
            {WAVE1_AVAILABLE_IDS.length} <small>Active</small>
          </strong>
          <span className="cc-kpi-sub">
            of 150 registry roles ·{" "}
            <Link to="/command/capabilities" className="underline">
              Inspect catalogue
            </Link>
          </span>
        </div>
      </section>

      {/* Unified Mission Composer Card */}
      <section className="cc-composer-card" aria-label="Commission a supervised mission">
        <div className="cc-composer-head">
          <div>
            <p className="cc-kicker">
              <ShieldCheck className="size-3.5" /> Supervised Product Mission Composer
            </p>
            <h2 className="cc-hero-title">Commission a bounded AI product mission</h2>
          </div>

          {/* Inline Project Container Selector */}
          <div className="cc-composer-project">
            <label className="cc-label mb-1" htmlFor="project">
              Project container
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
                  placeholder="First project name…"
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
            return (
              <button
                key={item.intent}
                type="button"
                role="tab"
                aria-selected={active}
                className={`cc-intent${active ? " active" : ""}`}
                onClick={() => setIntent(item.intent)}
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
            <span className="cc-chip">Output: {activeIntent.deliverable}</span>
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

      {/* Recent Missions Ledger */}
      <section className="cc-panel">
        <div className="flex items-center justify-between gap-3">
          <h2 className="cc-panel-title mb-0">Recent missions</h2>
          <span className="cc-muted text-xs">{data.recentMissions.length} in workspace</span>
        </div>
        {data.recentMissions.length === 0 ? (
          <p className="cc-muted mt-4">
            No missions commissioned yet. Choose <strong>Investigate</strong>,{" "}
            <strong>Prototype</strong>, or <strong>Improve</strong> above (or click a Product
            Playbook starter) to draft your first plan.
          </p>
        ) : (
          <ul className="cc-mission-list mt-4">
            {data.recentMissions.map((m) => (
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
