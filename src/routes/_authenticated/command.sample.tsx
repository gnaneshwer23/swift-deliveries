import { createFileRoute } from "@tanstack/react-router";
import { CommandShell } from "@/components/command/command-shell";
import { SampleProjectView } from "@/components/command/sample-project-view";

export const Route = createFileRoute("/_authenticated/command/sample")({
  head: () => ({
    meta: [{ title: "Sample project — DeliverX" }, { name: "robots", content: "noindex" }],
  }),
  component: () => (
    <CommandShell title="Sample project" hideHeading>
      <SampleProjectView />
    </CommandShell>
  ),
});
