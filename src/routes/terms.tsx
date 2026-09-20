import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/marketing-layout";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms — DeliverX" },
      { name: "description", content: "DeliverX terms of service." },
      { property: "og:title", content: "Terms — DeliverX" },
      { property: "og:description", content: "DeliverX terms of service." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://deliverx.dev/terms" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://deliverx.dev/terms" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <MarketingLayout>
      <section className="px-5 py-20 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[var(--mkt-maxw)]">
          <div className="mx-auto max-w-2xl">
            <span className="mkt-label">Legal</span>
            <h1 className="mkt-section-title mt-3">Terms of Service</h1>
            <p className="mkt-section-sub">
              These terms govern your use of DeliverX and its paid services.
            </p>
            <div className="mt-10 space-y-6 text-sm leading-relaxed text-[var(--mkt-text2)]">
              <p><strong>Last updated:</strong> 20 September 2026</p>
              <section><h2 className="text-base font-semibold text-[var(--mkt-text1)]">Your account</h2><p className="mt-2">Keep your sign-in details secure and provide accurate account information. You are responsible for activity carried out through your account.</p></section>
              <section><h2 className="text-base font-semibold text-[var(--mkt-text1)]">Acceptable use</h2><p className="mt-2">Use DeliverX lawfully and respectfully. Do not upload material you have no right to use, attempt to access another person's record, interfere with the service, or upload sensitive information about others without permission.</p></section>
              <section><h2 className="text-base font-semibold text-[var(--mkt-text1)]">Subscriptions</h2><p className="mt-2">Plan prices, included products, billing periods and taxes are shown before checkout. Subscriptions renew until cancelled. Cancellation ends access immediately; failed payments suspend access. Any refund rights required by law still apply.</p></section>
              <section><h2 className="text-base font-semibold text-[var(--mkt-text1)]">Your work and evidence</h2><p className="mt-2">You retain ownership of content you create. You give DeliverX permission to store, process and display it only as needed to operate features you choose, including portfolios and attestation links you decide to share.</p></section>
              <section><h2 className="text-base font-semibold text-[var(--mkt-text1)]">AI-assisted features</h2><p className="mt-2">AI-generated drafts and capability suggestions can be incomplete or wrong. They are labelled for review and are not professional, legal or hiring advice. You remain responsible for what you approve and submit.</p></section>
              <section><h2 className="text-base font-semibold text-[var(--mkt-text1)]">No employment promise</h2><p className="mt-2">DeliverX does not guarantee employment, promotion, interviews, earnings or a particular capability outcome. Simulated work is never represented as paid client delivery.</p></section>
              <section><h2 className="text-base font-semibold text-[var(--mkt-text1)]">Service changes</h2><p className="mt-2">We may improve, replace or withdraw features. We may suspend accounts that breach these terms or create a security risk, while preserving any rights you have under applicable law.</p></section>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
