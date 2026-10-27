import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CommandShell } from "@/components/command/command-shell";
import { getSupervisedProjectShelf } from "@/lib/pilot-mission.functions";
import { commandCentreBootstrapQuery, wfProjectsQuery } from "@/lib/workforce-queries";
import { createWfProject } from "@/lib/workforce.functions";

export const Route = createFileRoute("/_authenticated/command/projects")({
  head: () => ({
    meta: [
      { title: "Projects — Command Centre — DeliverX" },
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
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

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

  const usage = bootstrap.data
    ? {
        consumed: bootstrap.data.workspace.usageConsumed,
        ceiling: bootstrap.data.workspace.usageCeiling,
      }
    : undefined;

  const shelfById = new Map((shelf.data ?? []).map((s) => [s.projectId, s]));

  return (
    <CommandShell
      title="Projects"
      subtitle="Product memory shelf — missions, decisions and packs for a case family"
      usage={usage}
    >
      <p className="cc-muted text-sm mb-4">
        Supervised missions auto-attach a lightweight project when a family starts. Artefacts and
        decisions below are read-only memory of what agents built — not a second planner.
      </p>

      <section className="cc-panel" aria-label="Product artefact shelf">
        <h2 className="cc-panel-title">Artefact shelf</h2>
        {shelf.isLoading ? (
          <p className="cc-muted">Loading product memory…</p>
        ) : shelf.isError ? (
          <p className="cc-error">
            {shelf.error instanceof Error ? shelf.error.message : "Failed to load shelf"}
          </p>
        ) : !(shelf.data ?? []).some((s) => s.missions.length > 0) ? (
          <p className="cc-muted">
            No attached missions yet. Start a one-liner from{" "}
            <Link to="/command" hash="supervised-brief" className="underline">
              Overview
            </Link>{" "}
            — the project shelf fills as beats complete.
          </p>
        ) : (
          <ul className="ps-project-shelf">
            {(shelf.data ?? [])
              .filter((s) => s.missions.length > 0)
              .map((s) => (
                <li key={s.projectId} className="ps-project-shelf-item">
                  <div className="ps-project-shelf-head">
                    <strong>{s.name}</strong>
                    <span className="cc-muted text-sm">
                      {s.missions.length} mission{s.missions.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  {s.description ? <p className="cc-muted text-sm">{s.description}</p> : null}
                  <ul className="ps-project-shelf-missions">
                    {s.missions.map((m) => (
                      <li key={m.missionId}>
                        <Link
                          to="/command/supervised/$missionId"
                          params={{ missionId: m.missionId }}
                          className="ps-project-shelf-mission"
                        >
                          <strong>{m.question}</strong>
                          <span className="cc-muted text-xs">Stage: {m.stage}</span>
                        </Link>
                        {m.artefacts.length > 0 ? (
                          <ul className="ps-project-shelf-artefacts">
                            {m.artefacts.map((a) => (
                              <li key={`${m.missionId}-${a.kind}-${a.title}`}>
                                <span>{a.title}</span>
                                <span className="ps-honesty-badges">
                                  <span>{a.honesty}</span>
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="cc-muted text-xs">No completed artefacts yet.</p>
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
                        ) : null}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/command/product-memory/$projectId"
                    params={{ projectId: s.projectId }}
                    className="cc-btn cc-btn-secondary mt-2 inline-flex"
                  >
                    Open product memory
                  </Link>
                </li>
              ))}
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
              Command Centre
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
                    <Link to="/command" className="cc-btn cc-btn-secondary">
                      New mission
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </CommandShell>
  );
}
