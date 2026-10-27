import { createFileRoute, Link } from "@tanstack/react-router";
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
      hideHeading
      networkMode
      usage={
        data
          ? { consumed: data.workspace.usageConsumed, ceiling: data.workspace.usageCeiling }
          : undefined
      }
    >
      <div className="ps-room ps-room-wide ps-shell-room">
        <header className="ps-room-stage" aria-label="Specialists">
          <p className="ps-foyer-brand">DeliverX Studio</p>
          <p className="cc-kicker">Specialists</p>
          <h1 className="ps-foyer-headline">Cast for the case on stage</h1>
          <p className="ps-foyer-lede">
            See who owns the current beat, then the agents office for living desks. Catalogue
            browsing stays secondary — Available vs Planned stays honest.
          </p>
          <p className="ps-foyer-side-links">
            <a href="#agents-office">Agents office</a>
            <span aria-hidden="true">·</span>
            <a href="#an-catalogue">Explore the bench</a>
            <span aria-hidden="true">·</span>
            <Link to="/command" hash="supervised-brief">
              Brief a case
            </Link>
          </p>
        </header>

        <MissionCastPanel />

        <section id="agents-office" className="ps-room-section" aria-label="Agents office">
          <header className="ps-room-stage">
            <p className="cc-kicker">Agents office</p>
            <h2 className="ps-foyer-headline" style={{ fontSize: "clamp(1.25rem, 2vw, 1.55rem)" }}>
              Living desks for this Studio
            </h2>
            <p className="ps-foyer-lede">
              Desks reflect real missions and tasks. Available roles can work today; Planned roles
              stay labelled until evaluated.
            </p>
          </header>
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

        <div id="an-catalogue" className="ps-room-section">
          <header className="ps-room-stage">
            <p className="cc-kicker">Explore the bench</p>
            <h2 className="ps-foyer-headline" style={{ fontSize: "clamp(1.25rem, 2vw, 1.55rem)" }}>
              Catalogue · Available and Planned
            </h2>
            <p className="ps-foyer-lede">
              Full catalogue browsing is secondary. Counts stay honest — Planned never pretends to
              be runnable.
            </p>
          </header>
          <AgentNetworkExplorer />
        </div>
      </div>
    </CommandShell>
  );
}
