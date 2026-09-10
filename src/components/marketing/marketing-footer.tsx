import { Link } from "@tanstack/react-router";
import { MarketingLogo } from "./marketing-logo";
import { FOOTER_COLUMNS } from "@/lib/marketing/footer-data";

export function MarketingFooter() {
  return (
    <footer className="border-t border-[var(--mkt-border)] bg-[var(--mkt-text1)] text-[var(--mkt-on-dark)]">
      <div className="mx-auto max-w-[var(--mkt-maxw)] px-5 py-12 lg:px-8 lg:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <MarketingLogo light />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-[var(--mkt-on-dark-muted)]">
              Do the work. Keep the evidence. Prove what you can do.
            </p>
          </div>
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.id}>
              <h3 className="text-xs font-bold uppercase text-[var(--mkt-on-dark-muted)]">
                {column.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-sm text-[var(--mkt-on-dark-soft)] transition-colors hover:text-[var(--mkt-on-dark)]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-[var(--mkt-on-dark-border)] pt-6 md:flex-row md:items-center">
          <p className="text-xs text-[var(--mkt-on-dark-muted)]">
            © {new Date().getFullYear()} DeliverX. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link
              to="/privacy"
              className="text-xs text-[var(--mkt-on-dark-muted)] hover:text-[var(--mkt-on-dark)]"
            >
              Privacy
            </Link>
            <Link
              to="/terms"
              className="text-xs text-[var(--mkt-on-dark-muted)] hover:text-[var(--mkt-on-dark)]"
            >
              Terms
            </Link>
            <Link
              to="/cookies"
              className="text-xs text-[var(--mkt-on-dark-muted)] hover:text-[var(--mkt-on-dark)]"
            >
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
