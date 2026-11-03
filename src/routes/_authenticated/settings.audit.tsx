import { createFileRoute } from "@tanstack/react-router";
import { AuditLogPage } from "@/components/settings/audit-log-page";

export const Route = createFileRoute("/_authenticated/settings/audit")({
  head: () => ({
    meta: [{ title: "Audit log — Settings — DeliverX" }, { name: "robots", content: "noindex" }],
  }),
  component: AuditLogPage,
});
