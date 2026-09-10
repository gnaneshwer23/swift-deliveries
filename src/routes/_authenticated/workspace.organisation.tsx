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
import { Textarea } from "@/components/ui/textarea";
import { workspaceBootstrapQuery } from "@/lib/workspace-queries";
import { updateOrganisation } from "@/lib/workspace.functions";

export const Route = createFileRoute("/_authenticated/workspace/organisation")({
  head: () => ({ meta: [{ title: "Organisation Settings — DeliverX" }, { name: "description", content: "Manage your organisation details and shared workspace identity." }, { property: "og:title", content: "Organisation Settings — DeliverX" }, { property: "og:description", content: "Manage your DeliverX organisation." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(workspaceBootstrapQuery),
  component: OrganisationPage,
});

function OrganisationPage() {
  const { data } = useSuspenseQuery(workspaceBootstrapQuery);
  const queryClient = useQueryClient();
  const save = useServerFn(updateOrganisation);
  const canManage = data.role === "owner" || data.role === "admin";

  const [name, setName] = useState(data.organisation?.name ?? "");
  const [description, setDescription] = useState(data.organisation?.description ?? "");
  const [website, setWebsite] = useState(data.organisation?.website ?? "");

  const mutation = useMutation({
    mutationFn: () =>
      save({
        data: {
          organisationId: data.organisation!.id,
          name,
          description,
          website,
        },
      }),
    onSuccess: async () => {
      toast.success("Organisation updated");
      await queryClient.invalidateQueries({ queryKey: ["workspace"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!data.organisation) {
    return (
      <WorkspaceShell
        title="Organisation"
        subtitle="Optional. Add one when you want to capture observed work alongside colleagues."
      >
        <WorkspaceCard
          title="Create an organisation"
          description="You own it, and you can invite your team afterwards."
        >
          <form
            className="max-w-2xl space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="newOrgName">Name</Label>
              <Input
                id="newOrgName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Northwind Product"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newOrgDesc">What does it do?</Label>
              <Textarea
                id="newOrgDesc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newOrgSite">Website (optional)</Label>
              <Input
                id="newOrgSite"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            <Button type="submit" disabled={createMutation.isPending || name.trim().length < 2}>
              {createMutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Create organisation
            </Button>
          </form>
        </WorkspaceCard>
      </WorkspaceShell>
    );
  }



  return (
    <WorkspaceShell
      title="Organisation"
      subtitle={canManage ? "Owners and admins can edit these details." : "Only owners and admins can edit these details."}
    >
      <WorkspaceCard title="Details">
        <form
          className="max-w-2xl space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="orgName">Name</Label>
            <Input
              id="orgName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!canManage}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="orgDesc">Description</Label>
            <Textarea
              id="orgDesc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!canManage}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="orgSite">Website</Label>
            <Input
              id="orgSite"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              disabled={!canManage}
              placeholder="https://example.com"
            />
          </div>
          <p className="text-xs text-[var(--mkt-text2)]">Handle: {data.organisation.slug}</p>
          {canManage ? (
            <Button type="submit" disabled={mutation.isPending || !name.trim()}>
              {mutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Save changes
            </Button>
          ) : null}
        </form>
      </WorkspaceCard>
    </WorkspaceShell>
  );
}
