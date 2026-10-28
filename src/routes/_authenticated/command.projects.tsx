import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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
  const shelfWithMissions = (shelf.data ?? []).filter((s) => s.missions.length > 0);

  return (
    <CommandShell title="Projects" hideHeading usage={usage}>
      <div className="ps-room">
        <header className="ps-room-stage" aria-label="Projects">
          <p className="ps-foyer-brand">DeliverX Studio</p>
          <p className="cc-kicker">Projects</p>
          <h1 className="ps-foyer-headline">Product memory shelf</h1>
          <p className="ps-foyer-lede">
            Missions, decisions and packs for a case family. Propose a follow-up from here — nothing
            runs until you approve that plan.
          </p>
          <p className="ps-foyer-side-links">
            <Link to="/command" hash="supervised-brief">
              Brief a new case
            </Link>
            <span aria-hidden="true">·</span>
            <Link to="/command/capabilities">Specialists</Link>
          </p>
        </header>

        <section className="cc-panel" aria-label="Product artefact shelf">
          <h2 className="cc-panel-title">Artefact shelf</h2>
          {shelf.isLoading ? (
            <p className="cc-muted">Loading product memory…</p>
          ) : shelf.isError ? (
            <p className="cc-error">
              {shelf.error instanceof Error ? shelf.error.message : "Failed to load shelf"}
            </p>
          ) : shelfWithMissions.length === 0 ? (
            <p className="cc-muted">
              No attached missions yet. Start a one-liner from{" "}
              <Link to="/command" hash="supervised-brief" className="underline">
                Overview
              </Link>{" "}
              — the project shelf fills as beats complete.
            </p>
          ) : (
            <ul className="ps-project-shelf">
              {shelfWithMissions.map((s) => {
                const draft = followUpByProject[s.projectId] ?? "";
                const canPropose = draft.trim().length >= 8;
                return (
                  <li key={s.projectId} className="ps-project-shelf-item">
                    <div className="ps-project-shelf-head">
                      <strong>{s.name}</strong>
                      <span className="cc-muted text-sm">
                        {s.missions.length} mission{s.missions.length === 1 ? "" : "s"} ·{" "}
                        {s.missions.reduce((n, m) => n + m.artefacts.length, 0)} artefact
                        {s.missions.reduce((n, m) => n + m.artefacts.length, 0) === 1
                          ? ""
                          : "s"} · {s.missions.reduce((n, m) => n + m.decisions.length, 0)} decision
                        {s.missions.reduce((n, m) => n + m.decisions.length, 0) === 1 ? "" : "s"}
                      </span>
                    </div>
                    {s.description ? <p className="cc-muted text-sm">{s.description}</p> : null}
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
                              {m.beatsTotal > 0 ? ` · Beats ${m.beatsDone}/${m.beatsTotal}` : ""}
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
                              No completed artefacts yet — open the mission to approve the plan or
                              advance the current beat.
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
                            <p className="cc-muted text-xs">No owner decision recorded yet.</p>
                          )}
                        </li>
                      ))}
                    </ul>

                    <div
                      className="ps-project-follow-up"
                      aria-label={`Propose follow-up for ${s.name}`}
                    >
                      <label className="cc-label" htmlFor={`follow-up-${s.projectId}`}>
                        Propose follow-up mission
                      </label>
                      <p className="cc-muted text-xs mb-2">
                        Opens a new PM brief on this product shelf. You still approve the plan —
                        nothing is auto-authorised.
                      </p>
                      <textarea
                        id={`follow-up-${s.projectId}`}
                        className="cc-input cc-textarea"
                        rows={2}
                        value={draft}
                        onChange={(e) =>
                          setFollowUpByProject((prev) => ({
                            ...prev,
                            [s.projectId]: e.target.value,
                          }))
                        }
                        placeholder="Next product question for this case family…"
                      />
                      {followUpError && followUpProjectId === s.projectId ? (
                        <p className="cc-error mt-2">{followUpError}</p>
                      ) : null}
                      <button
                        type="button"
                        className="cc-btn cc-btn-primary mt-2"
                        disabled={
                          !canPropose ||
                          (proposeFollowUp.isPending && followUpProjectId === s.projectId)
                        }
                        onClick={() => {
                          setFollowUpError(null);
                          setFollowUpProjectId(s.projectId);
                          proposeFollowUp.mutate({
                            projectId: s.projectId,
                            question: draft.trim(),
                          });
                        }}
                      >
                        {proposeFollowUp.isPending && followUpProjectId === s.projectId
                          ? "Proposing…"
                          : "Propose follow-up"}
                      </button>
                    </div>

                    <Link
                      to="/command/product-memory/$projectId"
                      params={{ projectId: s.projectId }}
                      className="cc-btn cc-btn-secondary mt-2 inline-flex"
                    >
                      Open product memory
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="cc-panel">
          <h2 className="cc-panel-title">Create project</h2>
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
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Why this project exists"
          />
          {error ? <p className="cc-error mt-3">{error}</p> : null}
          <button
            type="button"
            className="cc-btn cc-btn-primary mt-4"
            disabled={create.isPending || name.trim().length < 2}
            onClick={() => create.mutate()}
          >
            {create.isPending ? "Creating…" : "Create project"}
          </button>
        </section>

        <section className="cc-panel">
          <h2 className="cc-panel-title">Your projects</h2>
          {projects.isLoading ? (
            <p className="cc-muted">Loading projects…</p>
          ) : projects.isError ? (
            <p className="cc-error">
              {projects.error instanceof Error ? projects.error.message : "Failed to load"}
            </p>
          ) : !projects.data?.length ? (
            <p className="cc-muted">
              No projects yet. Create one above, then start a mission from the{" "}
              <Link to="/command" className="underline">
                Studio
              </Link>
              .
            </p>
          ) : (
            <ul className="cc-mission-list">
              {projects.data.map((p) => {
                const attached = shelfById.get(p.id);
                return (
                  <li key={p.id} className="cc-mission-row static">
                    <div>
                      <strong>{p.name}</strong>
                      <span className="cc-muted">
                        {p.description || "No description"} · created{" "}
                        {new Date(p.createdAt).toLocaleDateString()}
                        {attached
                          ? ` · ${attached.missions.length} supervised mission${attached.missions.length === 1 ? "" : "s"}`
                          : ""}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        to="/command/product-memory/$projectId"
                        params={{ projectId: p.id }}
                        className="cc-btn cc-btn-secondary"
                      >
                        Product memory
                      </Link>
                      <Link
                        to="/command"
                        hash="supervised-brief"
                        className="cc-btn cc-btn-secondary"
                      >
                        New mission
                      </Link>
                    </div>
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
