import { createFileRoute } from "@tanstack/react-router";
import { CommandShell } from "@/components/command/command-shell";
import { AgentNetworkExplorer } from "@/components/command/agent-network-explorer";
import { MissionCastPanel } from "@/components/command/mission-cast-panel";
export const Route = createFileRoute("/_authenticated/command/capabilities")({
  head: () => ({
    meta: [
      { title: "Specialists — DeliverX" },
      {
        name: "description",
        content:
          "See who is on your active investigation, then explore the wider specialist bench.",
      },
    ],
  }),
  component: () => (
    <CommandShell
      title="Specialists"
      subtitle="Cast for the active mission first. Catalogue is Explore."
      networkMode
    >
      <MissionCastPanel />
      <div id="an-catalogue">
        <AgentNetworkExplorer />
      </div>
    </CommandShell>
  ),
});
