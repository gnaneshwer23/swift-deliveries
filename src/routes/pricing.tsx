import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { pageHead } from "@/components/marketing/page-head";
import { FaqSection } from "@/components/marketing/faq-section";
export const Route = createFileRoute("/pricing")({
  head: () =>
    pageHead(
      "/pricing",
      "Pricing & Pilot — DeliverX",
      "Three paid DeliverX pilot plans: Builder £29, Founder £99 and Studio £299 per month. Defined scope, human approvals and controlled AI usage.",
    ),
  component: Pricing,
});
export const PLANS = [
  {
    id: "builder",
    name: "Builder",
    price: 29,
    audience: "For students and individual product builders",
    features: [
      "1 product · 1 owner",
      "1 scoped mission per month",
      "Brief, evidence review and decision record",
      "Prototype planning and project export",
    ],
    budget: "Up to £5 of model usage included",
  },
  {
    id: "founder",
    name: "Founder",
    price: 99,
    audience: "For founders validating and shaping one product",
    features: [
      "3 products · up to 3 collaborators",
      "4 scoped missions per month",
      "Research-to-prototype mission scope",
      "Decision reviews and pilot onboarding",
    ],
    budget: "Up to £20 of model usage included",
  },
  {
    id: "studio",
    name: "Studio",
    price: 299,
    audience: "For small product teams working across a portfolio",
    features: [
      "10 products · up to 10 collaborators",
      "12 scoped missions per month",
      "Cross-discipline mission planning",
      "Team onboarding and a monthly pilot review",
    ],
    budget: "Up to £60 of model usage included",
  },
] as const;
function Pricing() {
  return (
    <MarketingLayout>
      <section className="psi-page-hero">
        <div className="dxl-wrap">
          <p className="dxl-eyebrow">Pricing & Pilot · GBP · monthly</p>
          <h1 className="dxl-h1">
            A product team.
            <br />
            <span className="dxl-grad">A defined investment.</span>
          </h1>
          <p className="psi-lead">
            Choose a paid pilot for the work you want to move forward. Each plan has a clear scope
            and a usage ceiling.
          </p>
          <p className="psi-fine-print">
            Pilot offers. Access is confirmed before billing; self-service checkout and automatic
            plan enforcement are not yet live. Prices exclude applicable taxes. No annual
            commitment.
          </p>
          <div className="psi-price-grid">
            {PLANS.map((plan) => (
              <article className="psi-plan" key={plan.id}>
                <p className="dxl-eyebrow">
                  {plan.id === "founder" ? "For your first product launch" : "Paid pilot"}
                </p>
                <h2>{plan.name}</h2>
                <p>{plan.audience}</p>
                <div className="psi-plan-price">
                  £{plan.price}
                  <small> / month</small>
                </div>
                <Link to="/pilot" search={{ plan: plan.id }} className="dxl-btn dxl-btn-primary">
                  Request {plan.name} access
                </Link>
                <ul>
                  {plan.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <strong>{plan.budget}</strong>
                <p className="psi-fine-print">
                  The agreed mission scope and allowance are confirmed during onboarding. Additional
                  usage needs your approval; no automatic overage billing.
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="psi-section psi-tinted">
        <div className="dxl-wrap">
          <p className="dxl-eyebrow">What you are paying for</p>
          <h2 className="dxl-h2">Product continuity, not 150 chat windows.</h2>
          <p className="psi-lead">
            A mission connects the brief, evidence, specialist contributions, decisions and
            reviewable deliverables. The 150-role catalogue describes disciplines; only enabled
            capabilities can run.
          </p>
          <div className="psi-feature-grid">
            {[
              "Scope agreed before work starts",
              "Human approvals at lifecycle gates",
              "Portable artefacts and decision history",
            ].map((x) => (
              <div className="psi-feature" key={x}>
                <h3>{x}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>
      <FaqSection
        title="Before you commit"
        items={[
          {
            q: "What counts as a mission?",
            a: "One bounded product objective with an agreed question, inputs and deliverables—for example, evaluate an onboarding problem and produce a decision brief. A mission is not an unlimited end-to-end product build.",
          },
          {
            q: "What happens at the usage ceiling?",
            a: "Work pauses. You choose whether to reduce scope or explicitly approve additional usage and its price. Model allowances are GBP cost budgets, not a promise of a fixed number of tokens or autonomous agents.",
          },
          {
            q: "When do I pay?",
            a: "These are paid pilot offers. Account creation does not activate a subscription. Scope, access, included capabilities and billing terms must be confirmed before any payment.",
          },
          {
            q: "Is deployment or continuous learning included?",
            a: "No automatic deployment or connected outcome learning is promised in the pilot. Outputs disclose model or simulated generation. You inspect artefacts and supply observed feedback.",
          },
        ]}
      />
    </MarketingLayout>
  );
}
