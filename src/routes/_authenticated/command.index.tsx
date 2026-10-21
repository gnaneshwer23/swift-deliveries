import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CommandShell } from "@/components/command/command-shell";
import { commandCentreBootstrapQuery } from "@/lib/workforce-queries";
import { createMission, createWfProject } from "@/lib/workforce.functions";
import {
  INTENT_LABELS,
  STATUS_LABELS,
  type MissionIntent,
} from "@/lib/workforce/types";
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
  blurb: string;
  placeholder: string;
}> = [
  {
    intent: "investigate",
    icon: Search,
    blurb: "Research a decision and return a brief with sourced facts vs assumptions.",
    placeholder:
      "Investigate whether we should add a sponsor dashboard for healthcare delivery leads…",
  },
  {
    intent: "prototype",
    icon: FlaskConical,
    blurb: "Produce a reviewable product brief plus a lightweight interactive HTML prototype.",
    placeholder: "Prototype a notification settings page with a clear save confirmation…",
  },
  {
    intent: "improve",
    icon: Wrench,
    blurb: "Diagnose friction and sketch an improved flow — not a production deploy.",
    placeholder: "Improve mobile checkout abandonment between cart and pay…",
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
    onError: (err) =>
      setFormError(err instanceof Error ? err.message : "Could not start mission"),
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

  return (
    <CommandShell
      title="Command Centre"
      subtitle="What would you like to get done?"
      usage={{
        consumed: data.workspace.usageConsumed,
        ceiling: data.workspace.usageCeiling,
      }}
    >
      <section className="cc-hero-band">
        <p className="cc-kicker">
          <Sparkles className="size-3.5" /> DeliverX supervised AI workforce
        </p>
        <h2 className="cc-hero-title">Commission a mission</h2>
        <p className="cc-muted max-w-2xl">
          Plans stay under your approval. External actions never run without an explicit Act
          externally gate. Usage hard-stops at your workspace ceiling.
        </p>
      </section>

      <section className="cc-intent-grid">
        {INTENTS.map((item) => {
          const Icon = item.icon;
          const active = intent === item.intent;
          return (
            <button
              key={item.intent}
              type="button"
              className={`cc-intent${active ? " active" : ""}`}
              onClick={() => setIntent(item.intent)}
            >
              <Icon className="size-4" />
              <strong>{INTENT_LABELS[item.intent]}</strong>
              <span>{item.blurb}</span>
            </button>
          );
        })}
      </section>

      <section className="cc-panel">
        <h2 className="cc-panel-title">Mission intake</h2>
        <p className="cc-muted mb-4">{activeIntent.blurb}</p>

        <label className="cc-label" htmlFor="project">
          Project
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
              placeholder="Name your first project"
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

        {formError ? <p className="cc-error mt-3">{formError}</p> : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="cc-btn cc-btn-primary"
            disabled={startMission.isPending || requestText.trim().length < 3}
            onClick={() => {
              setFormError(null);
              startMission.mutate();
            }}
          >
            {startMission.isPending ? "Planning…" : "Start mission"}
          </button>
          <Link to="/command/projects" className="cc-btn cc-btn-secondary">
            Manage projects
          </Link>
        </div>
      </section>

      <section className="cc-panel">
        <div className="flex items-center justify-between gap-3">
          <h2 className="cc-panel-title mb-0">Recent missions</h2>
          <span className="cc-muted text-xs">{data.recentMissions.length} shown</span>
        </div>
        {data.recentMissions.length === 0 ? (
          <p className="cc-muted mt-4">
            No missions yet. Pick Investigate, Prototype, or Improve above to commission the first
            one.
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
                      {INTENT_LABELS[m.intent]} · {STATUS_LABELS[m.status]}
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
