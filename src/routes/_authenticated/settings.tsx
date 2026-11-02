import { createFileRoute } from "@tanstack/react-router";
import { SettingsShell } from "@/components/settings/settings-shell";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [{ title: "Settings — DeliverX" }, { name: "robots", content: "noindex" }],
  }),
  component: SettingsShell,
});
