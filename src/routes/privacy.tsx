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
              <section><h2 className="text-base font-semibold text-[var(--mkt-text1)]">Who we are</h2><p className="mt-2">DeliverX is the trading name of the data controller for this service. You can reach us about anything in this policy at <a className="underline" href="mailto:gnaneshwer.jadav@gmail.com">gnaneshwer.jadav@gmail.com</a>. A registered company entity is being established; this page will be updated with its details when that completes.</p></section>
              <section><h2 className="text-base font-semibold text-[var(--mkt-text1)]">Information we collect</h2><p className="mt-2">We store account details, profile and organisation information, the work and evidence you create, coaching or attestation activity, consent choices, and subscription status. Payment card details are handled by our payment provider and are not stored by DeliverX.</p></section>
              <section><h2 className="text-base font-semibold text-[var(--mkt-text1)]">Why we use it (lawful bases)</h2><p className="mt-2">We use this information to provide and secure your account and operate the products you select (performing our contract with you), to preserve your evidence record and process subscriptions (contract and legal obligation), to respond to requests and improve reliability (legitimate interest), and — only where you have opted in — for observation features and analytics (consent).</p></section>
              <section><h2 className="text-base font-semibold text-[var(--mkt-text1)]">AI processing</h2><p className="mt-2">When you request an AI-assisted feature, the relevant content is processed to produce that draft or assessment. AI drafts require your action before they are submitted. We do not use your content to train third-party models without your consent.</p></section>
              <section><h2 className="text-base font-semibold text-[var(--mkt-text1)]">Attestation and your attester</h2><p className="mt-2">When you request attestation, we share the specific artefact, its brief and rubric with the person you name, using a secure link. We process their name, email and response to operate the attestation. They see your work — never your scores — and you can withdraw the request at any time.</p></section>
              <section><h2 className="text-base font-semibold text-[var(--mkt-text1)]">Sharing and visibility</h2><p className="mt-2">Records are private by default. We share data with service providers only to run DeliverX — our cloud hosting and database provider, our payment provider (Stripe), our email delivery provider, and our AI processing provider — and with coaches, teammates or attesters only where the feature and your choices require it. Public portfolio links are created, limited and revocable by you.</p></section>
              <section><h2 className="text-base font-semibold text-[var(--mkt-text1)]">The evidence ledger and deletion</h2><p className="mt-2">Submitted work is frozen as immutable artefact versions so that what was judged cannot be changed after the fact. If you delete your account, we remove or anonymise the personal information attached to those records; the anonymised artefact versions may be retained to preserve the integrity of the ledger and any credentials issued against them.</p></section>
              <section><h2 className="text-base font-semibold text-[var(--mkt-text1)]">Retention and security</h2><p className="mt-2">We retain account data while your account is active and as needed for security, legal and payment obligations. Access controls and private storage protect records, but no online service can promise absolute security.</p></section>
              <section><h2 className="text-base font-semibold text-[var(--mkt-text1)]">Your rights</h2><p className="mt-2">You can update profile information, keep observation off, revoke shared portfolios and control what you submit. Under UK GDPR you may ask for access, correction, export or deletion of your personal information, object to or restrict processing, and withdraw consent at any time. You also have the right to complain to the Information Commissioner's Office (ICO) at ico.org.uk.</p></section>
              <section><h2 className="text-base font-semibold text-[var(--mkt-text1)]">No sale of personal data</h2><p className="mt-2">We do not sell personal data or use it for third-party advertising.</p></section>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
