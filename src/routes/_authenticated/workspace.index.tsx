import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Users, UserCircle, Building2 } from "lucide-react";
import { WorkspaceShell, WorkspaceCard } from "@/components/workspace/workspace-shell";
import { workspaceBootstrapQuery } from "@/lib/workspace-queries";

export const Route = createFileRoute("/_authenticated/workspace/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(workspaceBootstrapQuery),
  component: WorkspaceHome,
});

function WorkspaceHome() {
  const { data } = useSuspenseQuery(workspaceBootstrapQuery);
  const navigate = useNavigate();

  useEffect(() => {
    if (!data.organisation) navigate({ to: "/onboarding", replace: true });
  }, [data.organisation, navigate]);

  if (!data.organisation) return null;

  const name = data.profile?.display_name || data.profile?.full_name || "there";

  return (
    <WorkspaceShell
      title={`Hello, ${name}`}
      subtitle={`${data.organisation.name} · you are ${data.role === "owner" ? "the owner" : `a ${data.role ?? "member"}`}`}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Organisation" value={data.organisation.name} icon={Building2} />
        <StatCard label="Active members" value={String(data.memberCount)} icon={Users} />
        <StatCard
          label="Your role"
          value={data.role ?? "member"}
          icon={UserCircle}
        />
      </div>

      <WorkspaceCard
        title="Invite your team"
        description="Bring the people you work with into this organisation so you share the same workspace."
        action={
          <Link
            to="/workspace/team"
            className="rounded-full bg-[var(--mkt-green)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--mkt-green-m)]"
          >
            Manage team
          </Link>
        }
      />

      <WorkspaceCard
        title="Finish your profile"
        description={
          data.profile?.headline
            ? "Your profile is set up. Keep it current as your role changes."
            : "Add a headline so teammates know what you do."
        }
        action={
          <Link
            to="/workspace/profile"
            className="rounded-full border border-[var(--mkt-border)] px-4 py-2 text-sm font-medium text-[var(--mkt-text1)] hover:bg-[var(--mkt-s2)]"
          >
            Edit profile
          </Link>
        }
      />

      <WorkspaceCard
        title="Projects"
        description="Project workspaces, charters and delivery boards arrive in the next step. Nothing to see here yet."
      />
    </WorkspaceShell>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Users;
}) {
  return (
    <div className="rounded-2xl border border-[var(--mkt-border)] bg-[var(--mkt-s1)] p-5">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-[var(--mkt-text2)]">
        <Icon className="size-4" />
        {label}
      </div>
      <p className="mt-3 truncate text-lg font-semibold capitalize">{value}</p>
    </div>
  );
}
