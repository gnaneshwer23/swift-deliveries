import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/marketing-layout";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms — DeliverX" },
      { name: "description", content: "DeliverX terms of service." },
      { property: "og:title", content: "Terms — DeliverX" },
      { property: "og:description", content: "DeliverX terms of service." },
    ],
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
              These pilot terms govern your use of DeliverX during the early-access period.
            </p>
            <div className="mt-10 space-y-6 text-sm leading-relaxed text-[var(--mkt-text2)]">
              <p>
                By using DeliverX you agree to use the platform lawfully and respectfully. Do not
                upload sensitive personal data about others without their consent.
              </p>
              <p>
                Pilot access is provided as-is and may change without notice. We may add, modify or
                remove features as the product evolves.
              </p>
              <p>
                AI-generated drafts are suggestions, not professional advice. You are responsible
                for reviewing and approving any output before sharing it.
              </p>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
