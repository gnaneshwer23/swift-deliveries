import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CommandShell } from "@/components/command/command-shell";
import { commandCentreBootstrapQuery } from "@/lib/workforce-queries";
import { createMission, createWfProject } from "@/lib/workforce.functions";
import {
  INTENT_LABELS,
  PERMISSION_LABELS,
  STATUS_LABELS,
  type MissionIntent,
} from "@/lib/workforce/types";
import { WAVE1_AVAILABLE_IDS } from "@/lib/workforce/registry";
import { FlaskConical, Search, Sparkles, Wrench } from "lucide-react";

export const Route = createFileRoute("/_authenticated/command/")({
  head: () => ({
    meta: [
      { title: "Command Centre — DeliverX" },
      {
        name: "description",
        content:
          "Commission supervised AI missions: investigate, prototype, or improve — with plans, approvals, and usage ceilings.",
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
  tag: string;
  blurb: string;
  deliverable: string;
  placeholder: string;
  samples: string[];
}> = [
  {
    intent: "investigate",
    icon: Search,
    tag: "Decision Research",
    blurb:
      "Research a strategic or product decision and return a brief with sourced facts separated from assumptions.",
    deliverable: "Decision Brief + Evidence Matrix",
    placeholder:
      "Investigate whether we should add a sponsor dashboard for healthcare delivery leads, for the COO audience…",
    samples: [
      "Investigate whether we should add a sponsor reporting dashboard for delivery leads, for the COO audience, comparing build vs partner options.",
      "Investigate enterprise buyer objections to usage-based credit ceilings for product operations teams.",
    ],
  },
  {
    intent: "prototype",
    icon: FlaskConical,
    tag: "Product & UI Spec",
    blurb:
      "Produce a reviewable product specification plus a lightweight sandboxed HTML prototype.",
    deliverable: "PRD + Interactive HTML Pack",
    placeholder:
      "Prototype a notification settings drawer with a clear save confirmation for workspace admins…",
    samples: [
      "Prototype a workspace credit ceiling alert drawer with hard-stop state and approval history for workspace operators.",
      "Prototype an external attestation review screen showing frozen artefact provenance for hiring managers.",
    ],
  },
  {
    intent: "improve",
    icon: Wrench,
    tag: "Flow Diagnostics",
    blurb:
      "Diagnose friction in an existing workflow and propose bounded changes — never an unapproved deploy.",
    deliverable: "Friction Diagnosis + Remediation Plan",
    placeholder:
      "Improve mobile checkout abandonment between basket review and payment confirmation…",
    samples: [
      "Improve mobile checkout drop-off between basket review and payment confirmation without changing Stripe webhook schemas.",
      "Improve mission clarification turnaround when operators submit single-sentence briefs in Command Centre.",
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
      subtitle="Supervised AI workforce · Mission intake, plan approval & execution monitor"
      usage={{
        consumed: data.workspace.usageConsumed,
        ceiling: data.workspace.usageCeiling,
      }}
    >
      {/* PeopleFlow-style Operational KPI Strip */}
      <section className="cc-kpi-strip" aria-label="Workspace operational summary">
        <div className="cc-kpi-card">
          <span className="cc-kpi-label">Credits Remaining</span>
          <strong className="cc-kpi-value">
            {remainingCredits} <small>/ {data.workspace.usageCeiling}</small>
          </strong>
          <span className="cc-kpi-sub">
            {data.workspace.usageConsumed} consumed · deterministic hard-stop
          </span>
        </div>
        <div className="cc-kpi-card">
          <span className="cc-kpi-label">Recent Missions</span>
          <strong className="cc-kpi-value">{data.recentMissions.length}</strong>
          <span className="cc-kpi-sub">
            {awaitingCount > 0
              ? `${awaitingCount} awaiting operator action`
              : "All active missions up to date"}
          </span>
        </div>
        <div className="cc-kpi-card">
          <span className="cc-kpi-label">Workforce Projects</span>
          <strong className="cc-kpi-value">{data.projects.length}</strong>
          <span className="cc-kpi-sub">
            <Link to="/command/projects" className="underline">
              Manage project containers
            </Link>
          </span>
        </div>
        <div className="cc-kpi-card">
          <span className="cc-kpi-label">Assignable Workforce</span>
          <strong className="cc-kpi-value">
            {WAVE1_AVAILABLE_IDS.length} <small>Wave 1</small>
          </strong>
          <span className="cc-kpi-sub">
            of 150 catalogue roles ·{" "}
            <Link to="/command/capabilities" className="underline">
              Browse registry
            </Link>
          </span>
        </div>
      </section>

      <section className="cc-hero-band">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="cc-kicker">
              <Sparkles className="size-3.5" /> Supervised Mission Intake · Stage 1
            </p>
            <h2 className="cc-hero-title">Commission a bounded AI mission</h2>
            <p className="cc-muted max-w-2xl">
              Select an intent below, describe the outcome you need, and inspect the generated task
              graph before approving. External actions remain locked behind a separate gate.
            </p>
          </div>
          <div className="cc-lifecycle-mini" aria-label="Supervision sequence">
            <span>1. Mission</span>
            <span>→</span>
            <span>2. Clarify</span>
            <span>→</span>
            <span className="is-gate">3. Approve Plan</span>
            <span>→</span>
            <span>4. Execute</span>
            <span>→</span>
            <span>5. Deliver</span>
          </div>
        </div>
      </section>

      <section className="cc-intent-grid" aria-label="Select mission intent">
        {INTENTS.map((item) => {
          const Icon = item.icon;
          const active = intent === item.intent;
          return (
            <button
              key={item.intent}
              type="button"
              aria-pressed={active}
              className={`cc-intent${active ? " active" : ""}`}
              onClick={() => setIntent(item.intent)}
            >
              <div className="flex w-full items-center justify-between gap-2">
                <Icon className="size-4" />
                <span className="cc-intent-badge">{item.tag}</span>
              </div>
              <strong>{INTENT_LABELS[item.intent]}</strong>
              <span>{item.blurb}</span>
              <small className="cc-intent-deliverable">Output: {item.deliverable}</small>
            </button>
          );
        })}
      </section>

      <section className="cc-panel">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="cc-panel-title mb-0.5">
              Mission brief · {INTENT_LABELS[activeIntent.intent]}
            </h2>
            <p className="cc-muted text-xs">{activeIntent.blurb}</p>
          </div>
          <span className="cc-chip">Expected deliverable: {activeIntent.deliverable}</span>
        </div>

        <label className="cc-label" htmlFor="project">
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
          <div className="mb-3 flex flex-col gap-2 sm:flex-row">
            <input
              className="cc-input"
              placeholder="Name your first project (e.g. Q4 Product Operations)"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
            />
            <button
              type="button"
              className="cc-btn cc-btn-secondary"
              disabled={createProject.isPending}
              onClick={() => createProject.mutate()}
            >
              Create project
            </button>
          </div>
        )}

        <label className="cc-label mt-4" htmlFor="mission-request">
          What would you like to get done?
        </label>
        <textarea
          id="mission-request"
          className="cc-input cc-textarea"
          rows={5}
          placeholder={activeIntent.placeholder}
          value={requestText}
          onChange={(e) => setRequestText(e.target.value)}
        />

        {/* Quick-fill guided templates */}
        <div className="cc-sample-row">
          <span className="cc-sample-label">Try a guided brief:</span>
          {activeIntent.samples.map((sample, idx) => (
            <button
              key={sample}
              type="button"
              className="cc-sample-chip"
              onClick={() => setRequestText(sample)}
            >
              Sample {idx + 1}: {sample.slice(0, 58)}…
            </button>
          ))}
        </div>

        {formError ? <p className="cc-error mt-3">{formError}</p> : null}

        <div
          className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4"
          style={{ borderColor: "var(--x-border)" }}
        >
          <div className="flex flex-wrap gap-2">
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
            <Link to="/command/projects" className="cc-btn cc-btn-secondary">
              Manage projects
            </Link>
            <Link to="/command/capabilities" className="cc-btn cc-btn-secondary">
              Capability registry
            </Link>
          </div>
          <span className="cc-muted text-xs">
            No credits are spent until you approve the generated plan.
          </span>
        </div>
      </section>

      <section className="cc-panel">
        <div className="flex items-center justify-between gap-3">
          <h2 className="cc-panel-title mb-0">Recent missions</h2>
          <span className="cc-muted text-xs">{data.recentMissions.length} shown</span>
        </div>
        {data.recentMissions.length === 0 ? (
          <p className="cc-muted mt-4">
            No missions yet. Pick Investigate, Prototype, or Improve above (or click a guided sample
            brief) to commission your first supervised mission.
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
