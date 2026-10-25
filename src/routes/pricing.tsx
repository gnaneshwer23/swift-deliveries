import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ShieldCheck } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { pageHead } from "@/components/marketing/page-head";
import {
  ACCOUNT_DOES_NOT_ACTIVATE,
  ALLOWANCE_EXHAUSTED_COPY,
  CHECKOUT_NOT_LIVE_COPY,
  MANUAL_ACTIVATION_COPY,
  PUBLISHED_OPERATOR_EMAIL,
  SUPPORT_RECOVERY_COPY,
} from "@/lib/pilot/commercial-copy";

export const Route = createFileRoute("/pricing")({
  head: () =>
    pageHead(
      "/pricing",
      "Pricing & Pilot — Choose your product scope | DeliverX",
      "Compare proposed paid pilots: Builder £29, Founder £99 and Studio £299 per month. Clear mission scope, usage limits and human approval.",
    ),
  component: Pricing,
});

export const PLANS = [
  {
    id: "builder",
    name: "Builder",
    price: 29,
    audience: "For students and individual product builders",
    products: 1,
    people: "1 owner",
    missions: 1,
    usage: 5,
    focus: "Explore one product question.",
    features: [
      "Brief, evidence review and decision record",
      "Experiment planning and project export",
    ],
  },
  {
    id: "founder",
    name: "Founder",
    price: 99,
    audience: "For founders validating and shaping a product",
    products: 3,
    people: "Up to 3 collaborators",
    missions: 4,
    usage: 20,
    focus: "Develop your next product direction.",
    features: ["Evidence-to-decision mission scope", "Decision reviews and pilot onboarding"],
  },
  {
    id: "studio",
    name: "Studio",
    price: 299,
    audience: "For small teams working across a product portfolio",
    products: 10,
    people: "Up to 10 collaborators",
    missions: 12,
    usage: 60,
    focus: "Coordinate questions across products.",
    features: ["Cross-discipline mission planning", "Team onboarding and a monthly pilot review"],
  },
] as const;

const QUESTIONS = [
  {
    q: "What counts as one mission?",
    a: "One bounded product objective with agreed inputs and deliverables. For example: investigate an onboarding problem and prepare a decision brief. It is not an unlimited end-to-end product build.",
  },
  {
    q: "What happens when my allowance is used?",
    a: `${ALLOWANCE_EXHAUSTED_COPY} Additional usage needs a new agreement. There is no automatic overage charge. Model budgets above are proposed limits, not an unlimited token allowance.`,
  },
  {
    q: "Does requesting a plan start billing?",
    a: `${ACCOUNT_DOES_NOT_ACTIVATE} ${CHECKOUT_NOT_LIVE_COPY} Scope, availability and billing must be agreed before paid work starts. ${MANUAL_ACTIVATION_COPY}`,
  },
  {
    q: "Are all 150 specialists available to run?",
    a: "The 150-role catalogue describes the product disciplines. Only enabled capabilities can run. Your pilot agreement identifies the available capabilities; a catalogue role is not a promise of an independently operating agent.",
  },
  {
    q: "Does a pilot include a prototype or deployment?",
    a: "A prototype requires an agreed extension. Automatic deployment and connected outcome collection are not included promises. Outputs disclose model or simulated generation. You inspect the work and supply genuine observations for review.",
  },
  { q: "How do I get help or review a failed request?", a: SUPPORT_RECOVERY_COPY },
];

function Pricing() {
  return (
    <MarketingLayout>
      <div className="pricing-redesign">
        <section className="pricing-opening">
          <div className="dxl-wrap">
            <div className="pricing-heading">
              <div>
                <p className="dxl-eyebrow">Pricing & Pilot</p>
                <h1>
                  Choose the scope.
                  <br />
                  Keep control of the spend.
                </h1>
              </div>
              <div className="pricing-heading-note">
                <p>
                  Start with a bounded product question. Choose the proposed pilot scope that fits
                  your work, then agree the details with us.
                </p>
                <span>GBP · Monthly · No annual commitment</span>
              </div>
            </div>
            <div className="pricing-availability">
              <span className="pricing-status-dot" aria-hidden="true" />
              <div>
                <strong>Paid pilots · By agreement</strong>
                <p>
                  Proposed offers, not active subscriptions. Checkout is not live. Requesting a plan
                  does not charge you.
                </p>
              </div>
              <a href="#pilot-process">How activation works</a>
            </div>
            <div className="pricing-offers">
              {PLANS.map((plan) => (
                <article
                  className={`pricing-offer ${plan.id === "founder" ? "pricing-offer-featured" : ""}`}
                  key={plan.id}
                  aria-labelledby={`plan-${plan.id}`}
                >
                  <div className="pricing-offer-top">
                    <span>
                      {plan.id === "founder"
                        ? "For shaping a product"
                        : plan.id === "builder"
                          ? "For individual exploration"
                          : "For a product portfolio"}
                    </span>
                    <h2 id={`plan-${plan.id}`}>{plan.name}</h2>
                    <p>{plan.audience}</p>
                  </div>
                  <div className="pricing-cost">
                    <span>£{plan.price}</span>
                    <span>/ month</span>
                  </div>
                  <p className="pricing-focus">{plan.focus}</p>
                  <Link
                    to="/pilot"
                    search={{ plan: plan.id }}
                    className={`dxl-btn ${plan.id === "founder" ? "dxl-btn-primary" : "dxl-btn-ghost"}`}
                  >
                    Request {plan.name} pilot
                  </Link>
                  <dl className="pricing-plan-limits">
                    <div>
                      <dt>Product scope</dt>
                      <dd>
                        {plan.products} {plan.products === 1 ? "product" : "products"}
                      </dd>
                    </div>
                    <div>
                      <dt>People</dt>
                      <dd>{plan.people}</dd>
                    </div>
                    <div>
                      <dt>Monthly missions</dt>
                      <dd>
                        {plan.missions} scoped {plan.missions === 1 ? "mission" : "missions"}
                      </dd>
                    </div>
                    <div>
                      <dt>Included model budget</dt>
                      <dd>Up to £{plan.usage}</dd>
                    </div>
                  </dl>
                  <ul>
                    {plan.features.map((feature) => (
                      <li key={feature}>
                        <Check size={16} aria-hidden="true" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
            <div className="pricing-offer-footnote">
              <p>
                All product, collaborator, mission and model-budget limits are proposed and
                confirmed in your pilot agreement. Prices exclude applicable taxes.
              </p>
              <p>No automatic overage charges. Additional usage needs a new agreement.</p>
            </div>
            <nav className="pricing-page-links" aria-label="Pricing details">
              <Link to="/how-it-works" hash="sample-documents">
                What a mission delivers
              </Link>
              <a href="#pilot-process">From request to pilot</a>
              <a href="#pricing-questions">Questions before you start</a>
            </nav>
          </div>
        </section>
        <section className="pricing-process-section" id="pilot-process">
          <div className="dxl-wrap">
            <div className="pricing-section-heading">
              <div>
                <p className="dxl-eyebrow">From request to pilot</p>
                <h2>
                  Agree the work.
                  <br />
                  Then activate the scope.
                </h2>
              </div>
              <p>
                Creating an account does not activate a paid pilot. A request is an enquiry, and an
                activation record is not proof that payment was taken.
              </p>
            </div>
            <ol className="pricing-process">
              {[
                {
                  name: "Share your question",
                  detail:
                    "Choose a plan and send the product objective, context and constraints you want us to review.",
                },
                {
                  name: "Agree the pilot",
                  detail:
                    "Confirm availability, deliverables, enabled capabilities, usage limits and billing before paid work starts.",
                },
                {
                  name: "Activate your workspace",
                  detail:
                    "An authorised operator records the agreed plan and mission allowance for one workspace.",
                },
                {
                  name: "Review the work",
                  detail:
                    "Inspect the evidence and recommendations. You approve consequential scope and supply observed feedback.",
                },
              ].map((step, index) => (
                <li key={step.name}>
                  <span>0{index + 1}</span>
                  <h3>{step.name}</h3>
                  <p>{step.detail}</p>
                </li>
              ))}
            </ol>
            <div className="pricing-budget-note">
              <ShieldCheck aria-hidden="true" />
              <div>
                <h3>When your allowance is used, billable work stops.</h3>
                <p>
                  Nothing is charged on top. Your missions stay readable and nothing is deleted. To
                  do more, you agree a new allowance with us.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="pricing-faq-section" id="pricing-questions">
          <div className="dxl-wrap pricing-faq-layout">
            <div>
              <p className="dxl-eyebrow">Before you start</p>
              <h2>
                Know what
                <br />
                you’re agreeing to.
              </h2>
              <p>Need help choosing a scope or reviewing a request?</p>
              <a className="dxl-link" href={`mailto:${PUBLISHED_OPERATOR_EMAIL}`}>
                Contact the pilot team
              </a>
            </div>
            <div className="pricing-faq">
              {QUESTIONS.map((item) => (
                <details key={item.q}>
                  <summary>
                    {item.q}
                    <span aria-hidden="true">+</span>
                  </summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
        <section className="pricing-closing">
          <div className="dxl-wrap">
            <div>
              <h2>Still shaping the question?</h2>
              <p>
                Prepare your brief first. You can download it without committing to a paid pilot.
              </p>
            </div>
            <Link to="/resources" hash="brief-builder" className="dxl-btn dxl-btn-primary">
              Prepare your brief
            </Link>
          </div>
        </section>
      </div>
    </MarketingLayout>
  );
}
