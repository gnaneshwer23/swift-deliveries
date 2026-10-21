import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { Bento, BentoTile } from "@/components/marketing/bento";
import { ProductView } from "@/components/marketing/product-view";
import { FaqSection } from "@/components/marketing/faq-section";
import { OnboardingGate } from "@/components/onboarding-gate";
import { CtaLink } from "@/components/marketing/cta-link";
import { WorkforcePreview } from "@/components/marketing/workforce-preview";
import { CommandCentreComposition } from "@/components/marketing/command-centre-composition";
import { WAVE1_AVAILABLE_IDS } from "@/lib/workforce/registry";

const WAVE1_COUNT = WAVE1_AVAILABLE_IDS.length;

const TITLE = "DeliverX — AI work that follows a plan";
const DESCRIPTION = `Command Centre for supervised AI labour: Investigate, Prototype or Improve under your approval. Wave 1 ships ${WAVE1_COUNT} Available capabilities — not 150 live agents. Career Experience and Launchpad remain available separately.`;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://deliverx.dev/" },
      { property: "og:site_name", content: "DeliverX" },
      { property: "og:locale", content: "en_GB" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: "https://deliverx.dev/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": "https://deliverx.dev/#organization",
              name: "DeliverX",
              url: "https://deliverx.dev/",
              logo: "https://deliverx.dev/favicon.svg",
              description: DESCRIPTION,
            },
            {
              "@type": "WebSite",
              "@id": "https://deliverx.dev/#website",
              url: "https://deliverx.dev/",
              name: "DeliverX",
              description: DESCRIPTION,
              inLanguage: "en-GB",
              publisher: { "@id": "https://deliverx.dev/#organization" },
            },
            {
              "@type": "WebPage",
              "@id": "https://deliverx.dev/#webpage",
              url: "https://deliverx.dev/",
              name: TITLE,
              description: DESCRIPTION,
              isPartOf: { "@id": "https://deliverx.dev/#website" },
            },
            {
              "@type": "SoftwareApplication",
              name: "DeliverX Command Centre",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              description:
                "Stage 1 supervised AI workforce preview: Investigate, Prototype and Improve missions with Wave 1 Available capabilities, plan approval, permission ladder and usage ceiling.",
              url: "https://deliverx.dev/",
              brand: { "@id": "https://deliverx.dev/#organization" },
            },
            {
              "@type": "HowTo",
              name: "How DeliverX Command Centre runs a supervised mission",
              description: "Mission through plan, approval, execution and delivery.",
              step: HOW_IT_WORKS.map((s, i) => ({
                "@type": "HowToStep",
                position: i + 1,
                name: s.name,
                text: s.desc,
              })),
            },
          ],
        }),
      },
    ],
  }),
  component: HomePage,
});

const MISSION_TYPES = [
  {
    n: "01",
    title: "Investigate",
    body: "Research a decision and return a brief with sourced facts labelled apart from assumptions.",
  },
  {
    n: "02",
    title: "Prototype",
    body: "Produce a reviewable product brief plus a lightweight interactive HTML or structured UI pack — not a production deploy.",
  },
  {
    n: "03",
    title: "Improve",
    body: "Diagnose friction in an existing flow and propose changes that stop at your budget ceiling.",
  },
];

const HOW_IT_WORKS = [
  {
    n: "01",
    name: "Mission",
    desc: "State Investigate, Prototype or Improve in natural language. Incomplete requests get clarification first.",
  },
  {
    n: "02",
    name: "Plan",
    desc: "Tasks, acceptance criteria, Wave 1 capability assignment and usage estimate — before any labour runs.",
  },
  {
    n: "03",
    name: "Approve",
    desc: "Nothing executes until you accept the plan within the permission ladder and budget ceiling.",
  },
  {
    n: "04",
    name: "Execute",
    desc: "Available capabilities run with visible progress. Usage hard-stops at the workspace ceiling.",
  },
  {
    n: "05",
    name: "Deliver",
    desc: "Artefacts and a delivery report with evidence and quality labels — never a bare Verified badge.",
  },
];

const GOVERNANCE = [
  {
    n: "01",
    title: "Permission ladder",
    body: "Plan → Create → Execute internally → Act externally. External actions stay blocked until you approve.",
  },
  {
    n: "02",
    title: "Usage ceilings",
    body: "Each workspace has a credit ceiling. Billable steps hard-stop when it is reached — no silent overspend.",
  },
  {
    n: "03",
    title: "Approvals",
    body: "The plan is a human gate. Revising or rejecting is first-class; autonomy without a gate is not the product.",
  },
  {
    n: "04",
    title: "Audit trail",
    body: "Mission status, plan acceptance and task outcomes are recorded so you can inspect what ran and why.",
  },
];

const DELIVERABLES = [
  {
    n: "01",
    title: "Sourced facts",
    body: "Traceable to an input or cited source.",
  },
  {
    n: "02",
    title: "Assumptions",
    body: "Explicitly assumed for the mission — never disguised as fact.",
  },
  {
    n: "03",
    title: "Inferences",
    body: "Derived from facts plus assumptions, labelled as such.",
  },
  {
    n: "04",
    title: "Speculative",
    body: "Weakly grounded suggestion — visible, not smuggled into certainty.",
  },
];

const ROADMAP = [
  {
    n: "Now · Stage 1",
    title: "Supervised preview",
    body: `${WAVE1_COUNT} Wave 1 Available capabilities, deterministic planner/executor, plan approval, local usage ceiling, artefacts and delivery reports.`,
  },
  {
    n: "Next",
    title: "Deeper review loops",
    body: "Richer human-review workflows and stronger artefact inspection — still under your authority.",
  },
  {
    n: "Later",
    title: "Connectors & metering",
    body: "Live model routing, external connectors (email, deploy, Slack, GitHub write) and commercial metering. Not claimed as live today.",
  },
  {
    n: "Not promised",
    title: "Unbounded autonomy",
    body: "No marketplace of 150 live agents, no silent external actions, no job guarantee from the career path.",
  },
];

const HOME_FAQ = [
  {
    q: "Is the full 150-role workforce live?",
    a: `No. The catalogue describes 150 specialist capabilities. Wave 1 makes ${WAVE1_COUNT} of them Available in Command Centre. The rest are Planned and are not assigned to missions.`,
  },
  {
    q: "What is Command Centre?",
    a: "The Stage 1 product surface: you state a mission (Investigate, Prototype or Improve), review a plan, approve within a permission ladder and budget, then receive artefacts and a delivery report.",
  },
  {
    q: "How is this different from Experience and Launchpad?",
    a: "Command Centre is supervised AI labour for outcomes. Experience and Launchpad are the career evidence product — simulated PM work, a provenance-backed record, and external attestation. Both coexist; pricing for career plans is unchanged.",
  },
  {
    q: "Does DeliverX guarantee a job or place me with employers?",
    a: "No. There is no job guarantee, no money-back guarantee, and no employer marketplace.",
  },
  {
    q: "What does Verified mean on the career product?",
    a: "Only that a person outside DeliverX attested to a specific piece of work. Scores, coach confirmation and platform calculations never light Verified alone. Workforce missions use separate quality labels.",
  },
];

const docIcon = (
  <svg
    aria-hidden="true"
    width="14"
    height="14"
    fill="none"
    stroke="var(--x-slate)"
    strokeWidth="1.5"
    viewBox="0 0 24 24"
  >
    <path
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const clipIcon = (
  <svg
    aria-hidden="true"
    width="14"
    height="14"
    fill="none"
    stroke="var(--x-slate)"
    strokeWidth="1.5"
    viewBox="0 0 24 24"
  >
    <path
      d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const badgeIcon = (
  <svg
    aria-hidden="true"
    width="14"
    height="14"
    fill="none"
    stroke="var(--x-amber)"
    strokeWidth="1.5"
    viewBox="0 0 24 24"
  >
    <path
      d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

function HomePage() {
  return (
    <MarketingLayout>
      <OnboardingGate />

      {/* 1. HERO — brand + plan-first outcome + Command Centre composition */}
      <section className="hero hero-workforce">
        <div className="hero-copy">
          <div className="hero-eyebrow">
            <span className="hero-dot" />
            <span className="x-label">Supervised AI workforce · Stage 1</span>
          </div>
          <p className="hero-brand">
            Deliver<span>X</span>
          </p>
          <h1 className="hero-h1">
            AI work that follows a plan.
            <br />
            You stay in control.
          </h1>
          <p className="hero-sub">
            State a mission. Approve the plan. Wave 1 ships {WAVE1_COUNT} Available capabilities —
            the rest of the catalogue stay Planned.
          </p>
          <div className="hero-actions">
            <CtaLink
              signedInTo="/command"
              signedInLabel="Open Command Centre"
              signedOutLabel="Open Command Centre"
            />
            <Link to="/how-it-works" className="btn btn-secondary">
              How it works
            </Link>
          </div>
        </div>
        <div className="hero-visual">
          <CommandCentreComposition />
          <p className="hero-visual-note">
            Labelled product concept — mirrors Command Centre Stage 1 chrome
          </p>
        </div>
      </section>

      {/* 2. Three mission types */}
      <section className="steps-section">
        <div className="x-label">Mission types</div>
        <h2 className="heading-1" style={{ margin: "14px 0 0", maxWidth: 640 }}>
          Investigate. Prototype. Improve.
        </h2>
        <p className="body" style={{ marginTop: 14, maxWidth: 560 }}>
          Three intents. Same supervision loop. No free-form autonomous agent.
        </p>
        <div className="steps-grid" style={{ marginTop: 32 }}>
          {MISSION_TYPES.map((m) => (
            <div className="step-cell" key={m.n}>
              <div className="step-num">{m.n}</div>
              <div className="step-name">{m.title}</div>
              <div className="step-desc">{m.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. How it works */}
      <section className="products-section">
        <div className="x-label">How it works</div>
        <h2 className="heading-1" style={{ margin: "14px 0 28px", maxWidth: 640 }}>
          Mission → Plan → Approve → Execute → Deliver
        </h2>
        <Bento>
          {HOW_IT_WORKS.map((s) => (
            <BentoTile
              key={s.n}
              span={s.n === "03" ? 4 : 2}
              label={s.n}
              title={s.name}
              body={s.desc}
              onInk={s.n === "03"}
            />
          ))}
        </Bento>
      </section>

      {/* 4. Meet the workforce */}
      <WorkforcePreview maxAvailable={8} />

      {/* 5. Control and governance */}
      <section className="trust-section">
        <div className="trust-inner">
          <div className="trust-eyebrow">CONTROL AND GOVERNANCE</div>
          <h2 className="trust-heading">
            Permissions, ceilings, approvals.
            <br />
            <em>Supervision is the product.</em>
          </h2>
          <div className="trust-pillars">
            {GOVERNANCE.map((p) => (
              <div className="trust-pillar" key={p.n}>
                <div className="trust-pillar-n">{p.n}</div>
                <div className="trust-pillar-title">{p.title}</div>
                <div className="trust-pillar-body">{p.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Inspect deliverables */}
      <section className="products-section">
        <div className="x-label">Inspect deliverables</div>
        <h2 className="heading-1" style={{ margin: "14px 0 14px", maxWidth: 640 }}>
          Stage 1 artefacts with evidence labels.
        </h2>
        <p className="body" style={{ marginBottom: 28, maxWidth: 560 }}>
          Facts, assumptions and speculation stay separate. Quality labels are discrete —
          Agent-reviewed, Automatically tested, Human-reviewed, Externally attested.
        </p>
        <ProductView
          frameLabel="Delivery report · sample labels"
          note="Illustrative sample format — not a live customer result."
        >
          <div className="record-row">
            <span className="record-index">01</span>
            <div className="record-icon-wrap">{docIcon}</div>
            <div className="record-body">
              <div className="record-title">Investigate — competitor pricing brief</div>
              <div className="record-sub">
                intent:investigate · DX-011 · DX-012 · DX-020 · usage:12/100
              </div>
            </div>
            <div className="record-stat">
              <div className="record-band">Plan</div>
              <div className="record-band-label">Approved</div>
            </div>
            <span className="pill pill-teal">Sourced facts</span>
          </div>
          <div className="record-row">
            <span className="record-index">02</span>
            <div className="record-icon-wrap">{clipIcon}</div>
            <div className="record-body">
              <div className="record-title">Prototype — onboarding wireframe pack</div>
              <div className="record-sub">
                intent:prototype · DX-035 · DX-023 · permission:create
              </div>
            </div>
            <div className="record-stat">
              <div className="record-band">Running</div>
              <div className="record-band-label">Tasks 3/5</div>
            </div>
            <span className="pill pill-neutral">Assumptions</span>
          </div>
          <div className="record-row">
            <span className="record-index">03</span>
            <div className="record-icon-wrap">{badgeIcon}</div>
            <div className="record-body">
              <div className="record-title">Improve — checkout drop-off diagnosis</div>
              <div className="record-sub">
                intent:improve · DX-049 · DX-071 · quality:agent-reviewed
              </div>
            </div>
            <div className="record-stat">
              <div className="record-band" style={{ color: "var(--x-amber)" }}>
                Done
              </div>
              <div className="record-band-label">Report ready</div>
            </div>
            <span className="pill pill-amber">Agent-reviewed</span>
          </div>
        </ProductView>
        <div
          className="products-grid"
          style={{ gridTemplateColumns: "repeat(2, 1fr)", marginTop: 28 }}
        >
          {DELIVERABLES.map((e) => (
            <div className="product-card" key={e.n} style={{ cursor: "default" }}>
              <div className="product-card-head">
                <div className="product-card-num">{e.n}</div>
                <div className="product-card-name">{e.title}</div>
              </div>
              <div className="product-card-body">
                <div className="product-card-desc">{e.body}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. What happens next — honest roadmap */}
      <section className="steps-section">
        <div className="x-label">What happens next</div>
        <h2 className="heading-1" style={{ margin: "14px 0 0", maxWidth: 640 }}>
          An honest roadmap. No false connectors.
        </h2>
        <p className="body" style={{ marginTop: 14, maxWidth: 560 }}>
          Stage 1 is a supervised preview. Later stages add depth — they are not shipping claims.
        </p>
        <div className="steps-grid" style={{ marginTop: 32 }}>
          {ROADMAP.map((r) => (
            <div className="step-cell" key={r.n}>
              <div className="step-num" style={{ letterSpacing: "0.02em" }}>
                {r.n}
              </div>
              <div className="step-name">{r.title}</div>
              <div className="step-desc">{r.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 8. Existing DeliverX products — secondary */}
      <section className="products-section career-secondary">
        <div className="x-label">Existing DeliverX products</div>
        <h2 className="heading-1" style={{ margin: "14px 0 0", maxWidth: 640 }}>
          Career evidence — a separate path.
        </h2>
        <p className="body" style={{ marginTop: 14, maxWidth: 560 }}>
          Experience, Launchpad and Prove remain available if you need a defendable PM record.
          Verified still requires external attestation. Career Stripe pricing is unchanged.
        </p>
        <div className="products-grid" style={{ marginTop: 32 }}>
          <Link to="/experience" className="product-card">
            <div className="product-card-head">
              <div className="product-card-num">01</div>
              <div className="product-card-name">Experience</div>
              <div className="product-card-tag">£19 / month</div>
            </div>
            <div className="product-card-body">
              <div className="product-card-desc">
                Simulated organisations. Your actions create the evidence ledger.
              </div>
              <div className="product-card-link">Experience →</div>
            </div>
          </Link>
          <Link to="/launchpad" className="product-card">
            <div className="product-card-head">
              <div className="product-card-num">02</div>
              <div className="product-card-name">Launchpad</div>
              <div className="product-card-tag">£19 / month</div>
            </div>
            <div className="product-card-body">
              <div className="product-card-desc">
                Portfolio, readiness story and interview practice from real evidence.
              </div>
              <div className="product-card-link">Launchpad →</div>
            </div>
          </Link>
          <Link to="/prove" className="product-card">
            <div className="product-card-head">
              <div className="product-card-num">03</div>
              <div className="product-card-name">Prove</div>
              <div className="product-card-tag">External attestation</div>
            </div>
            <div className="product-card-body">
              <div className="product-card-desc">
                Verified lights only when someone outside DeliverX attests.
              </div>
              <div className="product-card-link">Prove →</div>
            </div>
          </Link>
        </div>
        <div style={{ marginTop: 20 }}>
          <Link to="/pricing" className="btn btn-secondary">
            See career plans
          </Link>
        </div>
      </section>

      {/* 9. Final CTA + FAQs */}
      <FaqSection items={HOME_FAQ} />

      <section className="cta-section">
        <div className="cta-box">
          <h2 className="cta-h">Put AI labour under a plan you approve.</h2>
          <p className="cta-sub">
            Open Command Centre for the Stage 1 workforce preview — or start the career evidence
            path if that is what you need.
          </p>
          <div className="cta-btns">
            <CtaLink
              signedInTo="/command"
              signedInLabel="Open Command Centre"
              signedOutLabel="Open Command Centre"
            />
            <Link to="/signup" className="btn btn-secondary">
              Create account
            </Link>
            <Link to="/how-it-works" className="btn btn-secondary">
              How it works
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
