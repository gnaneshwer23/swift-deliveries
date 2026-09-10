import type { ReactNode } from "react";
import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Building2,
  FileCheck2,
  Gauge,
  LayoutDashboard,
  Menu,
  User as UserIcon,
  Users,
  GraduationCap,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useSignOut } from "@/hooks/use-sign-out";
import { useSession } from "@/hooks/use-session";
import { coachingWorkspaceQuery } from "@/lib/coaching-queries";

const NAV = [
  { to: "/workspace", label: "Dashboard", icon: LayoutDashboard },
  { to: "/workspace/evidence", label: "Evidence record", icon: FileCheck2 },
  { to: "/workspace/capability", label: "Capability profile", icon: Gauge },
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
  subtitle?: string | undefined;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const signOut = useSignOut();
  const { user } = useSession();
  const [open, setOpen] = useState(false);
  const { data: coaching } = useQuery(coachingWorkspaceQuery);
  const nav = coaching?.hasEnabledProgramme || coaching?.isCoach
    ? [
        ...NAV.slice(0, 3),
        { to: "/workspace/coaching" as const, label: "Coaching", icon: GraduationCap },
        ...NAV.slice(3),
      ]
    : NAV;

  const displayName =
    (user?.user_metadata?.["full_name"] as string | undefined) ?? user?.email ?? "Account";
  const initials = displayName
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  return (
    <div className="dxa min-h-screen">
      <div className="mobile-topbar">
        <Link to="/workspace" className="text-[15px] font-bold text-white no-underline">
          DeliverX
        </Link>
        <button
          type="button"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
          className="rounded-md border border-white/20 p-2 text-white"
        >
          <Menu className="size-4" />
        </button>
      </div>
      <div className="app-wrap">
        <aside className={`sidebar${open ? " open" : ""}`}>
          <Link to="/workspace" className="sidebar-logo" onClick={() => setOpen(false)}>
            DeliverX
          </Link>
          <div className="sidebar-section">
            <div className="sidebar-label">Workspace</div>
            {nav.map((item) => {
              const active =
                item.to === "/workspace" ? pathname === "/workspace" : pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={`sidebar-link${active ? " active" : ""}`}
                >
                  <Icon />
                  {item.label}
                </Link>
              );
            })}
          </div>
          <div className="sidebar-bottom">
            <div className="sidebar-user">
              <div className="sidebar-avatar">{initials || "·"}</div>
              <div className="min-w-0">
                <div className="sidebar-user-name truncate">{displayName}</div>
                <div className="sidebar-user-stage">Professional record</div>
              </div>
            </div>
            <button type="button" className="sidebar-signout" onClick={() => void signOut()}>
              Sign out
            </button>
          </div>
        </aside>

        <div className="main">
          <div className="main-header">
            <span className="main-header-title">{title}</span>
            {subtitle ? <span className="caption hidden sm:block">{subtitle}</span> : null}
          </div>
          {children}
        </div>
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
    <section className="overflow-hidden rounded-xl border bg-[var(--x-paper-raised)]" style={{ borderColor: "var(--x-border)" }}>
      <div className="flex items-start justify-between gap-4 border-b px-5 py-4" style={{ borderColor: "var(--x-border)" }}>
        <div className="min-w-0">
          <h2 className="text-[13px] font-semibold">{title}</h2>
          {description ? (
            <p className="mt-1 max-w-2xl text-xs leading-relaxed" style={{ color: "var(--x-slate-light)" }}>
              {description}
            </p>
          ) : null}
        </div>
        {action}
      </div>
      {children ? (
        <div>{children}</div>
      ) : (
        <div className="px-5 py-6 text-xs" style={{ color: "var(--x-slate-light)" }}>
          Awaiting activity — nothing is created before you act.
        </div>
      )}
    </section>
  );
}
