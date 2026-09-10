import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Building2, LayoutDashboard, User as UserIcon, Users } from "lucide-react";
import { MarketingLogo } from "@/components/marketing/marketing-logo";
import { useSignOut } from "@/hooks/use-sign-out";

const NAV = [
  { to: "/workspace", label: "Overview", icon: LayoutDashboard },
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
    <div className="min-h-screen bg-[var(--mkt-ink)] text-[var(--mkt-text1)]">
      <header className="border-b border-[var(--mkt-border)] bg-[var(--mkt-s1)]">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <MarketingLogo />
          <button
            type="button"
            onClick={() => void signOut()}
            className="rounded-full border border-[var(--mkt-border)] px-4 py-2 text-sm font-medium text-[var(--mkt-text2)] transition-colors hover:bg-[var(--mkt-s2)] hover:text-[var(--mkt-text1)]"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-8 md:flex-row">
        <nav className="flex gap-2 overflow-x-auto md:w-56 md:flex-col md:overflow-visible">
          {NAV.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-[var(--mkt-s2)] text-[var(--mkt-green)]"
                    : "text-[var(--mkt-text2)] hover:bg-[var(--mkt-s2)] hover:text-[var(--mkt-text1)]"
                }`}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-[var(--mkt-text2)]">{subtitle}</p> : null}
          <div className="mt-6 space-y-6">{children}</div>
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
    <section className="rounded-2xl border border-[var(--mkt-border)] bg-[var(--mkt-s1)] p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-[var(--mkt-text2)]">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children ? <div className="mt-5">{children}</div> : null}
    </section>
  );
}
