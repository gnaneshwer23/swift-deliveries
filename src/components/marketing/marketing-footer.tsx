import { Link } from "@tanstack/react-router";
import { MarketingLogo } from "./marketing-logo";
import { FOOTER_COLUMNS, DEFAULT_FOOTER_CTA } from "@/lib/marketing/footer-data";

export function MarketingFooter() {
  return (
    <footer className="border-t border-[var(--mkt-border)] bg-[var(--mkt-s1)]">
      <div className="mkt-cta-band px-5 py-14 lg:px-8">
        <div className="mx-auto flex max-w-[var(--mkt-maxw)] flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h2 className="font-serif text-2xl tracking-[-0.02em] text-white md:text-3xl">
              {DEFAULT_FOOTER_CTA.title}
            </h2>
            <p className="mt-2 max-w-md text-sm font-light leading-relaxed text-white/80">
              {DEFAULT_FOOTER_CTA.subtitle}
            </p>
          </div>
          <Link
            to={DEFAULT_FOOTER_CTA.href}
            className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[var(--mkt-green)] shadow-sm transition-all hover:bg-[var(--mkt-s2)] hover:shadow-md"
          >
            {DEFAULT_FOOTER_CTA.label}
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-[var(--mkt-maxw)] px-5 py-12 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <MarketingLogo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[var(--mkt-text3)]">
              DeliverX is a Professional Intelligence platform that helps product people build evidence, land opportunities and succeed in the role.
            </p>
          </div>
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.id}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--mkt-text3)]">
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

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[var(--mkt-border)] pt-8 md:flex-row">
          <p className="text-xs text-[var(--mkt-text3)]">
            © {new Date().getFullYear()} DeliverX. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link
              to="/privacy"
              className="text-xs text-[var(--mkt-text3)] hover:text-[var(--mkt-text2)]"
            >
              Privacy
            </Link>
            <Link
              to="/terms"
              className="text-xs text-[var(--mkt-text3)] hover:text-[var(--mkt-text2)]"
            >
              Terms
            </Link>
            <Link
              to="/cookies"
              className="text-xs text-[var(--mkt-text3)] hover:text-[var(--mkt-text2)]"
            >
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
