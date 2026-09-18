import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { WorkspaceCard, WorkspaceShell } from "@/components/workspace/workspace-shell";
import { workspaceFeedQuery } from "@/lib/career-queries";

export const Route = createFileRoute("/_authenticated/workspace/inbox")({
  head: () => ({
    meta: [
      { title: "Inbox — DeliverX Workspace" },
      {
        name: "description",
        content: "Everything waiting on you: AI drafts to review, blocked work, coach decisions and application next steps.",
      },
      { property: "og:title", content: "Inbox — DeliverX Workspace" },
      { property: "og:description", content: "One list of what is waiting on your decision." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(workspaceFeedQuery),
  component: InboxPage,
});

function InboxPage() {
  const { data } = useSuspenseQuery(workspaceFeedQuery);
  return (
    <WorkspaceShell title="Inbox" subtitle="Only items that need a decision from you. Nothing here acts on its own.">
      <WorkspaceCard
        title={`Waiting on you (${data.inbox.length})`}
        description="Built from your own records. Reading this page changes nothing."
      >
        {data.inbox.length ? (
          <ul className="grid gap-3">
            {data.inbox.map((item) => (
              <li
                key={item.id}
                className="rounded-lg border p-4"
                style={{ borderColor: "var(--x-border)" }}
              >
                <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.12em]" style={{ color: "var(--x-slate-light)" }}>
                  <span>{item.kind}</span>
                  <span>·</span>
                  <span>{new Date(item.at).toLocaleString("en-GB")}</span>
                </div>
                <p className="mt-2 text-[13px] font-semibold">{item.title}</p>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--x-slate-light)" }}>
                  {item.detail}
                </p>
                <Link to={item.href} className="mt-3 inline-block text-xs font-semibold underline">
                  Open
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs" style={{ color: "var(--x-slate-light)" }}>
            Nothing is waiting on you right now.
          </p>
        )}
      </WorkspaceCard>
    </WorkspaceShell>
  );
}
