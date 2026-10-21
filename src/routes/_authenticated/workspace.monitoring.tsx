import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { WorkspaceCard, WorkspaceShell } from "@/components/workspace/workspace-shell";
import { monitoringOverviewQuery } from "@/lib/monitoring-queries";

export const Route = createFileRoute("/_authenticated/workspace/monitoring")({
  component: MonitoringPage,
});

const KIND_LABEL: Record<string, string> = {
  uptime_check: "Uptime checks",
  journey_error: "Broken journeys",
  client_error: "Browser errors",
  server_error: "Server errors",
  payment_failure: "Payment failures",
};

const SEVERITY_STYLE: Record<string, string> = {
  info: "text-[var(--mkt-text2)]",
  warning: "text-amber-700",
  error: "text-red-700",
  critical: "text-red-800 font-semibold",
};

function formatTime(value: string) {
  return new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

function MonitoringPage() {
  const { data, isLoading, isError, refetch } = useQuery(monitoringOverviewQuery);

  return (
    <WorkspaceShell
      title="Monitoring"
      subtitle="Uptime checks, broken journeys, payment failures and critical browser errors from the live site."
    >
      {isLoading ? (
        <WorkspaceCard title="Loading" description="Reading the latest recorded events." >
          <div className="h-24 animate-pulse rounded bg-black/5" />
        </WorkspaceCard>
      ) : isError ? (
        <WorkspaceCard title="Could not load monitoring" description="Nothing was changed.">
          <button className="text-sm underline" onClick={() => void refetch()}>
            Try again
          </button>
        </WorkspaceCard>
      ) : !data?.canView ? (
        <WorkspaceCard
          title="Not available for your account"
          description="Monitoring is limited to platform administrators."
        >
          <p className="text-sm text-[var(--mkt-text2)]">
            Ask an administrator if you need access to the live health record.
          </p>
        </WorkspaceCard>
      ) : (
        <div className="grid gap-5">
          <WorkspaceCard
            title="Last uptime check"
            description="Recorded by the scheduled probe that loads the public journeys and the health endpoint."
          >
            {data.lastUptimeCheck ? (
              <div className="text-sm">
                <p className={SEVERITY_STYLE[data.lastUptimeCheck.severity] ?? ""}>
                  {data.lastUptimeCheck.message}
                </p>
                <p className="mt-1 text-xs text-[var(--mkt-text2)]">
                  {formatTime(data.lastUptimeCheck.occurred_at)}
                </p>
              </div>
            ) : (
              <p className="text-sm text-[var(--mkt-text2)]">
                No check recorded yet. The probe records a row on every run.
              </p>
            )}
          </WorkspaceCard>

          <WorkspaceCard title="Recent volume" description="Counts across the latest 200 recorded events.">
            {data.counts.length === 0 ? (
              <p className="text-sm text-[var(--mkt-text2)]">Nothing recorded yet.</p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {data.counts.map((row) => (
                  <li key={row.kind} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                    <span>{KIND_LABEL[row.kind] ?? row.kind}</span>
                    <span className="font-semibold">{row.total}</span>
                  </li>
                ))}
              </ul>
            )}
          </WorkspaceCard>

          <WorkspaceCard title="Event log" description="Newest first. Records cannot be edited or deleted.">
            {data.events.length === 0 ? (
              <p className="text-sm text-[var(--mkt-text2)]">Nothing recorded yet.</p>
            ) : (
              <ul className="grid gap-3">
                {data.events.map((event) => (
                  <li key={event.id} className="rounded border px-3 py-2 text-sm">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--mkt-text2)]">
                      <span>{formatTime(event.occurred_at)}</span>
                      <span>·</span>
                      <span>{KIND_LABEL[event.kind] ?? event.kind}</span>
                      <span>·</span>
                      <span className={SEVERITY_STYLE[event.severity] ?? ""}>{event.severity}</span>
                      {event.route ? (
                        <>
                          <span>·</span>
                          <span>{event.route}</span>
                        </>
                      ) : null}
                      <span>·</span>
                      <span>{event.environment}</span>
                    </div>
                    <p className="mt-1">{event.message}</p>
                  </li>
                ))}
              </ul>
            )}
          </WorkspaceCard>
        </div>
      )}
    </WorkspaceShell>
  );
}
