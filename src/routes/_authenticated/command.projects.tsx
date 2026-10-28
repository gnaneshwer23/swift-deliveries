import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { CommandShell } from "@/components/command/command-shell";
import { getSupervisedProjectShelf, startSupervisedMission } from "@/lib/pilot-mission.functions";
import { commandCentreBootstrapQuery, wfProjectsQuery } from "@/lib/workforce-queries";
import { createWfProject } from "@/lib/workforce.functions";

export const Route = createFileRoute("/_authenticated/command/projects")({
  head: () => ({
    meta: [
      { title: "Projects — DeliverX Studio" },
      {
        name: "description",
        content: "Product memory shelf — missions, artefacts and decisions for supervised builds.",
      },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(commandCentreBootstrapQuery),
      context.queryClient.ensureQueryData(wfProjectsQuery),
    ]);
  },
  component: CommandProjects,
});

function CommandProjects() {
  const bootstrap = useQuery(commandCentreBootstrapQuery);
  const projects = useQuery(wfProjectsQuery);
  const shelf = useQuery({
    queryKey: ["supervised", "project-shelf"],
    queryFn: () => getSupervisedProjectShelf(),
  });
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [followUpByProject, setFollowUpByProject] = useState<Record<string, string>>({});
  const [followUpError, setFollowUpError] = useState<string | null>(null);
  const [followUpProjectId, setFollowUpProjectId] = useState<string | null>(null);
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () =>
      createWfProject({
        data: {
          name: name.trim(),
          description: description.trim() || undefined,
        },
      }),
    onSuccess: async () => {
      setName("");
      setDescription("");
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ["command"] });
      await queryClient.invalidateQueries({ queryKey: ["supervised", "project-shelf"] });
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Create failed"),
  });

  const proposeFollowUp = useMutation({
    mutationFn: (input: { projectId: string; question: string }) =>
      startSupervisedMission({
        data: {
          question: input.question,
          researchMode: "combined",
          projectId: input.projectId,
        },
      }),
    onSuccess: async (result) => {
      setFollowUpError(null);
      setFollowUpProjectId(null);
      setFollowUpByProject((prev) => ({
        ...prev,
        [result.mission.projectId ?? ""]: "",
      }));
      await queryClient.invalidateQueries({ queryKey: ["supervised"] });
      await queryClient.invalidateQueries({ queryKey: ["supervised", "project-shelf"] });
      void navigate({
        to: "/command/supervised/$missionId",
        params: { missionId: result.mission.id },
      });
    },
    onError: (err) =>
      setFollowUpError(err instanceof Error ? err.message : "Follow-up could not be proposed."),
  });

  const usage = bootstrap.data
    ? {
        consumed: bootstrap.data.workspace.usageConsumed,
        ceiling: bootstrap.data.workspace.usageCeiling,
      }
    : undefined;

  const shelfById = new Map((shelf.data ?? []).map((s) => [s.projectId, s]));
  const projectRows = projects.data ?? [];

  function toggleProject(id: string) {
    setExpandedProjectId((current) => (current === id ? null : id));
  }

  return (
    <CommandShell title="Projects" hideHeading usage={usage}>
      <div className="ps-room">
        <header className="ps-room-stage" aria-label="Projects">
          <p className="ps-foyer-brand">DeliverX Studio</p>
          <p className="cc-kicker">Projects</p>
          <h1 className="ps-foyer-headline">Product memory shelf</h1>
          <p className="ps-foyer-lede">
            Missions, decisions and packs for a case family. Expand a row when you need detail —
            nothing runs until you approve the plan.
          </p>
          <p className="ps-foyer-side-links">
            <Link to="/command" hash="supervised-brief">
              Brief a new case
            </Link>
            <span aria-hidden="true">·</span>
            <Link to="/command/capabilities">Specialists &amp; office</Link>
          </p>
        </header>

        <details className="ps-project-manage ps-room-section">
          <summary>Manage projects</summary>
          <div className="ps-project-manage-body">
            <p className="cc-muted text-sm">
              Create a shelf for a product family, or jump to memory for an existing project.
            </p>
            <div className="ps-project-manage-create">
              <h3 className="cc-panel-title text-base">Create project</h3>
              <label className="cc-label" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                className="cc-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sponsor reporting pilot"
              />
              <label className="cc-label mt-3" htmlFor="desc">
                Description (optional)
              </label>
              <textarea
                id="desc"
                className="cc-input cc-textarea"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Why this project exists"
              />
              {error ? <p className="cc-error mt-3">{error}</p> : null}
              <button
                type="button"
                className="cc-btn cc-btn-primary mt-3"
                disabled={create.isPending || name.trim().length < 2}
                onClick={() => create.mutate()}
              >
                {create.isPending ? "Creating…" : "Create project"}
              </button>
            </div>
            {projects.isLoading ? (
              <p className="cc-muted text-sm">Loading projects…</p>
            ) : projects.isError ? (
              <p className="cc-error text-sm">
                {projects.error instanceof Error ? projects.error.message : "Failed to load"}
              </p>
            ) : !projectRows.length ? (
              <p className="cc-muted text-sm">No projects yet — create one above.</p>
            ) : (
              <ul className="ps-project-manage-list">
                {projectRows.map((p) => {
                  const attached = shelfById.get(p.id);
                  return (
                    <li key={p.id}>
                      <strong>{p.name}</strong>
                      <span className="cc-muted text-xs">
                        {attached
                          ? `${attached.missions.length} mission${attached.missions.length === 1 ? "" : "s"}`
                          : "No missions yet"}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          to="/command/product-memory/$projectId"
                          params={{ projectId: p.id }}
                          className="cc-btn cc-btn-secondary"
                        >
                          Product memory
                        </Link>
                        <Link to="/command" hash="supervised-brief" className="cc-btn cc-btn-ghost">
                          New mission
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </details>

        <section className="ps-room-section" aria-label="Product artefact shelf">
          <h2 className="ps-room-subhead">On the shelf</h2>
          {shelf.isLoading || projects.isLoading ? (
            <p className="cc-muted">Loading product memory…</p>
          ) : shelf.isError ? (
            <p className="cc-error">
              {shelf.error instanceof Error ? shelf.error.message : "Failed to load shelf"}
            </p>
          ) : !projectRows.length ? (
            <p className="cc-muted">
              No projects yet. Use <span className="font-medium">Manage projects</span> above, or
              start from{" "}
              <Link to="/command" hash="supervised-brief" className="underline">
                Overview
              </Link>
              .
            </p>
          ) : (
            <ul className="ps-project-quiet-list">
              {projectRows.map((p) => {
                const s = shelfById.get(p.id);
                const missionCount = s?.missions.length ?? 0;
                const artefactCount = s?.missions.reduce((n, m) => n + m.artefacts.length, 0) ?? 0;
                const expanded = expandedProjectId === p.id;
                const draft = followUpByProject[p.id] ?? "";
                const canPropose = draft.trim().length >= 8;

                return (
                  <li
                    key={p.id}
                    className={`ps-project-quiet-row${expanded ? " is-expanded" : ""}`}
                  >
                    <button
                      type="button"
                      className="ps-project-quiet-trigger"
                      aria-expanded={expanded}
                      onClick={() => toggleProject(p.id)}
                    >
                      <span className="ps-project-quiet-main">
                        <strong>{p.name}</strong>
                        <span className="cc-muted text-sm">
                          {missionCount} mission{missionCount === 1 ? "" : "s"}
                          {artefactCount > 0
                            ? ` · ${artefactCount} artefact${artefactCount === 1 ? "" : "s"}`
                            : ""}
                        </span>
                      </span>
                      <ChevronDown
                        className="ps-project-quiet-chevron"
                        size={18}
                        aria-hidden="true"
                      />
                    </button>
                    {expanded ? (
                      <div className="ps-project-quiet-body">
                        {p.description ? <p className="cc-muted text-sm">{p.description}</p> : null}
                        {!s || s.missions.length === 0 ? (
                          <p className="cc-muted text-sm">
                            No attached missions yet.{" "}
                            <Link to="/command" hash="supervised-brief" className="underline">
                              Brief a case
                            </Link>{" "}
                            on this shelf.
                          </p>
                        ) : (
                          <ul className="ps-project-shelf-missions">
                            {s.missions.map((m) => (
                              <li key={m.missionId} className="ps-project-shelf-mission-block">
                                <Link
                                  to="/command/supervised/$missionId"
                                  params={{ missionId: m.missionId }}
                                  className="ps-project-shelf-mission"
                                >
                                  <strong>{m.question}</strong>
                                  <span className="cc-muted text-xs">
                                    {m.stageLabel}
                                    {m.beatsTotal > 0
                                      ? ` · Beats ${m.beatsDone}/${m.beatsTotal}`
                                      : ""}
                                    {m.researchProvider ? ` · Cited · ${m.researchProvider}` : ""}
                                  </span>
                                  <span className="ps-project-shelf-next text-xs">
                                    Next: {m.nextAction}
                                    {m.openGaps > 0
                                      ? ` · ${m.openGaps} labelled gap${m.openGaps === 1 ? "" : "s"}`
                                      : ""}
                                  </span>
                                </Link>
                                {m.artefacts.length > 0 ? (
                                  <ul className="ps-project-shelf-artefacts">
                                    {m.artefacts.map((a) => (
                                      <li key={`${m.missionId}-${a.kind}-${a.title}`}>
                                        <span>
                                          {a.title}
                                          {a.state === "current" ? (
                                            <span className="cc-muted text-xs"> · in progress</span>
                                          ) : null}
                                        </span>
                                        <span className="ps-honesty-badges">
                                          <span>{a.honesty}</span>
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="cc-muted text-xs">
                                    No completed artefacts yet — open the mission to approve the
                                    plan or advance the current beat.
                                  </p>
                                )}
                                {m.decisions.length > 0 ? (
                                  <ul className="ps-project-shelf-decisions">
                                    {m.decisions.map((d) => (
                                      <li key={`${m.missionId}-${d.at}`}>
                                        Decision: {d.summary}
                                        <span className="cc-muted text-xs">
                                          {" "}
                                          · {new Date(d.at).toLocaleString()}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="cc-muted text-xs">
                                    No owner decision recorded yet.
                                  </p>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}

                        <div
                          className="ps-project-follow-up"
                          aria-label={`Propose follow-up for ${p.name}`}
                        >
                          <label className="cc-label" htmlFor={`follow-up-${p.id}`}>
                            Propose follow-up mission
                          </label>
                          <textarea
                            id={`follow-up-${p.id}`}
                            className="cc-input cc-textarea"
                            rows={2}
                            value={draft}
                            onChange={(e) =>
                              setFollowUpByProject((prev) => ({
                                ...prev,
                                [p.id]: e.target.value,
                              }))
                            }
                            placeholder="Next product question for this case family…"
                          />
                          {followUpError && followUpProjectId === p.id ? (
                            <p className="cc-error mt-2">{followUpError}</p>
                          ) : null}
                          <button
                            type="button"
                            className="cc-btn cc-btn-primary mt-2"
                            disabled={
                              !canPropose ||
                              (proposeFollowUp.isPending && followUpProjectId === p.id)
                            }
                            onClick={() => {
                              setFollowUpError(null);
                              setFollowUpProjectId(p.id);
                              proposeFollowUp.mutate({
                                projectId: p.id,
                                question: draft.trim(),
                              });
                            }}
                          >
                            {proposeFollowUp.isPending && followUpProjectId === p.id
                              ? "Proposing…"
                              : "Propose follow-up"}
                          </button>
                        </div>

                        <Link
                          to="/command/product-memory/$projectId"
                          params={{ projectId: p.id }}
                          className="cc-btn cc-btn-secondary mt-2 inline-flex"
                        >
                          Open product memory
                        </Link>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </CommandShell>
  );
}
