/**
 * Shared frame for the legal pages (privacy, terms, cookies): one layout, one
 * "last updated" line and the same section styling, so the three stay consistent.
 */
import type { ReactNode } from "react";
import { MarketingLayout } from "@/components/marketing/marketing-layout";

/** The date the current legal texts were last changed. */
export const LEGAL_LAST_UPDATED = "1 November 2026";

export const LEGAL_CONTACT_EMAIL = "gnaneshwer.jadav@gmail.com";

export function LegalPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <MarketingLayout>
      <section className="px-5 py-20 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[var(--mkt-maxw)]">
          <div className="mx-auto max-w-2xl">
            <span className="mkt-label">Legal</span>
            <h1 className="mkt-section-title mt-3">{title}</h1>
            <p className="mkt-section-sub">{intro}</p>
            <div className="mt-10 space-y-6 text-sm leading-relaxed text-[var(--mkt-text2)]">
              <p>
                <strong>Last updated:</strong> {LEGAL_LAST_UPDATED}
              </p>
              {children}
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-[var(--mkt-text1)]">{title}</h2>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  );
}

export function ContactLink() {
  return (
    <a className="underline" href={`mailto:${LEGAL_CONTACT_EMAIL}`}>
      {LEGAL_CONTACT_EMAIL}
    </a>
  );
}
