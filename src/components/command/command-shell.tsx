import type { ReactNode } from "react";
import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Compass, FolderKanban, LayoutDashboard, Menu, Shield, UsersRound } from "lucide-react";
import { useSignOut } from "@/hooks/use-sign-out";
import { useSession } from "@/hooks/use-session";
import { BrandLogo } from "@/components/brand-logo";

const NAV = [
  { to: "/command", label: "Command Centre", icon: LayoutDashboard },
  { to: "/command/projects", label: "Projects", icon: FolderKanban },
  { to: "/command/capabilities", label: "Capabilities", icon: UsersRound },
  { to: "/workspace", label: "Career workspace", icon: Compass },
] as const;

export function CommandShell({
  title,
  subtitle,
  children,
  usage,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  usage?: { consumed: number; ceiling: number } | undefined;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const signOut = useSignOut();
  const { user } = useSession();
  const [open, setOpen] = useState(false);

  const displayName =
    (user?.user_metadata?.["full_name"] as string | undefined) ?? user?.email ?? "Operator";
  const initials = displayName
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  const remaining = usage ? Math.max(0, usage.ceiling - usage.consumed) : null;

  return (
    <div className="dxa cc-shell min-h-screen">
      <div className="mobile-topbar">
        <BrandLogo to="/command" inverse />
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
          <div onClick={() => setOpen(false)}>
            <BrandLogo to="/command" inverse className="brand-logo sidebar-logo" />
          </div>
          <div className="sidebar-section">
            <div className="sidebar-label">Supervised workforce</div>
            {NAV.map((item) => {
              const active =
                item.to === "/command" ? pathname === "/command" : pathname.startsWith(item.to);
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
          {usage ? (
            <div className="cc-usage-rail">
              <div className="sidebar-label">Usage ceiling</div>
              <div className="cc-usage-meter">
                <div
                  className="cc-usage-fill"
                  style={{
                    width: `${Math.min(100, (usage.consumed / usage.ceiling) * 100)}%`,
                  }}
                />
              </div>
              <p className="cc-usage-copy">
                {usage.consumed} / {usage.ceiling} credits
                {remaining === 0 ? " · hard stop" : ` · ${remaining} left`}
              </p>
            </div>
          ) : null}
          <div className="sidebar-bottom">
            <div className="sidebar-user">
              <div className="sidebar-avatar">{initials || "·"}</div>
              <div className="min-w-0">
                <div className="sidebar-user-name truncate">{displayName}</div>
                <div className="sidebar-user-stage">Operator</div>
              </div>
            </div>
            <button type="button" className="sidebar-signout" onClick={() => void signOut()}>
              Sign out
            </button>
          </div>
        </aside>

        <div className="main">
          <div className="main-header">
            <div>
              <div className="cc-header-eyebrow">DeliverX Command Centre · Stage 1</div>
              <h1 className="main-header-title">{title}</h1>
              {subtitle ? (
                <p className="mt-0.5 text-xs" style={{ color: "var(--x-slate-light)" }}>
                  {subtitle}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div
                className="cc-sim-pill"
                role="note"
                title="No live LLM is called in Stage 1; deterministic planner and executor stubs generate plans and artefacts while enforcing real permission and budget gates."
              >
                <span className="cc-sim-dot" />
                <span>Deterministic simulation · Budget &amp; approval gates active</span>
              </div>
              <div className="cc-permission-chip" title="Permission ladder">
                <Shield className="size-3.5" />
                Plan → Create → Execute → Act externally
              </div>
            </div>
          </div>
          <div className="app-content">{children}</div>
        </div>
      </div>
    </div>
  );
}
