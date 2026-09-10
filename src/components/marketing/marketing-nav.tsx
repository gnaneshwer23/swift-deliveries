import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { MarketingLogo } from "./marketing-logo";
import { AccountMenu } from "./account-menu";
import { PRIMARY_NAV } from "@/lib/marketing/suite-data";
import { useSession } from "@/hooks/use-session";

function normalizePath(path: string) {
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path;
}

export function MarketingNav() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, loading } = useSession();

  return (
    <header className="fixed left-0 right-0 top-0 z-50 h-[var(--mkt-navh)] border-b border-transparent bg-[var(--mkt-s1)]/80 backdrop-blur-md transition-all duration-300">
      <div className="mx-auto flex h-full max-w-[var(--mkt-maxw)] items-center justify-between px-5 lg:px-8">
        <MarketingLogo />

        <nav className="hidden items-center gap-1 md:flex">
          {PRIMARY_NAV.map((item) => {
            const active = normalizePath(pathname) === normalizePath(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "text-[var(--mkt-green)]"
                    : "text-[var(--mkt-text2)] hover:bg-[var(--mkt-s2)] hover:text-[var(--mkt-text1)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {loading ? (
            <span className="h-9 w-24 animate-pulse rounded-full bg-[var(--mkt-s2)]" />
          ) : user ? (
            <AccountMenu user={user} />
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-full px-4 py-2 text-sm font-medium text-[var(--mkt-text2)] transition-colors hover:text-[var(--mkt-text1)]"
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                className="rounded-full bg-[var(--mkt-green)] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-[var(--mkt-green-m)] hover:shadow-md"
              >
                Start
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center justify-center rounded-lg p-2 text-[var(--mkt-text2)] md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-[var(--mkt-navh)] border-b border-[var(--mkt-border)] bg-[var(--mkt-s1)] px-5 pb-6 pt-4 shadow-lg md:hidden">
          <nav className="flex flex-col gap-1">
            {PRIMARY_NAV.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-base font-medium text-[var(--mkt-text2)] hover:bg-[var(--mkt-s2)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2 border-t border-[var(--mkt-border)] pt-4">
            {user ? (
              <Link
                to="/workspace"
                onClick={() => setOpen(false)}
                className="rounded-lg bg-[var(--mkt-green)] px-3 py-3 text-center text-base font-medium text-white hover:bg-[var(--mkt-green-m)]"
              >
                Go to workspace
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-3 text-center text-base font-medium text-[var(--mkt-text2)] hover:bg-[var(--mkt-s2)]"
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setOpen(false)}
                  className="rounded-lg bg-[var(--mkt-green)] px-3 py-3 text-center text-base font-medium text-white hover:bg-[var(--mkt-green-m)]"
                >
                  Start
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
