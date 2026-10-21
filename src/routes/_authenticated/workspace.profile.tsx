import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { WorkspaceShell, WorkspaceCard } from "@/components/workspace/workspace-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { workspaceBootstrapQuery } from "@/lib/workspace-queries";
import { updateProfile } from "@/lib/workspace.functions";

export const Route = createFileRoute("/_authenticated/workspace/profile")({
  head: () => ({ meta: [{ title: "Your Profile — DeliverX" }, { name: "description", content: "Manage how your professional profile appears to your organisation." }, { property: "og:title", content: "Your Profile — DeliverX" }, { property: "og:description", content: "Manage your DeliverX professional profile." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(workspaceBootstrapQuery),
  component: ProfilePage,
});

function ProfilePage() {
  const { data } = useSuspenseQuery(workspaceBootstrapQuery);
  const queryClient = useQueryClient();
  const save = useServerFn(updateProfile);

  const [fullName, setFullName] = useState(data.profile?.full_name ?? "");
  const [displayName, setDisplayName] = useState(data.profile?.display_name ?? "");
  const [headline, setHeadline] = useState(data.profile?.headline ?? "");

  const mutation = useMutation({
    mutationFn: () => save({ data: { fullName, displayName, headline } }),
    onSuccess: async () => {
      toast.success("Profile saved");
      await queryClient.invalidateQueries({ queryKey: ["workspace"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <WorkspaceShell title="Your profile" subtitle="How you appear to the rest of your organisation.">
      <WorkspaceCard title="Details">
        <form
          className="max-w-2xl space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={data.email ?? ""} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="displayName">Display name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="What people call you"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="headline">Headline</Label>
            <Input
              id="headline"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="Senior Product Manager, Payments"
            />
          </div>
          <Button type="submit" disabled={mutation.isPending || !fullName.trim()}>
            {mutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Save changes
          </Button>
        </form>
      </WorkspaceCard>
    </WorkspaceShell>
  );
}
