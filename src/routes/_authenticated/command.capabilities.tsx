import { createFileRoute } from "@tanstack/react-router";
import { CommandShell } from "@/components/command/command-shell";
import { AgentNetworkExplorer } from "@/components/command/agent-network-explorer";
export const Route = createFileRoute("/_authenticated/command/capabilities")({
  head: () => ({
    meta: [
      { title: "Agent network — DeliverX" },
      {
        name: "description",
        content:
          "Explore the DeliverX specialist network, inspect role capabilities, and follow recorded mission work.",
      },
    ],
  }),
  component: () => (
    <CommandShell title="Agent network" networkMode>
      <AgentNetworkExplorer />
    </CommandShell>
  ),
});
