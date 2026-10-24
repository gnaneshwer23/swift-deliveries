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
      "Experiment planning and project export",
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
      "Evidence-to-decision mission scope",
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
            Compare proposed paid pilot scopes. Prepare your question first; availability, included
            capabilities and billing must be agreed before paid work starts.
          </p>
          <p className="psi-fine-print">
            These are proposed paid pilot offers, not active subscriptions. Requesting a pilot
            stores an enquiry. It does not take payment or enforce quotas. Checkout is not live.
            Prices exclude applicable taxes. No annual commitment.
          </p>
          <div className="psi-price-grid">
            {PLANS.map((plan) => (
              <article className="psi-plan" key={plan.id}>
                <p className="dxl-eyebrow">
                  {plan.id === "founder" ? "For your next product decision" : "Paid pilot"}
                </p>
                <h2>{plan.name}</h2>
                <p>{plan.audience}</p>
                <div className="psi-plan-price">
                  £{plan.price}
                  <small> / month</small>
                </div>
                <Link to="/pilot" search={{ plan: plan.id }} className="dxl-btn dxl-btn-primary">
                  Request {plan.name}
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
          <p className="dxl-eyebrow">Proposed pilot deliverables</p>
          <h2 className="dxl-h2">One bounded question. A record you can inspect.</h2>
          <p className="psi-lead">
            A mission connects the brief, evidence, specialist contributions, decisions and
            reviewable deliverables. The 150-role catalogue describes disciplines; only enabled
            capabilities can run.
          </p>
          <p className="journey-status">
            A first pilot is proposed to deliver a mission brief, evidence register, alternatives
            and owner decision, experiment brief and export. A prototype is an agreed extension.
            Seat, product and mission quotas are proposed offer limits, not currently enforced
            entitlements.
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
            a: "The proposed pilot rule is to pause and agree reduced scope or additional usage before continuing. Model allowances are GBP cost budgets; measured provider-cost enforcement still requires release verification. No automatic overage is offered.",
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
