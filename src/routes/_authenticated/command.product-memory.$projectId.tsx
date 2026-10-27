import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { GitCompareArrows, History, TriangleAlert } from "lucide-react";
import { CommandShell } from "@/components/command/command-shell";
import {
  flagMemoryConflict,
  getProductMemory,
  resolveMemoryConflict,
  type ProductMemoryView,
} from "@/lib/workforce.functions";
import { MEMORY_KIND_LABELS, MEMORY_KINDS, type MemoryKind } from "@/lib/workforce/product-memory";

const memoryQuery = (projectId: string) => ({
  queryKey: ["command", "product-memory", projectId],
  queryFn: () => getProductMemory({ data: { projectId } }),
});

export const Route = createFileRoute("/_authenticated/command/product-memory/$projectId")({
  head: () => ({
    meta: [
      { title: "Product memory — Command Centre — DeliverX" },
      {
        name: "description",
        content:
          "What the team has learned about one product across missions, with labels and sources.",
      },
    ],
  }),
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(memoryQuery(params.projectId));
  },
  component: ProductMemoryPage,
});

const ORIGIN_LABELS = {
  evidence: "Founder evidence",
  artefact: "Model-written artefact",
  gate: "Founder decision",
} as const;

type Entry = ProductMemoryView["entries"][number];

function ProductMemoryPage() {
  const { projectId } = Route.useParams();
  const query = useQuery(memoryQuery(projectId));
  const [showRetired, setShowRetired] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const view = query.data;
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["command", "product-memory", projectId] });

  const flag = useMutation({
    mutationFn: () =>
      flagMemoryConflict({
        data: {
          projectId,
          entryA: selected[0]!,
          entryB: selected[1]!,
          ...(note.trim() ? { note: note.trim() } : {}),
        },
      }),
    onMutate: () => setError(null),
    onSuccess: async () => {
      setSelected([]);
      setNote("");
      await refresh();
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Could not record the conflict."),
  });

  const openConflictIds = useMemo(() => {
    const ids = new Set<string>();
    for (const c of view?.conflicts ?? []) if (!c.resolvedAt) ids.add(c.entryLow).add(c.entryHigh);
    return ids;
  }, [view]);
  const toggle = (id: string) =>
    setSelected((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : cur.length < 2 ? [...cur, id] : cur,
    );

  const groups = useMemo(() => {
    const by = new Map<MemoryKind, Entry[]>();
    for (const e of view?.entries ?? []) {
      if (e.retiredAt && !showRetired) continue;
      by.set(e.kind, [...(by.get(e.kind) ?? []), e]);
    }
    return MEMORY_KINDS.filter((k) => by.has(k)).map((k) => [k, by.get(k)!] as const);
  }, [view, showRetired]);

  const retiredCount = view?.entries.filter((e) => e.retiredAt).length ?? 0;

  return (
    <CommandShell
      title={view ? `Product memory · ${view.project.name}` : "Product memory"}
      subtitle="What the team has learned about this product across missions. Each entry keeps the label it was written with and where it came from."
    >
      {query.isError ? (
        <section className="cc-panel">
          <p className="cc-error" role="alert">
            {query.error instanceof Error ? query.error.message : "Memory could not be loaded."}
          </p>
        </section>
      ) : !view ? (
        <section className="cc-panel">
          <p className="cc-muted">Loading memory…</p>
        </section>
      ) : !view.available ? (
        <section className="cc-panel">
          <p className="cc-muted">
            Product memory becomes available once its database update is applied.
          </p>
        </section>
      ) : (
        <>
          <section className="cc-panel">
            <p className="text-sm text-slate-600">
              Entries come from three places only: claims and requirements in model-written
              artefacts that passed their checks, your gate decisions, and the evidence you supply.
              Simulated drafts are never remembered. An entry marked <strong>possibly stale</strong>{" "}
              has not been seen for a while or its source was withdrawn; missions are told to check
              it rather than repeat it.
            </p>
            {retiredCount ? (
              <label className="mt-3 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showRetired}
                  onChange={(e) => setShowRetired(e.target.checked)}
                />
                Show {retiredCount} retired {retiredCount === 1 ? "entry" : "entries"}
              </label>
            ) : null}
          </section>

          {view.conflictsAvailable ? (
            <section className="cc-panel" aria-labelledby="memory-conflicts">
              <h2 id="memory-conflicts" className="cc-panel-title flex items-center gap-2">
                <GitCompareArrows className="size-4" aria-hidden /> Conflicting evidence
              </h2>
              <p className="text-sm text-slate-600 mb-3">
                When two entries cannot both be true, tick both and mark them as conflicting. Both
                stay as they are; missions are shown both sides and must say that they conflict
                rather than average them. Resolving records your reasoning and still keeps both.
              </p>
              {selected.length === 2 ? (
                <form
                  className="space-y-2 mb-3"
                  onSubmit={(ev) => {
                    ev.preventDefault();
                    flag.mutate();
                  }}
                >
                  <label className="block text-sm font-medium" htmlFor="conflict-note">
                    Why they conflict <span className="font-normal text-slate-500">(optional)</span>
                  </label>
                  <input
                    id="conflict-note"
                    className="cc-input"
                    maxLength={1000}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="submit"
                      className="cc-btn cc-btn-primary"
                      disabled={flag.isPending}
                    >
                      {flag.isPending ? "Saving…" : "Mark the two ticked entries as conflicting"}
                    </button>
                    <button type="button" className="cc-btn" onClick={() => setSelected([])}>
                      Clear selection
                    </button>
                  </div>
                </form>
              ) : (
                <p className="text-xs text-slate-500 mb-3">
                  {selected.length === 1
                    ? "Tick one more entry."
                    : "Tick two entries below to mark a conflict."}
                </p>
              )}
              {error ? (
                <p className="cc-error" role="alert">
                  {error}
                </p>
              ) : null}
              <ConflictList view={view} projectId={projectId} onChanged={refresh} />
            </section>
          ) : null}

          {groups.length ? (
            groups.map(([kind, entries]) => (
              <section key={kind} className="cc-panel" aria-labelledby={`memory-${kind}`}>
                <h2 id={`memory-${kind}`} className="cc-panel-title">
                  {MEMORY_KIND_LABELS[kind]} ({entries.length})
                </h2>
                <ul className="cc-bullets">
                  {entries.map((e) => (
                    <MemoryRow
                      key={e.id}
                      entry={e}
                      inConflict={openConflictIds.has(e.id)}
                      {...(view.conflictsAvailable && !e.retiredAt && e.kind !== "source"
                        ? { selected: selected.includes(e.id), onToggle: () => toggle(e.id) }
                        : {})}
                    />
                  ))}
                </ul>
              </section>
            ))
          ) : (
            <section className="cc-panel">
              <p className="cc-muted">
                {retiredCount && !showRetired
                  ? "No current entries remain. Show retired entries above to see this product's history."
                  : "Nothing remembered yet. Memory fills in as missions on this product finish model steps, you decide gates, or you add evidence."}
              </p>
            </section>
          )}
        </>
      )}
      <p className="text-sm">
        <Link to="/command/projects" className="underline">
          Back to projects
        </Link>
      </p>
    </CommandShell>
  );
}

const date = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

function entryLabel(e: Entry): string {
  return `${e.refKey && e.kind === "requirement" ? `${e.refKey}: ` : ""}${e.statement}${e.citation ? ` (Source: ${e.citation})` : ""}`;
}

function ConflictList({
  view,
  projectId,
  onChanged,
}: {
  view: ProductMemoryView;
  projectId: string;
  onChanged: () => Promise<unknown>;
}) {
  const byId = new Map(view.entries.map((e) => [e.id, e]));
  const open = view.conflicts.filter((c) => !c.resolvedAt);
  const resolved = view.conflicts.filter((c) => c.resolvedAt);
  if (!view.conflicts.length) return <p className="cc-muted text-sm">No conflicts recorded.</p>;
  return (
    <>
      {open.length ? (
        <ul className="cc-bullets mb-3">
          {open.map((c) => (
            <OpenConflict
              key={c.id}
              conflictId={c.id}
              projectId={projectId}
              a={byId.get(c.entryLow)}
              b={byId.get(c.entryHigh)}
              note={c.note}
              flaggedAt={c.createdAt}
              onChanged={onChanged}
            />
          ))}
        </ul>
      ) : (
        <p className="cc-muted text-sm mb-3">No open conflicts.</p>
      )}
      {resolved.length ? (
        <details>
          <summary className="text-sm cursor-pointer">Resolved ({resolved.length})</summary>
          <ul className="cc-bullets mt-2">
            {resolved.map((c) => {
              const a = byId.get(c.entryLow);
              const b = byId.get(c.entryHigh);
              return (
                <li key={c.id}>
                  {a ? entryLabel(a) : "(entry removed)"} <strong>vs</strong>{" "}
                  {b ? entryLabel(b) : "(entry removed)"}
                  <p className="text-xs text-slate-600">
                    Resolved {c.resolvedAt ? date(c.resolvedAt) : ""}: {c.resolution}
                  </p>
                </li>
              );
            })}
          </ul>
        </details>
      ) : null}
    </>
  );
}

function OpenConflict({
  conflictId,
  projectId,
  a,
  b,
  note,
  flaggedAt,
  onChanged,
}: {
  conflictId: string;
  projectId: string;
  a: Entry | undefined;
  b: Entry | undefined;
  note: string | null;
  flaggedAt: string;
  onChanged: () => Promise<unknown>;
}) {
  const [resolution, setResolution] = useState("");
  const [error, setError] = useState<string | null>(null);
  const resolve = useMutation({
    mutationFn: () =>
      resolveMemoryConflict({ data: { projectId, conflictId, resolution: resolution.trim() } }),
    onMutate: () => setError(null),
    onSuccess: () => onChanged(),
    onError: (e) => setError(e instanceof Error ? e.message : "Could not resolve the conflict."),
  });
  const fieldId = `resolve-${conflictId}`;
  return (
    <li>
      <span className="text-amber-800">
        {a ? entryLabel(a) : "(entry removed)"} <strong>vs</strong>{" "}
        {b ? entryLabel(b) : "(entry removed)"}
      </span>
      <p className="text-xs text-slate-500">
        Marked {date(flaggedAt)}
        {note ? ` — ${note}` : ""}
      </p>
      <form
        className="flex flex-wrap items-end gap-2 mt-1"
        onSubmit={(ev) => {
          ev.preventDefault();
          resolve.mutate();
        }}
      >
        <label className="sr-only" htmlFor={fieldId}>
          How this conflict was resolved
        </label>
        <input
          id={fieldId}
          className="cc-input flex-1 min-w-48"
          placeholder="How it was resolved (both entries are kept)"
          minLength={3}
          maxLength={1000}
          required
          value={resolution}
          onChange={(e) => setResolution(e.target.value)}
        />
        <button type="submit" className="cc-btn" disabled={resolve.isPending}>
          {resolve.isPending ? "Saving…" : "Record resolution"}
        </button>
      </form>
      {error ? (
        <p className="cc-error" role="alert">
          {error}
        </p>
      ) : null}
    </li>
  );
}

function MemoryRow({
  entry: e,
  inConflict,
  selected,
  onToggle,
}: {
  entry: Entry;
  inConflict: boolean;
  selected?: boolean;
  onToggle?: () => void;
}) {
  return (
    <li className={e.retiredAt ? "opacity-60" : undefined}>
      {onToggle ? (
        <input
          type="checkbox"
          className="mr-2 align-middle"
          checked={selected ?? false}
          onChange={onToggle}
          aria-label={`Select “${e.statement}” to mark a conflict`}
        />
      ) : null}
      {e.refKey && e.kind === "requirement" ? <strong>{e.refKey}: </strong> : null}
      {e.statement}
      {e.citation ? <span className="text-slate-600"> (Source: {e.citation})</span> : null}
      {inConflict ? (
        <span className="ml-2 text-xs text-amber-800 font-medium">In conflict</span>
      ) : null}
      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-2">
        <span>{ORIGIN_LABELS[e.originKind]}</span>
        <span>· first seen {date(e.firstSeenAt)}</span>
        {e.timesSeen > 1 ? (
          <span className="inline-flex items-center gap-1">
            · <History className="size-3" aria-hidden /> seen {e.timesSeen} times, last{" "}
            {date(e.lastSeenAt)}
          </span>
        ) : null}
        {e.lastMissionId ? (
          <Link
            to="/command/missions/$missionId"
            params={{ missionId: e.lastMissionId }}
            className="underline"
          >
            mission
          </Link>
        ) : null}
      </div>
      {e.retiredAt ? (
        <p className="text-xs text-slate-500">Retired: {e.retiredReason ?? "no reason recorded"}</p>
      ) : e.staleReason ? (
        <p className="text-xs text-amber-700 flex items-center gap-1">
          <TriangleAlert className="size-3" aria-hidden /> Possibly stale: {e.staleReason}
        </p>
      ) : null}
    </li>
  );
}
