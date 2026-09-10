import { Link } from "@tanstack/react-router";
import { MarketingLogo } from "./marketing-logo";
import { FOOTER_COLUMNS } from "@/lib/marketing/footer-data";

export function MarketingFooter() {
  return (
    <footer className="border-t border-[var(--mkt-border)] bg-[var(--mkt-s2)] text-[var(--mkt-text1)]">
      <div className="mx-auto max-w-[var(--mkt-maxw)] px-5 py-12 lg:px-8 lg:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <MarketingLogo />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-[var(--mkt-text2)]">
              Do the work. Keep the evidence. Prove what you can do.
            </p>
          </div>
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.id}>
              <h3 className="text-xs font-bold text-[var(--mkt-green-m)]">
                {column.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-sm text-[var(--mkt-text2)] transition-colors hover:text-[var(--mkt-green)]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-[var(--mkt-border)] pt-6 md:flex-row md:items-center">
          <p className="text-xs text-[var(--mkt-text3)]">
            © {new Date().getFullYear()} DeliverX. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link
              to="/privacy"
              className="text-xs text-[var(--mkt-text3)] hover:text-[var(--mkt-green)]"
            >
              Privacy
            </Link>
            <Link
              to="/terms"
              className="text-xs text-[var(--mkt-text3)] hover:text-[var(--mkt-green)]"
            >
              Terms
            </Link>
            <Link
              to="/cookies"
              className="text-xs text-[var(--mkt-text3)] hover:text-[var(--mkt-green)]"
            >
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
