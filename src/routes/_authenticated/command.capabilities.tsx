import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CommandShell } from "@/components/command/command-shell";
import { AgentNetworkExplorer } from "@/components/command/agent-network-explorer";
import { AgentOffice } from "@/components/command/agent-office";
import { MissionCastPanel } from "@/components/command/mission-cast-panel";
import { commandCentreBootstrapQuery } from "@/lib/workforce-queries";
import { getSupervisedMissionHome } from "@/lib/pilot-mission.functions";
import { pickCurrentMission } from "@/lib/workspace-attention";

export const Route = createFileRoute("/_authenticated/command/capabilities")({
  head: () => ({
    meta: [
      { title: "Specialists — DeliverX Studio" },
      {
        name: "description",
        content:
          "Who owns the case on stage. Living desks when work is running. Catalogue stays secondary.",
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
  const supervised = useQuery({
    queryKey: ["supervised", "home"],
    queryFn: () => getSupervisedMissionHome(),
  });
  const data = boot.data;
  const hasWorkforceActivity = Boolean(
    data && (data.recentMissions.length > 0 || data.recentTasks.length > 0),
  );
  const hasSupervisedCase = Boolean(
    supervised.data?.ready && pickCurrentMission(supervised.data.missions),
  );

  return (
    <CommandShell
      title="Specialists"
      hideHeading
      networkMode
      usage={
        data
          ? { consumed: data.workspace.usageConsumed, ceiling: data.workspace.usageCeiling }
          : undefined
      }
    >
      <div className="ps-room ps-room-cast ps-shell-room">
        <header className="ps-room-stage" aria-label="Specialists">
          <p className="ps-foyer-brand">DeliverX Studio</p>
          <p className="ps-foyer-act">Specialists</p>
          <h1 className="ps-foyer-headline">
            {hasSupervisedCase ? "Who owns this case" : "Cast for the case on stage"}
          </h1>
          <p className="ps-foyer-lede">
            {hasSupervisedCase
              ? "Named specialists on the active investigation. Open the briefing theatre to watch the beats."
              : "Brief a product question first. The cast appears when a case is on stage — not from browsing 150 roles."}
          </p>
        </header>

        <MissionCastPanel />

        <section id="agents-office" className="ps-room-section" aria-label="Agents office">
          {hasWorkforceActivity && data ? (
            <>
              <header className="ps-room-stage">
                <p className="ps-foyer-act">Living desks</p>
                <h2 className="ps-room-subhead">Work in motion</h2>
                <p className="ps-foyer-lede">
                  Desks update from real specialist-mission tasks — not a catalogue map.
                </p>
              </header>
              <AgentOffice
                missions={data.recentMissions}
                tasks={data.recentTasks}
                tasksUnavailable={data.recentTasksUnavailable}
                usage={{
                  consumed: data.workspace.usageConsumed,
                  ceiling: data.workspace.usageCeiling,
                }}
              />
            </>
          ) : (
            <div className="ps-office-quiet">
              <p className="ps-foyer-act">Living desks</p>
              <h2 className="ps-room-subhead">Quiet until work is running</h2>
              <p className="ps-foyer-lede">
                We do not show empty desks or zero counters. When a specialist mission is executing,
                this floor lights up from persisted task events.
              </p>
              <div className="ps-foyer-cta">
                <Link to="/command" hash="supervised-brief" className="cc-btn cc-btn-secondary">
                  Brief a case on Overview
                </Link>
                {hasSupervisedCase ? (
                  <a href="#cast-on-stage" className="cc-btn cc-btn-ghost">
                    Back to cast
                  </a>
                ) : null}
              </div>
            </div>
          )}
        </section>

        <details id="an-catalogue" className="ps-catalogue-fold ps-room-section">
          <summary>
            Explore the bench · 150 catalogue roles
            <span className="cc-muted"> — Available vs Planned, secondary</span>
          </summary>
          <div className="ps-catalogue-fold-body">
            <p className="ps-foyer-lede">
              Browse the wider bench when you need it. Planned roles stay labelled — they never
              pretend to run. This is not the default story of the Studio.
            </p>
            <AgentNetworkExplorer />
          </div>
        </details>
      </div>
    </CommandShell>
  );
}
