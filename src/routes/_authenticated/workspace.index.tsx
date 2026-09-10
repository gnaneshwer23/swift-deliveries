import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { ArrowRight, Users, UserCircle, Building2 } from "lucide-react";
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
      title={`Good to see you, ${name}`}
      subtitle={`${data.organisation.name} · you are ${data.role === "owner" ? "the owner" : `a ${data.role ?? "member"}`}`}
    >
      <div className="grid border-l border-t border-[var(--mkt-border)] sm:grid-cols-3">
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
            className="inline-flex items-center gap-2 bg-[var(--mkt-text1)] px-4 py-3 text-xs font-bold uppercase text-[var(--mkt-on-dark)] hover:bg-[var(--mkt-green)]"
          >
            Manage team <ArrowRight className="size-3.5" />
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
            className="inline-flex items-center gap-2 border border-[var(--mkt-border-l)] px-4 py-3 text-xs font-bold uppercase text-[var(--mkt-text1)] hover:bg-[var(--mkt-s2)]"
          >
            Edit profile <ArrowRight className="size-3.5" />
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
    <div className="min-w-0 border-b border-r border-[var(--mkt-border)] bg-[var(--mkt-s1)] p-5 sm:min-h-40">
      <div className="flex items-center justify-between gap-2 font-mono text-[0.625rem] font-bold uppercase text-[var(--mkt-green-m)]">
        {label}
        <Icon className="size-4" />
      </div>
      <p className="mt-12 truncate font-serif text-xl font-black uppercase capitalize">{value}</p>
    </div>
  );
}
