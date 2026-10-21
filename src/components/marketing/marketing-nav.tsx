import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { AccountMenu } from "./account-menu";
import { useSession } from "@/hooks/use-session";
import { BrandLogo } from "@/components/brand-logo";

const NAV_LINKS = [
  { href: "/#mission-types", label: "Mission types" },
  { href: "/#how-it-works", label: "Lifecycle" },
  { href: "/#capabilities", label: "Capabilities" },
  { href: "/#governance", label: "Governance" },
  { href: "/how-it-works", label: "Architecture" },
] as const;

export function MarketingNav() {
  const [open, setOpen] = useState(false);
  const { user, loading } = useSession();

  return (
    <header className="nav">
      <div className="flex items-center gap-3">
        <BrandLogo />
        <span className="nav-stage-badge hidden lg:inline-flex">Stage 1 · 12 Available</span>
      </div>

      <nav className="nav-links" aria-label="Primary navigation">
        {NAV_LINKS.map((item) => (
          <a key={item.href} href={item.href}>
            {item.label}
          </a>
        ))}
      </nav>

      <div className="nav-right">
        {!loading && user ? (
          <>
            <Link to="/command" className="btn-nav btn-nav-primary hidden sm:inline-flex">
              Command Centre
            </Link>
            <AccountMenu user={user} />
          </>
        ) : (
          <>
            <Link to="/login" className="btn-nav hidden sm:inline-flex">
              Sign in
            </Link>
            <Link to="/signup" className="btn-nav btn-nav-primary">
              Open Command Centre
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
        <div
          className="absolute inset-x-0 top-14 border-b bg-[var(--x-paper)] px-4 pb-4 pt-2 md:hidden"
          style={{ borderColor: "var(--x-border)" }}
        >
          <nav className="flex flex-col" aria-label="Mobile navigation">
            {NAV_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="border-b py-3 text-sm font-medium text-[var(--x-slate)]"
                style={{ borderColor: "var(--x-border)" }}
              >
                {item.label}
              </a>
            ))}
            {!user && (
              <>
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="border-b py-3 text-sm font-medium text-[var(--x-slate)]"
                  style={{ borderColor: "var(--x-border)" }}
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setOpen(false)}
                  className="py-3 text-sm font-medium text-[var(--x-ink)]"
                >
                  Open Command Centre
                </Link>
              </>
            )}
            {user ? (
              <Link
                to="/command"
                onClick={() => setOpen(false)}
                className="py-3 text-sm font-medium text-[var(--x-ink)]"
              >
                Command Centre
              </Link>
            ) : null}
          </nav>
        </div>
      )}
    </header>
  );
}
