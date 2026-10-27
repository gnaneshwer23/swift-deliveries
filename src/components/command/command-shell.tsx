import type { ReactNode } from "react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Building2,
  Compass,
  FlaskConical,
  FolderKanban,
  Inbox,
  Menu,
  ShieldCheck,
  UsersRound,
  X,
} from "lucide-react";
import { getPilotOperatorAccess } from "@/lib/pilot/enquiry.functions";
import { useSignOut } from "@/hooks/use-sign-out";
import { useSession } from "@/hooks/use-session";
import { BrandLogo } from "@/components/brand-logo";
import "@/styles/psi-workspace.css";

const NAV = [
  { to: "/command", label: "Studio", icon: Compass },
  {
    to: "/command/capabilities",
    hash: "agents-office",
    label: "Agents office",
    icon: Building2,
  },
  { to: "/command/projects", label: "Projects", icon: FolderKanban },
  { to: "/command/capabilities", label: "Specialists", icon: UsersRound },
  { to: "/command/programmes", label: "Programmes", icon: FlaskConical },
] as const;

export function CommandShell({
  title,
  subtitle,
  children,
  usage,
  networkMode = false,
  hideHeading = false,
}: {
  title: string;
  networkMode?: boolean;
  subtitle?: string;
  children: ReactNode;
  usage?:
    | { consumed: number; ceiling: number; scope?: "workspace" | "mission" | "programme" }
    | undefined;
  /** Overview foyer owns the first-viewport composition — skip duplicate page H1. */
  hideHeading?: boolean;
}) {
  const { pathname, hash: locationHash } = useRouterState({
    select: (s) => ({ pathname: s.location.pathname, hash: s.location.hash }),
  });
  const signOut = useSignOut();
  const { user } = useSession();
  const [open, setOpen] = useState(false);
  const operatorAccess = useQuery({
    queryKey: ["pilot", "operator-access"],
    queryFn: () => getPilotOperatorAccess(),
    staleTime: 60_000,
  });
  const name = user?.user_metadata.full_name ?? user?.email ?? "Studio owner";
  const remaining = usage ? Math.max(0, usage.ceiling - usage.consumed) : null;
  const isStudioHome = title === "Studio" || pathname === "/command";
  const breadcrumb = isStudioHome ? (
    <span>Studio</span>
  ) : (
    <span>
      Studio <span>/</span> {title}
    </span>
  );

  return (
    <div
      className={`dxa cc-shell psi-workspace${networkMode ? " ps-network-shell" : ""}${
        hideHeading ? " ps-shell-foyer" : ""
      }`}
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpen(false);
      }}
    >
      <header className="ps-mobile">
        <BrandLogo to="/command" />
        <button
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          aria-controls="workspace-navigation"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>
      {open && (
        <button className="ps-scrim" aria-label="Close navigation" onClick={() => setOpen(false)} />
      )}
      <aside id="workspace-navigation" className={`ps-sidebar ${open ? "is-open" : ""}`}>
        <BrandLogo to="/command" className="ps-brand" />
        <div className="ps-workspace-switch">
          <span className="ps-product-mark">P</span>
          <div>
            <strong>DeliverX Studio</strong>
            <small>Supervised product-building</small>
          </div>
        </div>
        <nav aria-label="Studio navigation">
          {NAV.map((item) => {
            const { to, label, icon: Icon } = item;
            const hash = "hash" in item ? item.hash : undefined;
            const onCapabilities = pathname.startsWith("/command/capabilities");
            const hashIsOffice =
              locationHash === "#agents-office" || locationHash === "agents-office";
            const active =
              label === "Studio"
                ? pathname === "/command" ||
                  pathname.startsWith("/command/supervised") ||
                  pathname.startsWith("/command/missions")
                : label === "Agents office"
                  ? onCapabilities && hashIsOffice
                  : label === "Specialists"
                    ? onCapabilities && !hashIsOffice
                    : pathname.startsWith(to);
            return (
              <Link
                key={hash ? `${to}#${hash}` : `${to}-${label}`}
                to={to}
                {...(hash ? { hash } : {})}
                aria-current={active ? "page" : undefined}
                className={`ps-nav-link ${active ? "is-active" : ""}`}
                onClick={() => setOpen(false)}
              >
                <Icon size={18} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="ps-sidebar-bottom">
          <Link to="/" className="ps-site-link">
            Explore DeliverX
            <ArrowUpRight size={14} />
          </Link>
          <details className="ps-account">
            <summary className="ps-user">
              <span>{name.slice(0, 1).toUpperCase()}</span>
              <div>
                <strong>{name}</strong>
                <small>Account</small>
              </div>
            </summary>
            <div className="ps-account-panel">
              {usage ? (
                <div className="ps-budget">
                  <div>
                    <span>
                      {usage.scope === "mission"
                        ? "Mission usage"
                        : usage.scope === "programme"
                          ? "Programme usage"
                          : "Studio usage"}
                    </span>
                    <strong>
                      {usage.consumed} / {usage.ceiling}
                    </strong>
                  </div>
                  <progress
                    aria-label={`${usage.scope ?? "studio"} usage`}
                    max={Math.max(1, usage.ceiling)}
                    value={usage.consumed}
                  />
                  <small>
                    {remaining === 0 ? "Usage ceiling reached" : `${remaining} units remaining`}
                  </small>
                </div>
              ) : null}
              {operatorAccess.data?.authorised ? (
                <Link
                  to="/command/pilot-requests"
                  className="ps-account-link"
                  onClick={() => setOpen(false)}
                >
                  <Inbox size={14} />
                  Pilot requests
                </Link>
              ) : null}
              <div className="ps-sidebar-note">
                <ShieldCheck size={16} />
                <strong>You stay in control.</strong>
                <p>Specialists contribute. You decide what moves forward.</p>
              </div>
              <button type="button" className="ps-account-signout" onClick={() => void signOut()}>
                Sign out
              </button>
            </div>
          </details>
        </div>
      </aside>
      <main className="ps-main" inert={open}>
        <div className="ps-topbar">
          {breadcrumb}
          <Link to="/command" hash="supervised-brief" className="ps-new-mission">
            + New case
          </Link>
        </div>
        {!hideHeading ? (
          <header className="ps-page-heading">
            <div>
              <h1>{title}</h1>
              {subtitle && <p>{subtitle}</p>}
            </div>
            <span className="ps-supervision">
              <ShieldCheck size={15} />
              Human supervised
            </span>
          </header>
        ) : null}
        <div className="ps-content">{children}</div>
      </main>
    </div>
  );
}
