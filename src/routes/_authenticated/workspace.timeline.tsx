import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { WorkspaceCard, WorkspaceShell } from "@/components/workspace/workspace-shell";
import { workspaceFeedQuery } from "@/lib/career-queries";

export const Route = createFileRoute("/_authenticated/workspace/timeline")({
  head: () => ({
    meta: [
      { title: "Timeline — DeliverX Workspace" },
      {
        name: "description",
        content: "A dated record of your evidence, capability judgements, coach confirmations and external verifications.",
      },
      { property: "og:title", content: "Timeline — DeliverX Workspace" },
      { property: "og:description", content: "What you did, when it was recorded, and how strongly it counts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(workspaceFeedQuery),
  component: TimelinePage,
});

function TimelinePage() {
  const { data } = useSuspenseQuery(workspaceFeedQuery);
  return (
    <WorkspaceShell
      title="Timeline"
      subtitle="Every entry is dated and traceable. Coach confirmation and external verification are shown separately."
    >
      <WorkspaceCard
        title="Recorded history"
        description="Built from your evidence record. Entries here cannot be edited or removed."
      >
        {data.timeline.length ? (
          <ol className="grid gap-3">
            {data.timeline.map((item) => (
              <li key={item.id} className="rounded-lg border p-4" style={{ borderColor: "var(--x-border)" }}>
                <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.12em]" style={{ color: "var(--x-slate-light)" }}>
                  <span>{new Date(item.at).toLocaleDateString("en-GB")}</span>
                  <span>·</span>
                  <span>{item.kind}</span>
                </div>
                <p className="mt-2 text-[13px] font-semibold">{item.title}</p>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--x-slate-light)" }}>
                  {item.detail}
                </p>
                <Link to={item.href} className="mt-3 inline-block text-xs font-semibold underline">
                  Open record
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-xs" style={{ color: "var(--x-slate-light)" }}>
            Nothing recorded yet. Your first Experience submission starts this history.
          </p>
        )}
      </WorkspaceCard>
    </WorkspaceShell>
  );
}
