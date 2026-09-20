import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/marketing-layout";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy — DeliverX" },
      { name: "description", content: "DeliverX privacy policy." },
      { property: "og:title", content: "Privacy — DeliverX" },
      { property: "og:description", content: "DeliverX privacy policy." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://deliverx.dev/privacy" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://deliverx.dev/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <MarketingLayout>
      <section className="px-5 py-20 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[var(--mkt-maxw)]">
          <div className="mx-auto max-w-2xl">
            <span className="mkt-label">Legal</span>
            <h1 className="mkt-section-title mt-3">Privacy Policy</h1>
            <p className="mkt-section-sub">
              This policy explains what DeliverX stores, why it is used, and the choices you have.
            </p>
            <div className="mt-10 space-y-6 text-sm leading-relaxed text-[var(--mkt-text2)]">
              <p><strong>Last updated:</strong> 20 September 2026</p>
              <section><h2 className="text-base font-semibold text-[var(--mkt-text1)]">Information we collect</h2><p className="mt-2">We store account details, profile and organisation information, the work and evidence you create, coaching or attestation activity, consent choices, and subscription status. Payment card details are handled by our payment provider and are not stored by DeliverX.</p></section>
              <section><h2 className="text-base font-semibold text-[var(--mkt-text1)]">Why we use it</h2><p className="mt-2">We use this information to provide and secure your account, operate the products you select, preserve your evidence record, process subscriptions, respond to requests, and improve reliability.</p></section>
              <section><h2 className="text-base font-semibold text-[var(--mkt-text1)]">AI processing</h2><p className="mt-2">When you request an AI-assisted feature, the relevant content is processed to produce that draft or assessment. AI drafts require your action before they are submitted. We do not use your content to train third-party models without your consent.</p></section>
              <section><h2 className="text-base font-semibold text-[var(--mkt-text1)]">Sharing and visibility</h2><p className="mt-2">Records are private by default. We share data with service providers only to run DeliverX, and with coaches, teammates or attestors only where the feature and your choices require it. Public portfolio links are created, limited and revocable by you.</p></section>
              <section><h2 className="text-base font-semibold text-[var(--mkt-text1)]">Retention and security</h2><p className="mt-2">We retain account data while your account is active and as needed for security, legal and payment obligations. Access controls and private storage protect records, but no online service can promise absolute security.</p></section>
              <section><h2 className="text-base font-semibold text-[var(--mkt-text1)]">Your choices</h2><p className="mt-2">You can update profile information, keep observation off, revoke shared portfolios and control what you submit. You may ask for access, correction, export or deletion of personal information, subject to legal retention requirements.</p></section>
              <section><h2 className="text-base font-semibold text-[var(--mkt-text1)]">No sale of personal data</h2><p className="mt-2">We do not sell personal data or use it for third-party advertising.</p></section>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
