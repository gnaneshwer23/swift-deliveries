import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CommandShell } from "@/components/command/command-shell";
import { commandCentreBootstrapQuery, wfProjectsQuery } from "@/lib/workforce-queries";
import { createWfProject } from "@/lib/workforce.functions";

export const Route = createFileRoute("/_authenticated/command/projects")({
  head: () => ({
    meta: [
      { title: "Projects — Command Centre — DeliverX" },
      { name: "description", content: "Create and list workforce projects for supervised missions." },
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
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Create failed"),
  });

  const usage = bootstrap.data
    ? {
        consumed: bootstrap.data.workspace.usageConsumed,
        ceiling: bootstrap.data.workspace.usageCeiling,
      }
    : undefined;

  return (
    <CommandShell
      title="Projects"
      subtitle="Containers for related Investigate / Prototype / Improve missions"
      usage={usage}
    >
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
            {projects.data.map((p) => (
              <li key={p.id} className="cc-mission-row static">
                <div>
                  <strong>{p.name}</strong>
                  <span className="cc-muted">
                    {p.description || "No description"} · created{" "}
                    {new Date(p.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <Link to="/command" className="cc-btn cc-btn-secondary">
                  New mission
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </CommandShell>
  );
}
