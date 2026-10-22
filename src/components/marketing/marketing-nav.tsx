import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { AccountMenu } from "./account-menu";
import { useSession } from "@/hooks/use-session";
import { BrandLogo } from "@/components/brand-logo";

const LINKS = [
  { to: "/how-it-works", label: "How it works" },
  { to: "/pricing", label: "Pricing" },
  { to: "/resources", label: "Resources" },
  { to: "/about", label: "About" },
] as const;

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
            <Link key={l.to} to={l.to} className={pathname.startsWith(l.to) ? "active" : ""}>
              {l.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="nav-right">
        {!loading && user ? (
          <>
            <Link to="/command" className="dxn-cta hidden sm:inline-flex">
              Open Command Centre
            </Link>
            <AccountMenu user={user} />
          </>
        ) : (
          <>
            <Link to="/login" className="dxn-signin hidden sm:inline-flex">
              Sign in
            </Link>
            <Link to="/signup" className="dxn-cta">
              Start free
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
                Open Command Centre
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
                  to="/signup"
                  onClick={() => setOpen(false)}
                  className="dxn-cta justify-center"
                >
                  Start free
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
