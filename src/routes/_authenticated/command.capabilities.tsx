import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CommandShell } from "@/components/command/command-shell";
import { AgentNetworkExplorer } from "@/components/command/agent-network-explorer";
import { AgentOffice } from "@/components/command/agent-office";
import { MissionCastPanel } from "@/components/command/mission-cast-panel";
import { commandCentreBootstrapQuery } from "@/lib/workforce-queries";

export const Route = createFileRoute("/_authenticated/command/capabilities")({
  head: () => ({
    meta: [
      { title: "Specialists & office — DeliverX Studio" },
      {
        name: "description",
        content:
          "Cast for the active mission, agents office for living work, then explore Available vs Planned roles.",
      },
    ],
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(commandCentreBootstrapQuery);
  },
  component: SpecialistsStudio,
});

function SpecialistsStudio() {
  const boot = useQuery(commandCentreBootstrapQuery);
  const data = boot.data;

  return (
    <CommandShell
      title="Specialists"
      subtitle="Cast for the current mission, then the agents office. Catalogue is Explore — Available vs Planned stays honest."
      networkMode
      usage={
        data
          ? { consumed: data.workspace.usageConsumed, ceiling: data.workspace.usageCeiling }
          : undefined
      }
    >
      <MissionCastPanel />

      <section id="agents-office" className="mt-6" aria-label="Agents office">
        <p className="cc-kicker">Agents office</p>
        <h2 className="cc-panel-title">Living desks for this Studio</h2>
        <p className="cc-muted text-sm mb-3">
          First-class Studio surface — desks reflect real missions and tasks. Available roles can
          work today; Planned roles stay labelled until evaluated.
        </p>
        {data ? (
          <AgentOffice
            missions={data.recentMissions}
            tasks={data.recentTasks}
            tasksUnavailable={data.recentTasksUnavailable}
            usage={{
              consumed: data.workspace.usageConsumed,
              ceiling: data.workspace.usageCeiling,
            }}
          />
        ) : (
          <p className="cc-muted">Loading office…</p>
        )}
      </section>

      <div id="an-catalogue" className="mt-8">
        <p className="cc-kicker">Explore the bench</p>
        <h2 className="cc-panel-title">Catalogue · Available and Planned</h2>
        <p className="cc-muted text-sm mb-3">
          Full catalogue browsing is secondary. Counts stay honest — Planned never pretends to be
          runnable.
        </p>
        <AgentNetworkExplorer />
      </div>
    </CommandShell>
  );
}
