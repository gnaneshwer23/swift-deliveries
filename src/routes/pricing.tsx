import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { CtaLink } from "@/components/marketing/cta-link";
import { pageHead } from "@/components/marketing/page-head";
import { FaqSection } from "@/components/marketing/faq-section";
import { ProductIllustration } from "@/components/marketing/product-illustration";
export const Route = createFileRoute("/pricing")({
  head: () =>
    pageHead(
      "/pricing",
      "Early access and usage — DeliverX",
      "Explore DeliverX during free early access. No card required. Understand usage ceilings, the current product scope and what you can keep.",
    ),
  component: Pricing,
});
const FAQ = [
  {
    q: "Will I be charged?",
    a: "Early access is free and requires no card. If paid plans arrive, we will explain the terms in advance and you can choose whether to upgrade.",
  },
  {
    q: "What do credits mean?",
    a: "Credits bound the work in a mission or programme. They are a workflow allowance, not a guarantee of an equivalent cash cost. Work stops at its ceiling until an authorised increase.",
  },
  {
    q: "Are all 150 roles active agents?",
    a: "150 is the capability catalogue. Operational availability is shown in the product, and missions use enabled capabilities. It is not a promise of 150 simultaneous model sessions.",
  },
  {
    q: "Can I keep the output?",
    a: "Yes. Export the project documents, prototype and decision records. The manifest distinguishes simulated and model-generated work.",
  },
];
function Pricing() {
  return (
    <MarketingLayout>
      <section className="psi-page-hero">
        <div className="dxl-wrap psi-split">
          <div>
            <p className="dxl-eyebrow">Early access</p>
            <h1 className="dxl-h1">
              Start with an idea.
              <br />
              <span className="dxl-grad">Keep control of the work.</span>
            </h1>
            <p className="psi-lead">
              Explore the product while we build it with you. No card, no checkout and no hidden
              subscription.
            </p>
            <div className="psi-price-line">
              <strong>£0</strong>
              <span>during early access</span>
            </div>
            <CtaLink
              signedInTo="/command/programmes"
              signedInLabel="Open my product workspace"
              signedOutLabel="Start free"
              className="dxl-btn dxl-btn-primary"
            />
          </div>
          <ProductIllustration
            name="human-direction"
            priority
            caption="Your approval and a defined scope stay part of the process."
          />
        </div>
      </section>
      <section className="psi-section psi-tinted">
        <div className="dxl-wrap psi-split">
          <ProductIllustration name="product-delivery" />
          <div className="psi-section-copy">
            <p className="dxl-eyebrow">What you can explore</p>
            <h2 className="dxl-h2">
              A working process.
              <br />
              Reviewable outputs.
            </h2>
            <ul className="psi-check-list">
              {[
                "Mission and programme planning within usage ceilings",
                "Specialist contributions and decision records",
                "Documents and a lightweight HTML prototype",
                "Human approval gates and a visible work history",
                "A portable project export",
              ].map((x) => (
                <li key={x}>
                  <Check size={16} />
                  {x}
                </li>
              ))}
            </ul>
            <p className="psi-fine-print">
              Outputs disclose their generation mode. Isolated runtime execution, automatic
              deployment and connected outcome tracking are not included in this release.
            </p>
          </div>
        </div>
      </section>
      <section className="psi-section">
        <div className="dxl-wrap psi-split">
          <div className="psi-section-copy">
            <p className="dxl-eyebrow">Before your first mission</p>
            <h2 className="dxl-h2">
              Make a useful brief.
              <br />
              No account needed.
            </h2>
            <p>
              Not ready to create a project? Define the audience, problem and desired outcome with
              our free brief builder, then download it for your team.
            </p>
            <Link to="/resources" hash="brief-builder" className="dxl-link">
              Open the brief builder <ArrowRight size={16} />
            </Link>
          </div>
          <ProductIllustration name="product-brain" />
        </div>
      </section>
      <FaqSection title="A clear answer before you start" items={FAQ} />
    </MarketingLayout>
  );
}
