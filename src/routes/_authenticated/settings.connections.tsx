import { createFileRoute } from "@tanstack/react-router";
import { ConnectionsPage } from "@/components/settings/connections-page";

export const Route = createFileRoute("/_authenticated/settings/connections")({
  head: () => ({
    meta: [{ title: "Connections — Settings — DeliverX" }, { name: "robots", content: "noindex" }],
  }),
  component: ConnectionsPage,
});
