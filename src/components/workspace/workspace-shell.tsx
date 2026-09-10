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
} from "lucide-react";
import { MarketingLogo } from "@/components/marketing/marketing-logo";
import { useSignOut } from "@/hooks/use-sign-out";

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

  return (
    <div className="min-h-screen bg-[var(--mkt-ink)] text-[var(--mkt-text1)] [&_button]:rounded-none [&_input]:rounded-none [&_textarea]:rounded-none [&_[role=combobox]]:rounded-none">
      <header className="border-b border-[var(--mkt-border-l)] bg-[var(--mkt-s1)]">
        <div className="mx-auto flex h-[var(--mkt-navh)] max-w-[var(--mkt-maxw)] items-center justify-between border-x border-[var(--mkt-border)] px-5">
          <MarketingLogo />
          <button
            type="button"
            onClick={() => void signOut()}
            className="border border-[var(--mkt-border-l)] px-4 py-2 font-mono text-[0.6875rem] font-bold uppercase text-[var(--mkt-text2)] transition-colors hover:bg-[var(--mkt-text1)] hover:text-[var(--mkt-on-dark)]"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-[var(--mkt-maxw)] border-x border-[var(--mkt-border)] md:min-h-[calc(100vh-var(--mkt-navh))] md:grid-cols-[14rem_minmax(0,1fr)]">
        <aside className="border-b border-[var(--mkt-border)] bg-[var(--mkt-s2)] md:border-b-0 md:border-r">
          <p className="hidden border-b border-[var(--mkt-border)] px-5 py-5 font-mono text-[0.625rem] font-bold uppercase text-[var(--mkt-green-m)] md:block">Professional record</p>
        <nav className="flex overflow-x-auto md:flex-col md:overflow-visible">
          {NAV.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`group flex shrink-0 items-center gap-3 border-r border-[var(--mkt-border)] px-5 py-4 text-xs font-bold uppercase transition-colors md:border-b md:border-r-0 ${
                  active
                    ? "bg-[var(--mkt-text1)] text-[var(--mkt-on-dark)]"
                    : "text-[var(--mkt-text2)] hover:bg-[var(--mkt-s1)] hover:text-[var(--mkt-text1)]"
                }`}
              >
                <Icon className={`size-4 ${active ? "text-[var(--mkt-green-l)]" : "text-[var(--mkt-green-m)]"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        </aside>

        <main className="min-w-0">
          <header className="border-b border-[var(--mkt-border)] p-6 sm:p-8 lg:p-10">
            <p className="mkt-label">Workspace / Current view</p>
            <h1 className="mt-4 max-w-3xl font-serif text-3xl font-black uppercase leading-[0.95] sm:text-5xl">{title}</h1>
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
    <section className="border border-[var(--mkt-border)] bg-[var(--mkt-s1)]">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 border-b border-[var(--mkt-border)] p-5 sm:p-6">
        <div className="min-w-0">
          <h2 className="font-serif text-lg font-black uppercase">{title}</h2>
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
