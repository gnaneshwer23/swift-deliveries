import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { CtaLink } from "@/components/marketing/cta-link";
import { pageHead } from "@/components/marketing/page-head";
import { FaqSection } from "@/components/marketing/faq-section";

export const Route = createFileRoute("/pricing")({
  head: () =>
    pageHead(
      "/pricing",
      "Pricing — DeliverX",
      "DeliverX is free during early access. No card required; nothing is billed.",
    ),
  component: Pricing,
});

const INCLUDED = [
  "Unlimited programmes and missions",
  "The full 150-role workforce",
  "Decision records, meetings and interviews",
  "Full project download",
  "Budget hard-stops you control",
];

const FAQ = [
  {
    q: "Will I be charged?",
    a: "No. Early access is free and needs no card. If paid plans arrive, they will be announced in advance and you will choose whether to upgrade.",
  },
  {
    q: "What are credits?",
    a: "Each programme has a credit budget you set. Work stops at the limit until you raise it, so usage never runs away.",
  },
  {
    q: "Can I keep my work?",
    a: "Yes. Download the complete project at any time.",
  },
];

function Pricing() {
  return (
    <MarketingLayout>
      <section className="dxl-hero">
        <div className="dxl-wrap">
          <p className="dxl-eyebrow">Pricing</p>
          <h1 className="dxl-h1">
            Free while we build
            <br />
            <span className="dxl-grad">it with you.</span>
          </h1>
          <p className="dxl-lead">Early access. No card. Nothing billed.</p>
        </div>
        <div className="dxl-wrap">
          <div className="dxl-price">
            <div>
              <p className="dxl-eyebrow" style={{ marginBottom: 6 }}>
                Early access
              </p>
              <p className="dxl-price-amount">
                £0 <small>/ month</small>
              </p>
            </div>
            <ul>
              {INCLUDED.map((i) => (
                <li key={i}>
                  <Check className="size-4" aria-hidden="true" />
                  {i}
                </li>
              ))}
            </ul>
            <CtaLink
              signedInTo="/command/programmes"
              signedInLabel="Start a programme"
              signedOutLabel="Start free"
              className="dxl-btn dxl-btn-primary"
            />
          </div>
        </div>
      </section>
      <FaqSection items={FAQ} />
    </MarketingLayout>
  );
}
