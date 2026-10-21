import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/marketing-layout";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title: "Cookies — DeliverX" },
      { name: "description", content: "DeliverX cookie policy." },
      { property: "og:title", content: "Cookies — DeliverX" },
      { property: "og:description", content: "DeliverX cookie policy." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://deliverx.dev/cookies" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://deliverx.dev/cookies" }],
  }),
  component: CookiesPage,
});

function CookiesPage() {
  return (
    <MarketingLayout>
      <section className="px-5 py-20 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[var(--mkt-maxw)]">
          <div className="mx-auto max-w-2xl">
            <span className="mkt-label">Legal</span>
            <h1 className="mkt-section-title mt-3">Cookie Policy</h1>
            <p className="mkt-section-sub">
              DeliverX uses cookies and similar technologies to keep you signed in and understand
              how the product is used.
            </p>
            <div className="mt-10 space-y-6 text-sm leading-relaxed text-[var(--mkt-text2)]">
              <p>
                Essential cookies are required for authentication and security. Analytics cookies
                help us improve the platform and are only used with your consent.
              </p>
              <p>
                You can manage cookie preferences through your browser settings. Disabling
                essential cookies may prevent sign-in.
              </p>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
