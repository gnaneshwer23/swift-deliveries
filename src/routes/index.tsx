import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { Bento, BentoTile } from "@/components/marketing/bento";
import { ProductView } from "@/components/marketing/product-view";
import { FaqSection } from "@/components/marketing/faq-section";
import { OnboardingGate } from "@/components/onboarding-gate";
import { CtaLink } from "@/components/marketing/cta-link";
import { WorkforcePreview } from "@/components/marketing/workforce-preview";
import { WAVE1_AVAILABLE_IDS } from "@/lib/workforce/registry";

const WAVE1_COUNT = WAVE1_AVAILABLE_IDS.length;

const TITLE = "DeliverX — Supervised AI workforce under human authority";
const DESCRIPTION = `Command Centre for supervised AI labour: state a mission, approve a plan, execute with visible evidence. Wave 1 ships ${WAVE1_COUNT} Available capabilities — not a marketplace of 150 live agents. Career Experience and Launchpad remain available separately.`;

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
              "@type": "Product",
              name: "DeliverX Experience",
              description:
                "Work as a product manager inside realistic simulated organisations; your decisions create provenance-backed evidence.",
              url: "https://deliverx.dev/experience",
              brand: { "@id": "https://deliverx.dev/#organization" },
              offers: {
                "@type": "Offer",
                price: "19",
                priceCurrency: "GBP",
                url: "https://deliverx.dev/pricing",
                availability: "https://schema.org/InStock",
              },
            },
            {
              "@type": "Product",
              name: "DeliverX Launchpad",
              description:
                "Turn judged evidence into an explainable portfolio, honest readiness story and stronger interview preparation.",
              url: "https://deliverx.dev/launchpad",
              brand: { "@id": "https://deliverx.dev/#organization" },
              offers: {
                "@type": "Offer",
                price: "19",
                priceCurrency: "GBP",
                url: "https://deliverx.dev/pricing",
                availability: "https://schema.org/InStock",
              },
            },
            {
              "@type": "Product",
              name: "DeliverX Complete Journey",
              description:
                "Experience, Launchpad and the individual Workspace together, with the full evidence record and capability profile.",
              url: "https://deliverx.dev/pricing",
              brand: { "@id": "https://deliverx.dev/#organization" },
              offers: {
                "@type": "Offer",
                price: "29",
                priceCurrency: "GBP",
                url: "https://deliverx.dev/pricing",
                availability: "https://schema.org/InStock",
              },
            },
            {
              "@type": "HowTo",
              name: "How DeliverX Command Centre runs a supervised mission",
              description: "Mission intake through plan, approval, execution and delivery report.",
              step: EXECUTION_STEPS.map((s, i) => ({
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

const PROBLEM = [
  {
    n: "01",
    title: "Chat is not delivery",
    body: "Generic copilots draft text. They do not own a plan, a budget, or a permission ladder.",
  },
  {
    n: "02",
    title: "Autonomous agents skip authority",
    body: "Unbounded agents spend, publish and act without an explicit human gate. That is not supervision.",
  },
  {
    n: "03",
    title: "Outcomes need evidence",
    body: "Teams need briefs, prototypes and improvements with facts labelled separately from assumptions — not a disposable thread.",
  },
];

const APPROACH = [
  {
    n: "01",
    title: "Mission, not prompt",
    body: "State an Investigate, Prototype or Improve intent in natural language.",
  },
  {
    n: "02",
    title: "Plan before labour",
    body: "The system proposes tasks, acceptance criteria, usage estimate and permissions.",
  },
  {
    n: "03",
    title: "You approve",
    body: "Nothing runs until you accept the plan within the permission ladder and budget ceiling.",
  },
  {
    n: "04",
    title: "Visible execution",
    body: "Tasks run with artefacts, evidence labels and a delivery report — not a chat dump.",
  },
];

const EXECUTION_STEPS = [
  {
    n: "01",
    name: "Intake",
    desc: "Capture the mission. Clarify missing inputs before planning.",
  },
  {
    n: "02",
    name: "Plan",
    desc: "Tasks, acceptance criteria, Wave 1 capability assignment and usage estimate.",
  },
  {
    n: "03",
    name: "Approve",
    desc: "Human gate on the plan. External actions need a separate approval.",
  },
  {
    n: "04",
    name: "Execute",
    desc: "Assigned Available capabilities run under the usage ceiling.",
  },
  {
    n: "05",
    name: "Deliver",
    desc: "Reviewable report with quality and evidence labels — not a bare Verified badge.",
  },
];

const EVIDENCE_LABELS = [
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

const USE_CASES = [
  {
    tag: "Founder",
    text: "Need a researched brief before spending engineering time — with sources and assumptions separated.",
  },
  {
    tag: "Product lead",
    text: "Want a structured prototype exploration without pretending the agent can ship to production.",
  },
  {
    tag: "Operator",
    text: "Improving an existing flow: diagnose, propose changes, stop at the budget ceiling.",
  },
  {
    tag: "Career path",
    text: "Building a defendable PM evidence record through Experience and Launchpad — separate paid product.",
  },
];

const TRUST_PILLARS = [
  {
    n: "01",
    title: "Permission ladder",
    body: "Plan → Create → Execute internally → Act externally. External actions stay blocked until you approve.",
  },
  {
    n: "02",
    title: "Usage ceiling",
    body: "Each workspace has a credit ceiling. Billable steps hard-stop when it is reached.",
  },
  {
    n: "03",
    title: "Honest quality labels",
    body: "Agent-reviewed, Automatically tested, Human-reviewed, Externally attested — never a generic Verified from inside the platform.",
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

function HomePage() {
  return (
    <MarketingLayout>
      <OnboardingGate />

      {/* HERO — brand-first, supervised workforce */}
      <div className="hero">
        <div className="hero-eyebrow">
          <span className="hero-dot" />
          <span className="x-label">Supervised AI workforce · Stage 1 preview</span>
        </div>
        <p className="hero-brand">
          Deliver<span>X</span>
        </p>
        <h1 className="hero-h1">
          A command centre for AI labour —
          <br />
          under your authority.
        </h1>
        <p className="hero-sub">
          State a mission. Approve the plan. Watch Available capabilities execute with budgets,
          permissions and evidence labels. Wave 1 ships {WAVE1_COUNT} of 150 catalogue roles — the
          rest remain Planned.
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
        <div className="hero-trust">
          <span className="hero-trust-mark">◆</span>
          Early product preview — not a marketplace of 150 live agents
        </div>
      </div>

      {/* PROBLEM */}
      <div className="steps-section">
        <div className="x-label">The problem</div>
        <h2 className="heading-1" style={{ margin: "14px 0 0", maxWidth: 640 }}>
          Knowledge work needs outcomes, not chat threads.
        </h2>
        <div className="steps-grid" style={{ marginTop: 32 }}>
          {PROBLEM.map((p) => (
            <div className="step-cell" key={p.n}>
              <div className="step-num">{p.n}</div>
              <div className="step-name">{p.title}</div>
              <div className="step-desc">{p.body}</div>
            </div>
          ))}
        </div>
      </div>

      {/* APPROACH */}
      <div className="products-section">
        <div className="x-label">The approach</div>
        <h2 className="heading-1" style={{ margin: "14px 0 28px", maxWidth: 640 }}>
          Mission → Plan → Approve → Execute → Deliver.
        </h2>
        <Bento>
          {APPROACH.map((a) => (
            <BentoTile key={a.n} span={3} label={a.n} title={a.title} body={a.body} />
          ))}
        </Bento>
      </div>

      {/* WORKFORCE */}
      <WorkforcePreview maxAvailable={8} />

      {/* EXECUTION */}
      <div className="steps-section">
        <div className="x-label">Execution loop</div>
        <h2 className="heading-1" style={{ margin: "14px 0 0", maxWidth: 640 }}>
          Five gates. No silent autonomy.
        </h2>
        <div className="steps-grid" style={{ marginTop: 32 }}>
          {EXECUTION_STEPS.map((s) => (
            <div className="step-cell" key={s.n}>
              <div className="step-num">{s.n}</div>
              <div className="step-name">{s.name}</div>
              <div className="step-desc">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* EVIDENCE */}
      <div className="products-section">
        <div className="x-label">Evidence discipline</div>
        <h2 className="heading-1" style={{ margin: "14px 0 28px", maxWidth: 640 }}>
          Facts, assumptions and speculation stay separate.
        </h2>
        <div className="products-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
          {EVIDENCE_LABELS.map((e) => (
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
      </div>

      {/* PREVIEW — product view */}
      <div className="products-section">
        <div className="x-label">Inside Command Centre</div>
        <h2 className="heading-1" style={{ margin: "14px 0 28px", maxWidth: 640 }}>
          What a supervised mission looks like.
        </h2>
        <ProductView
          frameLabel="Mission delivery · sample labels"
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
      </div>

      {/* USE CASES */}
      <div className="uc-section">
        <h2 className="heading-2" style={{ marginBottom: 8 }}>
          Who this is for
        </h2>
        <p className="body" style={{ marginBottom: 0 }}>
          Operators who need supervised outcomes — and candidates who still need a career record.
        </p>
        <div className="uc-grid">
          {USE_CASES.map((u, i) => (
            <div className="uc-item" key={i}>
              <div className="uc-tag">{u.tag}</div>
              <div className="uc-problem">{u.text}</div>
            </div>
          ))}
        </div>
      </div>

      {/* TRUST */}
      <div className="trust-section">
        <div className="trust-inner">
          <div className="trust-eyebrow">GOVERNANCE</div>
          <h2 className="trust-heading">
            Supervision is the product.
            <br />
            <em>Autonomy without a gate is not.</em>
          </h2>
          <div className="trust-pillars">
            {TRUST_PILLARS.map((p) => (
              <div className="trust-pillar" key={p.n}>
                <div className="trust-pillar-n">{p.n}</div>
                <div className="trust-pillar-title">{p.title}</div>
                <div className="trust-pillar-body">{p.body}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CAREER PRODUCT — secondary */}
      <div className="steps-section">
        <div className="x-label">Also available · Career evidence</div>
        <h2 className="heading-1" style={{ margin: "14px 0 0", maxWidth: 640 }}>
          Do the job. Keep the proof. Earn the signal.
        </h2>
        <p className="body" style={{ marginTop: 14, maxWidth: 560 }}>
          Experience, Launchpad and Prove remain the paid career path: realistic PM work, a
          provenance-backed record, and Verified only via external attestation.
        </p>
        <div className="products-grid" style={{ marginTop: 32 }}>
          <Link to="/experience" className="product-card">
            <div className="product-card-head">
              <div className="product-card-num">01</div>
              <div className="product-card-name">Experience</div>
              <div className="product-card-tag">Build the experience</div>
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
              <div className="product-card-tag">Land the opportunity</div>
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
      </div>

      {/* PRICING / EARLY ACCESS */}
      <div className="products-section">
        <div className="x-label">Access</div>
        <h2 className="heading-1" style={{ margin: "14px 0 28px", maxWidth: 640 }}>
          Command Centre preview and career plans.
        </h2>
        <Bento>
          <BentoTile
            span={3}
            onInk
            label="Command Centre"
            title="Early access"
            body={`Stage 1 preview with ${WAVE1_COUNT} Wave 1 Available capabilities, local usage ceiling and plan approval. Sign up to open Command Centre.`}
            foot="Open Command Centre →"
          />
          <BentoTile
            span={3}
            label="Experience"
            title="£19 / month"
            body="Realistic product work and the evidence record that comes out of it."
          />
          <BentoTile
            span={2}
            label="Launchpad"
            title="£19 / month"
            body="Portfolio, readiness story, interview practice and application tracking."
          />
          <BentoTile
            span={2}
            label="Complete Journey"
            title="£29 / month"
            body="Experience, Launchpad and individual Workspace. Sponsor workspaces are separate."
          />
        </Bento>
        <div style={{ marginTop: 20, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <CtaLink
            signedInTo="/command"
            signedInLabel="Open Command Centre"
            signedOutLabel="Open Command Centre"
          />
          <Link to="/pricing" className="btn btn-secondary">
            See career plans
          </Link>
        </div>
      </div>

      {/* HONESTY */}
      <div className="uc-section" style={{ paddingTop: 0 }}>
        <div className="card">
          <div className="x-label">What we do not promise</div>
          <ul
            className="body"
            style={{ marginTop: 14, display: "grid", gap: 8, listStyle: "disc", paddingLeft: 20 }}
          >
            <li>No claim that all 150 catalogue roles are Available or live.</li>
            <li>No unbounded autonomous spend or silent external actions.</li>
            <li>No job guarantee, and no employer marketplace.</li>
            <li>No Verified signal from anything that happens only inside the platform.</li>
          </ul>
        </div>
      </div>

      <FaqSection items={HOME_FAQ} />

      {/* FINAL CTA */}
      <div className="cta-section">
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
            <Link to="/pricing" className="btn btn-secondary">
              Career plans
            </Link>
            <Link to="/how-it-works" className="btn btn-secondary">
              How it works
            </Link>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
