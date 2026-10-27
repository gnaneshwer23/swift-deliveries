import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { History, TriangleAlert } from "lucide-react";
import { CommandShell } from "@/components/command/command-shell";
import { getProductMemory, type ProductMemoryView } from "@/lib/workforce.functions";
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
  const view = query.data;

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

          {groups.length ? (
            groups.map(([kind, entries]) => (
              <section key={kind} className="cc-panel" aria-labelledby={`memory-${kind}`}>
                <h2 id={`memory-${kind}`} className="cc-panel-title">
                  {MEMORY_KIND_LABELS[kind]} ({entries.length})
                </h2>
                <ul className="cc-bullets">
                  {entries.map((e) => (
                    <MemoryRow key={e.id} entry={e} />
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

function MemoryRow({ entry: e }: { entry: Entry }) {
  const date = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  return (
    <li className={e.retiredAt ? "opacity-60" : undefined}>
      {e.refKey && e.kind === "requirement" ? <strong>{e.refKey}: </strong> : null}
      {e.statement}
      {e.citation ? <span className="text-slate-600"> (Source: {e.citation})</span> : null}
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
