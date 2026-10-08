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
              <section><h2 className="text-base font-semibold text-[var(--mkt-text1)]">Who we are</h2><p className="mt-2">DeliverX is the trading name of the service operator, reachable at <a className="underline" href="mailto:gnaneshwer.jadav@gmail.com">gnaneshwer.jadav@gmail.com</a>. A registered company entity is being established and these terms will be updated with its details.</p></section>
              <section><h2 className="text-base font-semibold text-[var(--mkt-text1)]">Subscriptions</h2><p className="mt-2">Plan prices, included products, billing periods and taxes are shown before checkout. Subscriptions renew until cancelled. When you cancel, access runs to the end of the period you have paid for; failed payments suspend access. One-off purchases (such as the Career Sprint) do not renew. Your statutory rights, including any cooling-off or refund rights under UK consumer law, are not affected.</p></section>
              <section><h2 className="text-base font-semibold text-[var(--mkt-text1)]">Your work and evidence</h2><p className="mt-2">You retain ownership of content you create. You give DeliverX permission to store, process and display it only as needed to operate features you choose, including portfolios and attestation links you decide to share.</p></section>
              <section><h2 className="text-base font-semibold text-[var(--mkt-text1)]">AI-assisted features</h2><p className="mt-2">AI-generated drafts and capability suggestions can be incomplete or wrong. They are labelled for review and are not professional, legal or hiring advice. You remain responsible for what you approve and submit.</p></section>
              <section><h2 className="text-base font-semibold text-[var(--mkt-text1)]">No employment promise</h2><p className="mt-2">DeliverX does not guarantee employment, promotion, interviews, earnings or a particular capability outcome. Simulated work is never represented as paid client delivery.</p></section>
              <section><h2 className="text-base font-semibold text-[var(--mkt-text1)]">Attestation</h2><p className="mt-2">If you request attestation, you confirm the person you name is independent — not DeliverX staff, not a paid coach of yours, and not sharing your own email domain. Attestors must respond honestly about the work they review. We may revoke credentials obtained through a misleading attestation.</p></section>
              <section><h2 className="text-base font-semibold text-[var(--mkt-text1)]">Service changes</h2><p className="mt-2">We may improve, replace or withdraw features. We may suspend accounts that breach these terms or create a security risk, while preserving any rights you have under applicable law.</p></section>
              <section><h2 className="text-base font-semibold text-[var(--mkt-text1)]">Governing law</h2><p className="mt-2">These terms are governed by the laws of England and Wales, and the courts of England and Wales have jurisdiction, except where mandatory consumer law gives you the protection of your local courts.</p></section>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
