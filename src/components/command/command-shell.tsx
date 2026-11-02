import type { ReactNode } from "react";
import { useEffect, useLayoutEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  ArrowUpRight,
  CreditCard,
  GraduationCap,
  Inbox,
  LayoutGrid,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { getPilotOperatorAccess } from "@/lib/pilot/enquiry.functions";
import { useSignOut } from "@/hooks/use-sign-out";
import { useSession } from "@/hooks/use-session";
import { BrandLogo } from "@/components/brand-logo";
import { isExecutiveStudioRoute } from "@/lib/command/executive-studio-routes";
import "@/styles/psi-workspace.css";
import "@/styles/studio-system.css";

const PRIMARY_NAV = [
  { to: "/command", label: "Projects", icon: LayoutGrid },
  { to: "/command/capabilities", label: "AI team", icon: UsersRound },
  { to: "/learn", label: "Learn", icon: GraduationCap },
] as const;

type NavItem = (typeof PRIMARY_NAV)[number];

const EXECUTIVE_FONT_LINK_ID = "ps-executive-fonts";
/** Desktop navigation width: a slim icon rail by default, or the full sidebar. */
const NAV_PREF_KEY = "dx-studio-nav";

function readRailPref(): boolean {
  try {
    return window.localStorage.getItem(NAV_PREF_KEY) !== "full";
  } catch {
    return true;
  }
}

function navLinkActive(item: NavItem, pathname: string, _locationHash: string): boolean {
  const { to, label } = item;
  if (label === "Projects") {
    return (
      pathname === "/command" ||
      pathname.startsWith("/command/supervised") ||
      pathname.startsWith("/command/missions") ||
      pathname.startsWith("/command/portfolio")
    );
  }
  return pathname.startsWith(to);
}

function NavLinks({
  items,
  pathname,
  locationHash,
  onNavigate,
}: {
  items: readonly NavItem[];
  pathname: string;
  locationHash: string;
  onNavigate: () => void;
}) {
  return items.map((item) => {
    const { to, label, icon: Icon } = item;
    const active = navLinkActive(item, pathname, locationHash);
    return (
      <Link
        key={`${to}-${label}`}
        to={to}
        aria-current={active ? "page" : undefined}
        className={`ps-nav-link ${active ? "is-active" : ""}`}
        title={label}
        onClick={onNavigate}
      >
        <Icon size={18} />
        <span>{label}</span>
      </Link>
    );
  });
}

export function CommandShell({
  title,
  subtitle,
  children,
  usage,
  networkMode = false,
  hideHeading = false,
  foyerMode = false,
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
  /** Calm Studio foyer — soften chrome that reads like an ops dashboard. */
  foyerMode?: boolean;
}) {
  const { pathname, hash: locationHash } = useRouterState({
    select: (s) => ({ pathname: s.location.pathname, hash: s.location.hash }),
  });
  const signOut = useSignOut();
  const { user } = useSession();
  const [open, setOpen] = useState(false);
  const [rail, setRail] = useState(true);
  // Before paint, so a saved "full" choice never flashes the rail first (these routes are client-only).
  useLayoutEffect(() => setRail(readRailPref()), []);
  const toggleRail = () => {
    setRail((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(NAV_PREF_KEY, next ? "rail" : "full");
      } catch {
        /* Optional preference. */
      }
      return next;
    });
  };
  const operatorAccess = useQuery({
    queryKey: ["pilot", "operator-access"],
    queryFn: () => getPilotOperatorAccess(),
    staleTime: 60_000,
  });
  const name = user?.user_metadata.full_name ?? user?.email ?? "Studio owner";
  const remaining = usage ? Math.max(0, usage.ceiling - usage.consumed) : null;
  const isStudioHome = title === "Studio" || pathname === "/command";
  const executiveMode = isExecutiveStudioRoute(pathname);

  const studioEntryMode = foyerMode && pathname === "/command";

  useEffect(() => {
    if (!executiveMode || typeof document === "undefined") return;
    if (document.getElementById(EXECUTIVE_FONT_LINK_ID)) return;
    const link = document.createElement("link");
    link.id = EXECUTIVE_FONT_LINK_ID;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500&family=Plus+Jakarta+Sans:wght@500;600;700&display=swap";
    document.head.appendChild(link);
  }, [executiveMode]);

  const breadcrumb = isStudioHome ? (
    <span>Projects</span>
  ) : (
    <span>
      <Link to="/command">Projects</Link> <span>/</span> {title}
    </span>
  );

  return (
    <div
      className={`dxa cc-shell psi-workspace${networkMode ? " ps-network-shell" : ""}${
        hideHeading ? " ps-shell-foyer" : ""
      }${foyerMode ? " ps-shell-foyer-calm" : ""}${executiveMode ? " ps-executive" : ""}${
        studioEntryMode ? " ps-studio-entry sx" : ""
      }${rail && !networkMode ? " ps-rail" : ""}`}
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
          <NavLinks
            items={PRIMARY_NAV}
            pathname={pathname}
            locationHash={locationHash}
            onNavigate={() => setOpen(false)}
          />
          {networkMode ? null : (
            <button
              type="button"
              className="ps-rail-toggle"
              onClick={toggleRail}
              aria-pressed={!rail}
              title={rail ? "Expand menu" : "Collapse menu"}
            >
              {rail ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
              <span>{rail ? "Expand menu" : "Collapse menu"}</span>
            </button>
          )}
        </nav>
        <div className="ps-sidebar-bottom">
          <Link to="/" className="ps-site-link" title="Explore DeliverX">
            <span>Explore DeliverX</span>
            <ArrowUpRight size={14} />
          </Link>
          <details className="ps-account">
            <summary className="ps-user" title={name}>
              <span>{name.slice(0, 1).toUpperCase()}</span>
              <div>
                <strong>{name}</strong>
                <small>Account</small>
              </div>
            </summary>
            <div className="ps-account-panel">
              {usage && foyerMode ? (
                <p className="cc-muted text-xs mb-2">
                  Usage for this view: {usage.consumed} / {usage.ceiling} units.
                </p>
              ) : usage ? (
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
              <Link
                to="/settings/profile"
                className="ps-account-link"
                onClick={() => setOpen(false)}
              >
                <UserRound size={14} />
                Profile &amp; preferences
              </Link>
              <Link
                to="/settings/billing"
                className="ps-account-link"
                onClick={() => setOpen(false)}
              >
                <CreditCard size={14} />
                Billing
              </Link>
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
          {foyerMode && pathname === "/command" ? null : (
            <Link to="/command" hash="new-project" className="ps-new-mission">
              + New project
            </Link>
          )}
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
