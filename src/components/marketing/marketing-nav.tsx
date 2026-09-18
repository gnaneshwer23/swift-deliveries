import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { AccountMenu } from "./account-menu";
import { useSession } from "@/hooks/use-session";

const NAV_LINKS = [
  { to: "/how-it-works", label: "How it works" },
  { to: "/experience", label: "Experience" },
  { to: "/launchpad", label: "Launchpad" },
  { to: "/professional-workspace", label: "Workspace" },
] as const;

export function MarketingNav() {
  const [open, setOpen] = useState(false);
  const { user, loading } = useSession();

  return (
    <header className="nav">
      <Link to="/" className="nav-logo">
        DeliverX
      </Link>

      <nav className="nav-links" aria-label="Primary navigation">
        {NAV_LINKS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeProps={{ className: "active" }}
            activeOptions={{ exact: false }}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="nav-right">
        {loading ? null : user ? (
          <AccountMenu user={user} />
        ) : (
          <>
            <Link to="/login" className="btn-nav hidden sm:inline-flex">
              Sign in
            </Link>
            <Link to="/signup" className="btn-nav btn-nav-primary">
              Get started
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
          <nav className="flex flex-col">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="border-b py-3 text-sm font-medium text-[var(--x-slate)]"
                style={{ borderColor: "var(--x-border)" }}
              >
                {item.label}
              </Link>
            ))}
            {!user && (
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="py-3 text-sm font-medium text-[var(--x-slate)]"
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
