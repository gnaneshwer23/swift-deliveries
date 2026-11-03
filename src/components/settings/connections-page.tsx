/**
 * Settings → Connections: each outside service DeliverX can use, whether it is set up here,
 * and what your projects do without it. Dated, with the method stated; never a key value.
 */
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { getConnections } from "@/lib/settings/connections.functions";
import { YOUR_ACCOUNTS_NOTE, type ConnectionStatus } from "@/lib/settings/connections";
import "@/styles/connections.css";

const TONE: Record<ConnectionStatus, "ok" | "warn" | "muted"> = {
  on: "ok",
  problem: "warn",
  off: "muted",
};

function checkedLabel(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function ConnectionsPage() {
  const q = useQuery({ queryKey: ["settings", "connections"], queryFn: () => getConnections() });

  return (
    <div className="pf-body">
      <header className="st-head">
        <h1>Connections</h1>
        <p>The outside services DeliverX can use, and what your projects do without each one.</p>
      </header>

      <section className="pf-card cn-accounts" aria-labelledby="cn-accounts">
        <h2 id="cn-accounts">Your accounts</h2>
        <p className="pf-muted">{YOUR_ACCOUNTS_NOTE}</p>
      </section>

      {q.isLoading ? (
        <>
          <p className="prj-sr" role="status">
            Loading connections…
          </p>
          <div className="st-skeleton" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </>
      ) : q.isError || !q.data ? (
        <section className="pf-card" role="alert">
          <h2>Connections couldn’t be loaded</h2>
          <p className="pf-muted">Nothing has changed. Try again in a moment.</p>
          <div className="pf-actions st-actions-left">
            <button type="button" className="pf-btn" onClick={() => void q.refetch()}>
              <RefreshCw size={14} aria-hidden="true" /> Try again
            </button>
          </div>
        </section>
      ) : (
        <section className="pf-card" aria-labelledby="cn-services">
          <h2 id="cn-services">Services</h2>
          <ul className="cn-list">
            {q.data.rows.map((row) => (
              <li key={row.id} className="cn-row">
                <div className="cn-row-top">
                  <h3>{row.name}</h3>
                  <span className="st-pill" data-tone={TONE[row.status]}>
                    {row.label}
                  </span>
                </div>
                <p className="cn-what">{row.what}</p>
                <p className="cn-now">{row.now}</p>
                {row.problem ? (
                  <p className="cn-problem">
                    <b>For whoever runs DeliverX:</b> {row.problem}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
          <p className="cn-method">
            Checked {checkedLabel(q.data.checkedAt)}. {q.data.method}
          </p>
        </section>
      )}
    </div>
  );
}
