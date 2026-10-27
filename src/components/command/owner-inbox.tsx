import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Inbox } from "lucide-react";
import { ownerInboxQuery } from "@/lib/workforce-queries";
import { INBOX_KIND_LABELS, type InboxItem } from "@/lib/workforce/owner-inbox";

const since = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

/**
 * Everything waiting on you, across every open mission. Each row is one
 * decision only you can make, and opens the place where you make it.
 */
export function OwnerInbox() {
  const q = useQuery(ownerInboxQuery);
  return (
    <section className="cc-panel" id="owner-inbox" aria-labelledby="owner-inbox-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="owner-inbox-title" className="cc-panel-title mb-0 flex items-center gap-2">
          <Inbox className="size-4" aria-hidden="true" /> Waiting on you
          {q.data?.items.length ? <span className="cc-chip">{q.data.items.length}</span> : null}
        </h2>
        <span className="cc-muted text-xs">
          Read from your open missions. Agents never decide these.
        </span>
      </div>
      <OwnerInboxBody
        state={
          q.isPending
            ? { status: "loading" }
            : q.isError
              ? { status: "error" }
              : { status: "ready", items: q.data.items, truncated: q.data.truncated }
        }
      />
    </section>
  );
}

export type OwnerInboxState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; items: InboxItem[]; truncated: boolean };

export function OwnerInboxBody({ state }: { state: OwnerInboxState }) {
  if (state.status === "loading") return <p className="cc-muted mt-3 text-sm">Loading…</p>;
  if (state.status === "error")
    return (
      <p className="cc-error mt-3" role="alert">
        What's waiting on you couldn't be loaded. Each mission page still shows its own decisions.
      </p>
    );
  const cutOff = state.truncated ? (
    <p className="cc-muted mt-2 text-xs">
      Showing decisions from the 200 longest-waiting open missions only. More recently updated
      missions show their own decisions on their pages.
    </p>
  ) : null;
  if (!state.items.length)
    return (
      <>
        <p className="cc-muted mt-3 text-sm">
          {state.truncated
            ? "Nothing is waiting on you in the 200 longest-waiting open missions."
            : "Nothing is waiting on you."}
        </p>
        {cutOff}
      </>
    );
  return (
    <>
      <ul className="cc-mission-list mt-3">
        {state.items.map((item) => (
          <li key={`${item.kind}-${item.missionId}-${item.taskId ?? ""}`}>
            <Link
              to="/command/missions/$missionId"
              params={{ missionId: item.missionId }}
              {...(item.hash ? { hash: item.hash } : {})}
              className="cc-mission-row"
            >
              <div>
                <strong>{item.action}</strong>
                <span className="cc-muted">
                  {item.missionTitle} · waiting since {since(item.since)}
                </span>
              </div>
              <span className="cc-chip">{INBOX_KIND_LABELS[item.kind]}</span>
            </Link>
          </li>
        ))}
      </ul>
      {cutOff}
    </>
  );
}
