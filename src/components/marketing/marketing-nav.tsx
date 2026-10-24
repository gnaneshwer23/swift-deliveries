import { useState } from "react";
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

export function MarketingNav() {
  const [open, setOpen] = useState(false);
  const { user, loading } = useSession();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="nav motion-nav dxn">
      <div className="dxn-left">
        <BrandLogo />
        <nav className="nav-links motion-nav-links" aria-label="Primary navigation">
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
            <Link to="/command" className="dxn-cta hidden sm:inline-flex">
              Launch PSI Workspace
            </Link>
            <AccountMenu user={user} />
          </>
        ) : (
          <>
            <Link to="/login" className="dxn-signin hidden sm:inline-flex">
              Sign in
            </Link>
            <Link to="/resources" hash="brief-builder" className="dxn-cta">
              Prepare your brief
            </Link>
          </>
        )}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="btn-nav inline-flex md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </div>

      {open && (
        <div className="dxn-mobile md:hidden">
          <nav className="flex flex-col" aria-label="Mobile navigation">
            {LINKS.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            ))}
            {user ? (
              <Link
                to="/command"
                onClick={() => setOpen(false)}
                className="dxn-cta mt-3 justify-center"
              >
                Launch PSI Workspace
              </Link>
            ) : (
              <div className="mt-3 flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="dxn-signin justify-center"
                >
                  Sign in
                </Link>
                <Link
                  to="/resources"
                  hash="brief-builder"
                  onClick={() => setOpen(false)}
                  className="dxn-cta justify-center"
                >
                  Prepare your brief
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
