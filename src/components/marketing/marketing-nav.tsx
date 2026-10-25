import { useEffect, useId, useRef, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { AccountMenu } from "./account-menu";
import { useSession } from "@/hooks/use-session";
import { BrandLogo } from "@/components/brand-logo";

export const MARKETING_LINKS = [
  { to: "/", label: "Home" },
  { to: "/psi", label: "Product" },
  { to: "/how-it-works", label: "Example mission" },
  { to: "/ai-agents", label: "Specialists" },
  { to: "/product-brain", label: "Product Brain" },
  { to: "/solutions", label: "Use cases" },
  { to: "/security", label: "Security & Trust" },
  { to: "/pricing", label: "Pricing & Pilot" },
] as const;
const LINKS = MARKETING_LINKS.filter((l) => ["/psi", "/how-it-works", "/pricing"].includes(l.to));

const DESKTOP_NAV = "(min-width: 960px)";

export function MarketingNav() {
  const [open, setOpen] = useState(false);
  const { user, loading } = useSession();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const menuId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const desktop = window.matchMedia(DESKTOP_NAV);
    const closeOnDesktop = () => {
      if (desktop.matches) setOpen(false);
    };
    closeOnDesktop();
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  useEffect(() => {
    if (!open || window.matchMedia(DESKTOP_NAV).matches) return;
    menuRef.current?.querySelector<HTMLElement>("a")?.focus();
  }, [open]);

  const close = () => {
    setOpen(false);
    toggleRef.current?.focus();
  };

  return (
    <header
      className="nav motion-nav dxn"
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) close();
      }}
    >
      <div className="dxn-left">
        <BrandLogo tagline="Product Super Intelligence" />
        <nav className="nav-links motion-nav-links" aria-label="Primary">
          {LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              aria-current={pathname === l.to ? "page" : undefined}
              className={pathname === l.to ? "active" : ""}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="nav-right">
        {!loading && user ? (
          <>
            <Link to="/command" className="dxn-cta dxn-desktop-cta">
              Launch PSI Workspace
            </Link>
            <AccountMenu user={user} />
          </>
        ) : (
          <>
            <Link to="/login" className="dxn-signin">
              Sign in
            </Link>
            <Link to="/pilot" search={{ plan: "founder" }} className="dxn-cta">
              Request a pilot
            </Link>
          </>
        )}
        <button
          ref={toggleRef}
          type="button"
          className="dxn-toggle"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </div>

      <div className="dxn-mobile" id={menuId} ref={menuRef} hidden={!open}>
        <nav className="flex flex-col" aria-label="Menu">
          {LINKS.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
          {user ? (
            <Link to="/command" onClick={() => setOpen(false)}>
              Launch PSI Workspace
            </Link>
          ) : (
            <Link to="/login" className="dxn-signin" onClick={() => setOpen(false)}>
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
