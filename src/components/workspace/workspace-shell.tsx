import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  FileCheck2,
  Gauge,
  LayoutDashboard,
  User as UserIcon,
  Users,
  GraduationCap,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { MarketingLogo } from "@/components/marketing/marketing-logo";
import { useSignOut } from "@/hooks/use-sign-out";
import { coachingWorkspaceQuery } from "@/lib/coaching-queries";

const NAV = [
  { to: "/workspace", label: "Overview", icon: LayoutDashboard },
  { to: "/workspace/evidence", label: "Evidence", icon: FileCheck2 },
  { to: "/workspace/capability", label: "Capability", icon: Gauge },
  { to: "/workspace/team", label: "Team", icon: Users },
  { to: "/workspace/profile", label: "Your profile", icon: UserIcon },
  { to: "/workspace/organisation", label: "Organisation", icon: Building2 },
] as const;

export function WorkspaceShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const signOut = useSignOut();
  const { data: coaching } = useQuery(coachingWorkspaceQuery);
  const nav = coaching?.hasEnabledProgramme || coaching?.isCoach
    ? [...NAV.slice(0, 2), { to: "/workspace/coaching" as const, label: "Coaching", icon: GraduationCap }, ...NAV.slice(2)]
    : NAV;

  return (
    <div className="workspace-page min-h-screen bg-[var(--mkt-ink)] font-sans text-[var(--mkt-text1)]">
      <header className="px-3 pt-3">
        <div className="mx-auto flex h-[var(--mkt-navh)] max-w-[var(--mkt-maxw)] items-center justify-between rounded-[1.1rem] border border-[var(--mkt-border)] bg-[var(--mkt-s1)] px-5 shadow-[var(--mkt-shadow-nav)]">
          <MarketingLogo />
          <button
            type="button"
            onClick={() => void signOut()}
            className="rounded-lg border border-[var(--mkt-border-l)] px-4 py-2 text-xs font-semibold text-[var(--mkt-text2)] transition-colors hover:bg-[var(--mkt-s2)] hover:text-[var(--mkt-green)]"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="mx-auto mt-4 grid max-w-[var(--mkt-maxw)] gap-4 px-3 pb-8 md:min-h-[calc(100vh-var(--mkt-navh)-2rem)] md:grid-cols-[14rem_minmax(0,1fr)]">
        <aside className="overflow-hidden rounded-xl border border-[var(--mkt-border)] bg-[var(--mkt-s1)] shadow-[var(--mkt-shadow-card)]">
          <p className="hidden border-b border-[var(--mkt-border)] px-5 py-5 font-mono text-[0.625rem] font-bold uppercase text-[var(--mkt-green-m)] md:block">Professional record</p>
        <nav className="flex overflow-x-auto md:flex-col md:overflow-visible">
           {nav.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`group flex shrink-0 items-center gap-3 border-r border-[var(--mkt-border)] px-5 py-4 text-xs font-bold uppercase transition-colors md:border-b md:border-r-0 ${
                  active
                    ? "bg-[var(--mkt-s2)] text-[var(--mkt-green)]"
                    : "text-[var(--mkt-text2)] hover:bg-[var(--mkt-ink)] hover:text-[var(--mkt-text1)]"
                }`}
              >
                <Icon className={`size-4 ${active ? "text-[var(--mkt-green-l)]" : "text-[var(--mkt-green-m)]"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        </aside>

        <main className="min-w-0 overflow-hidden rounded-xl border border-[var(--mkt-border)] bg-[var(--mkt-s1)] shadow-[var(--mkt-shadow-card)]">
          <header className="border-b border-[var(--mkt-border)] p-6 sm:p-8 lg:p-10">
            <p className="mkt-label">Workspace / Current view</p>
            <h1 className="mt-4 max-w-3xl font-display text-3xl font-bold leading-tight sm:text-5xl">{title}</h1>
            {subtitle ? <p className="mt-5 max-w-2xl text-sm leading-relaxed text-[var(--mkt-text2)]">{subtitle}</p> : null}
          </header>
          <div className="space-y-6 p-5 sm:p-8 lg:p-10">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function WorkspaceCard({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-[var(--mkt-border)] bg-[var(--mkt-s1)] shadow-[var(--mkt-shadow-card)]">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 border-b border-[var(--mkt-border)] p-5 sm:p-6">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-bold">{title}</h2>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--mkt-text2)]">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children ? <div className="p-5 sm:p-6">{children}</div> : action ? null : <div className="flex items-center gap-2 p-5 font-mono text-[0.625rem] font-bold uppercase text-[var(--mkt-text3)]"><ArrowRight className="size-3.5" /> Awaiting activity</div>}
    </section>
  );
}
