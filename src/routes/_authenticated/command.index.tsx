import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CommandShell } from "@/components/command/command-shell";
import { CommandLegacyPlanner } from "@/components/command/command-legacy-planner";
import { ExecutiveStudioDashboard } from "@/components/command/executive-studio-dashboard";
import { commandCentreBootstrapQuery } from "@/lib/workforce-queries";

export const Route = createFileRoute("/_authenticated/command/")({
  head: () => ({
    meta: [
      { title: "Studio — DeliverX" },
      {
        name: "description",
        content:
          "DeliverX Studio executive dispatch — attention, running cases, and honest handoff inspection from saved records.",
      },
    ],
  }),
  component: CommandHome,
});

function CommandHome() {
  const { data, isFetching, refetch } = useQuery(commandCentreBootstrapQuery);
  const [legacyOpen, setLegacyOpen] = useState(false);

  return (
    <CommandShell
      title="Studio"
      hideHeading
      foyerMode
      usage={
        data
          ? {
              consumed: data.workspace.usageConsumed,
              ceiling: data.workspace.usageCeiling,
            }
          : undefined
      }
    >
      <ExecutiveStudioDashboard />

      <details
        className="ps-legacy ps-foyer-advanced ps-foyer-below-fold"
        onToggle={(event) => setLegacyOpen((event.currentTarget as HTMLDetailsElement).open)}
      >
        <summary>Advanced · specialist planner &amp; mission ledger</summary>
        {legacyOpen ? (
          data ? (
            <CommandLegacyPlanner data={data} />
          ) : (
            <p className="cc-muted text-sm mt-3" role="status">
              {isFetching ? "Loading planner data…" : "Planner could not load. "}
              {!isFetching ? (
                <button
                  type="button"
                  className="cc-btn cc-btn-ghost"
                  onClick={() => void refetch()}
                >
                  Retry
                </button>
              ) : null}
            </p>
          )
        ) : null}
      </details>
    </CommandShell>
  );
}
