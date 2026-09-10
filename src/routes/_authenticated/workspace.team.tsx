import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Copy, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { WorkspaceShell, WorkspaceCard } from "@/components/workspace/workspace-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { teamQuery, workspaceBootstrapQuery } from "@/lib/workspace-queries";
import {
  inviteMember,
  removeMember,
  renewInvitation,
  revokeInvitation,
  updateMemberRole,
} from "@/lib/workspace.functions";

export const Route = createFileRoute("/_authenticated/workspace/team")({
  loader: async ({ context }) => {
    const bootstrap = await context.queryClient.ensureQueryData(workspaceBootstrapQuery);
    if (bootstrap.organisation) {
      await context.queryClient.ensureQueryData(teamQuery(bootstrap.organisation.id));
    }
    return null;
  },
  component: TeamPage,
});

function inviteUrl(token: string) {
  if (typeof window === "undefined") return `/invite/${token}`;
  return `${window.location.origin}/invite/${token}`;
}

function TeamPage() {
  const { data: bootstrap } = useSuspenseQuery(workspaceBootstrapQuery);
  const organisationId = bootstrap.organisation?.id;

  if (!organisationId) {
    return (
      <WorkspaceShell title="Team">
        <WorkspaceCard title="No organisation yet" description="Create one first from the overview." />
      </WorkspaceShell>
    );
  }

  return <TeamContent organisationId={organisationId} />;
}

function TeamContent({ organisationId }: { organisationId: string }) {
  const query = teamQuery(organisationId);
  const { data } = useSuspenseQuery(query);
  const queryClient = useQueryClient();

  const invite = useServerFn(inviteMember);
  const revoke = useServerFn(revokeInvitation);
  const renew = useServerFn(renewInvitation);
  const changeRole = useServerFn(updateMemberRole);
  const remove = useServerFn(removeMember);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["workspace"] });

  const inviteMutation = useMutation({
    mutationFn: () => invite({ data: { organisationId, email, role } }),
    onSuccess: async (row) => {
      setEmail("");
      await refresh();
      toast.success(`Invitation created for ${row.email}`, {
        description: "Copy the link and send it to them.",
        action: {
          label: "Copy link",
          onClick: () => void navigator.clipboard.writeText(inviteUrl(row.token)),
        },
      });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const simple = (fn: () => Promise<unknown>, message: string) =>
    fn()
      .then(async () => {
        await refresh();
        toast.success(message);
      })
      .catch((error: Error) => toast.error(error.message));

  return (
    <WorkspaceShell title="Team" subtitle="Who is in this organisation, and who has been invited.">
      {data.canManage ? (
        <WorkspaceCard title="Invite someone" description="They join as soon as they accept the invitation.">
          <form
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              inviteMutation.mutate();
            }}
          >
            <div className="flex-1 space-y-2">
              <Label htmlFor="inviteEmail">Email address</Label>
              <Input
                id="inviteEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teammate@company.com"
                required
              />
            </div>
            <div className="space-y-2 sm:w-40">
              <Label htmlFor="inviteRole">Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as "admin" | "member")}>
                <SelectTrigger id="inviteRole">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={inviteMutation.isPending || !email.trim()}>
              {inviteMutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Send invite
            </Button>
          </form>
          <p className="mt-3 text-xs text-[var(--mkt-text2)]">
            Invitation emails aren't sent yet — copy the link and share it directly.
          </p>
        </WorkspaceCard>
      ) : null}

      <WorkspaceCard title={`Members (${data.members.length})`}>
        <ul className="divide-y divide-[var(--mkt-border)]">
          {data.members.map((member) => (
            <li key={member.id} className="flex flex-wrap items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{member.name ?? "Pending profile"}</p>
                <p className="truncate text-xs text-[var(--mkt-text2)]">
                  {member.headline ?? "No headline yet"}
                </p>
              </div>
              {member.isOwner || !data.canManage ? (
                <span className="rounded-full bg-[var(--mkt-s2)] px-3 py-1 text-xs font-medium capitalize">
                  {member.role}
                </span>
              ) : (
                <>
                  <Select
                    value={member.role === "admin" ? "admin" : "member"}
                    onValueChange={(v) =>
                      void simple(
                        () =>
                          changeRole({
                            data: { membershipId: member.id, role: v as "admin" | "member" },
                          }),
                        "Role updated",
                      )
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Remove member"
                    onClick={() =>
                      void simple(
                        () => remove({ data: { membershipId: member.id } }),
                        "Member removed",
                      )
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>
      </WorkspaceCard>

      {data.canManage ? (
        <WorkspaceCard title={`Pending invitations (${data.invitations.length})`}>
          {data.invitations.length === 0 ? (
            <p className="text-sm text-[var(--mkt-text2)]">No invitations waiting.</p>
          ) : (
            <ul className="divide-y divide-[var(--mkt-border)]">
              {data.invitations.map((inv) => (
                <li key={inv.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{inv.email}</p>
                    <p className="text-xs text-[var(--mkt-text2)]">
                      {inv.role} · expires {new Date(inv.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      void navigator.clipboard.writeText(inviteUrl(inv.token));
                      toast.success("Invite link copied");
                    }}
                  >
                    <Copy className="mr-2 size-4" /> Copy link
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      void simple(
                        () => renew({ data: { invitationId: inv.id } }),
                        "Invitation extended by 14 days",
                      )
                    }
                  >
                    <RefreshCw className="mr-2 size-4" /> Renew
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      void simple(
                        () => revoke({ data: { invitationId: inv.id } }),
                        "Invitation revoked",
                      )
                    }
                  >
                    <Trash2 className="mr-2 size-4" /> Revoke
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </WorkspaceCard>
      ) : null}
    </WorkspaceShell>
  );
}
