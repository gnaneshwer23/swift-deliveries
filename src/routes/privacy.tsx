import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/marketing-layout";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy — DeliverX" },
      { name: "description", content: "DeliverX privacy policy." },
      { property: "og:title", content: "Privacy — DeliverX" },
      { property: "og:description", content: "DeliverX privacy policy." },
    ],
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
              This is a placeholder privacy policy for the DeliverX pilot. A final policy will be
              published before public launch.
            </p>
            <div className="mt-10 space-y-6 text-sm leading-relaxed text-[var(--mkt-text2)]">
              <p>
                DeliverX collects the minimum information needed to provide the service: your email,
                profile data and the content you create inside the platform.
              </p>
              <p>
                We do not sell personal data. AI features process data to generate drafts for your
                review; we do not use your content to train third-party models without your consent.
              </p>
              <p>
                You can request deletion of your account and data at any time by contacting support.
              </p>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
