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
    tag: "Decision Research",
    title: "Investigate",
    body: "Research a strategic or product decision and return a structured brief with sourced facts explicitly separated from assumptions and inferences.",
    capabilities: ["DX-001", "DX-011", "DX-012", "DX-020"],
    permission: "Plan → Create",
    deliverable: "Decision Brief + Evidence Matrix",
  },
  {
    n: "02",
    tag: "Product & UI Specification",
    title: "Prototype",
    body: "Produce a reviewable PRD and a lightweight, sandboxed interactive HTML or structured UI pack — never an unapproved production deploy.",
    capabilities: ["DX-021", "DX-023", "DX-035", "DX-049"],
    permission: "Create (Sandboxed)",
    deliverable: "Product Spec + Interactive HTML Pack",
  },
  {
    n: "03",
    tag: "Flow & Funnel Diagnostics",
    title: "Improve",
    body: "Diagnose friction in an existing workflow, isolate root causes, and propose bounded remediation steps that hard-stop at your budget ceiling.",
    capabilities: ["DX-018", "DX-041", "DX-049", "DX-071"],
    permission: "Execute internally",
    deliverable: "Friction Diagnosis + Remediation Diff",
  },
];

const HOW_IT_WORKS = [
  {
    n: "01",
    name: "Mission",
    gate: "Intent + Clarification",
    desc: "Select Investigate, Prototype or Improve and state your objective in plain English. Ambiguous requests trigger structured clarification before any plan is drafted.",
  },
  {
    n: "02",
    name: "Plan",
    gate: "Wave 1 Assignment",
    desc: "Receive a task graph, acceptance criteria, credit estimate and capability assignment drawn strictly from the 12 Available Wave 1 roles.",
  },
  {
    n: "03",
    name: "Approve",
    gate: "Mandatory Human Gate",
    desc: "Nothing executes until you explicitly approve the plan within the permission ladder and workspace credit ceiling. External actions require separate authorisation.",
  },
  {
    n: "04",
    name: "Execute",
    gate: "Deterministic Ceiling",
    desc: "Approved tasks execute step-by-step with live status visibility. Billable work hard-stops automatically if the workspace usage ceiling is reached.",
  },
  {
    n: "05",
    name: "Deliver",
    gate: "Evidence & Quality Labels",
    desc: "Inspect artefacts and a delivery report with classified evidence (Sourced facts, Assumptions, Inferences, Speculative) and discrete quality labels.",
  },
];

const GOVERNANCE = [
  {
    n: "01 · AUTHORITY",
    title: "Four-tier permission ladder",
    body: "Plan → Create → Execute internally → Act externally. External actions (email, deploy, webhook, share) remain locked behind an explicit second approval.",
    service: "svc-permissions · Deterministic service",
  },
  {
    n: "02 · COST CONTROL",
    title: "Hard-stop usage ceilings",
    body: "Every workspace enforces a deterministic credit ceiling (default 100 credits). Tasks check remaining budget before running — zero silent overspend.",
    service: "svc-budget · Deterministic service",
  },
  {
    n: "03 · SUPERVISION",
    title: "Plan-first human approval gate",
    body: "No free-form autonomous loop. You inspect assigned capabilities, acceptance criteria, and limitations before queuing a single task.",
    service: "Stage 1 Human-in-the-loop Gate",
  },
  {
    n: "04 · PROVENANCE",
    title: "Immutable audit & quality trail",
    body: "Every state transition, approval decision, and credit charge is logged. Workforce outputs carry specific quality labels — never a bare 'Verified' claim.",
    service: "svc-audit · Deterministic service",
  },
];

const DELIVERABLES = [
  {
    n: "01",
    badge: "pill-teal",
    title: "Sourced facts",
    body: "Directly traceable to your mission brief, workspace context, or a cited reference.",
  },
  {
    n: "02",
    badge: "pill-neutral",
    title: "Assumptions",
    body: "Working premises stated openly so stakeholders can challenge or validate them before acting.",
  },
  {
    n: "03",
    badge: "pill-purple",
    title: "Inferences",
    body: "Conclusions reasoned from sourced facts and stated assumptions — labelled clearly as analytical synthesis.",
  },
  {
    n: "04",
    badge: "pill-amber",
    title: "Speculative",
    body: "Directional hypotheses or low-confidence options surfaced for exploration, never smuggled into certainty.",
  },
];

const ROADMAP = [
  {
    n: "Now · Stage 1",
    status: "Live in preview",
    title: "Supervised Command Centre",
    body: `${WAVE1_COUNT} Wave 1 Available capabilities, deterministic planner/executor, mandatory plan approval, hard-stop usage ceiling, artefacts and delivery reports.`,
  },
  {
    n: "Next · Stage 2",
    status: "In development",
    title: "Deeper review & diff loops",
    body: "Task-level revision comments, side-by-side artefact diffing, and multi-reviewer sign-off — still under human authority.",
  },
  {
    n: "Later · Stage 3",
    status: "Planned",
    title: "Live model routing & connectors",
    body: "Multi-model execution, gated external connectors (GitHub PRs, Slack, email, deploy) and commercial credit metering. Not claimed as live today.",
  },
  {
    n: "Never promised",
    status: "Explicit non-goal",
    title: "Unbounded autonomy",
    body: "No unverified marketplace of 150 autonomous agents, no silent external actions, and no job placement guarantee on the career path.",
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

      {/* 1. HERO — Plan-first executive headline + interactive Command Centre showcase */}
      <section className="hero hero-workforce">
        <div className="hero-copy">
          <div className="hero-eyebrow">
            <span className="hero-dot" />
            <span className="x-label">Supervised AI Workforce · Stage 1 Command Centre</span>
          </div>
          <h1 className="hero-h1">
            AI work that follows a plan.
            <br />
            <em>You stay in control.</em>
          </h1>
          <p className="hero-sub">
            Commission structured <strong>Investigate</strong>, <strong>Prototype</strong> or{" "}
            <strong>Improve</strong> missions. Review the task breakdown and assigned Wave 1
            capabilities first — nothing executes without your approval, and usage hard-stops at
            your workspace ceiling.
          </p>
          <div className="hero-actions">
            <CtaLink
              signedInTo="/command"
              signedInLabel="Open Command Centre"
              signedOutLabel="Open Command Centre"
            />
            <Link to="/how-it-works" className="btn btn-secondary">
              Explore architecture &amp; governance
            </Link>
          </div>

          {/* Executive Trust & Guardrail Strip */}
          <dl className="hero-trust-strip" aria-label="Platform guardrails">
            <div>
              <dt>{WAVE1_COUNT} Available Roles</dt>
              <dd>Wave 1 operational · 150-role catalogue</dd>
            </div>
            <div>
              <dt>Human Approval Gate</dt>
              <dd>Plan → Approve → Execute → Deliver</dd>
            </div>
            <div>
              <dt>Hard-Stop Budget</dt>
              <dd>Deterministic ceiling · zero silent spend</dd>
            </div>
          </dl>
        </div>
        <div className="hero-visual">
          <CommandCentreComposition />
          <p className="hero-visual-note">
            Interactive Stage 1 Command Centre preview — switch between Investigate, Prototype and
            Improve above to inspect the proposed plan and capability assignment.
          </p>
        </div>
      </section>

      {/* 2. Three mission types */}
      <section className="steps-section" id="mission-types">
        <div className="section-header-split">
          <div>
            <div className="x-label">Bounded Mission Intents</div>
            <h2 className="heading-1" style={{ margin: "12px 0 0", maxWidth: 640 }}>
              Investigate. Prototype. Improve.
            </h2>
          </div>
          <p className="body" style={{ margin: 0, maxWidth: 460 }}>
            Every mission enters through one of three structured intents. Each routes to a dedicated
            planner template, Wave 1 capability set, and permission boundary — never an unbounded
            chat loop.
          </p>
        </div>

        <div className="mission-cards-grid">
          {MISSION_TYPES.map((m) => (
            <article className="mission-arch-card" key={m.n}>
              <div className="mission-arch-top">
                <span className="mission-arch-num">{m.n}</span>
                <span className="mission-arch-tag">{m.tag}</span>
              </div>
              <h3 className="mission-arch-title">{m.title}</h3>
              <p className="mission-arch-body">{m.body}</p>
              <div className="mission-arch-caps" aria-label="Typical Wave 1 capabilities">
                {m.capabilities.map((capId) => (
                  <code key={capId} className="mission-arch-cap">
                    {capId}
                  </code>
                ))}
              </div>
              <div className="mission-arch-foot">
                <div>
                  <span>Permission ceiling</span>
                  <strong>{m.permission}</strong>
                </div>
                <div>
                  <span>Primary output</span>
                  <strong>{m.deliverable}</strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 3. How it works */}
      <section className="products-section" id="how-it-works">
        <div className="section-header-split">
          <div>
            <div className="x-label">Supervised Execution Lifecycle</div>
            <h2 className="heading-1" style={{ margin: "12px 0 0", maxWidth: 680 }}>
              Mission → Plan → Approve → Execute → Deliver
            </h2>
          </div>
          <p className="body" style={{ margin: 0, maxWidth: 460 }}>
            Five explicit stages backed by deterministic permission and budget services. Step 03 is
            a mandatory human gate before any task runs.
          </p>
        </div>

        <Bento>
          {HOW_IT_WORKS.map((s) => (
            <BentoTile
              key={s.n}
              span={s.n === "03" ? 4 : 2}
              label={`${s.n} · ${s.gate}`}
              title={s.name}
              body={s.desc}
              onInk={s.n === "03"}
            />
          ))}
        </Bento>
      </section>

      {/* 4. Meet the workforce */}
      <WorkforcePreview maxAvailable={12} />

      {/* 5. Control and governance */}
      <section className="trust-section" id="governance">
        <div className="trust-inner">
          <div className="trust-eyebrow">DETERMINISTIC CONTROL &amp; GOVERNANCE</div>
          <h2 className="trust-heading">
            Permissions, ceilings, approvals.
            <br />
            <em>Supervision is the architecture.</em>
          </h2>
          <p className="trust-lead">
            Budget enforcement, permission gates, and audit logging are deterministic platform
            services (`svc-budget`, `svc-permissions`, `svc-audit`) — never delegated to an AI
            agent.
          </p>
          <div className="trust-pillars">
            {GOVERNANCE.map((p) => (
              <div className="trust-pillar" key={p.n}>
                <div className="trust-pillar-n">{p.n}</div>
                <div className="trust-pillar-title">{p.title}</div>
                <div className="trust-pillar-body">{p.body}</div>
                <div className="trust-pillar-service">{p.service}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Inspect deliverables */}
      <section className="products-section">
        <div className="section-header-split">
          <div>
            <div className="x-label">Inspectable Deliverables &amp; Epistemic Honesty</div>
            <h2 className="heading-1" style={{ margin: "12px 0 0", maxWidth: 640 }}>
              Stage 1 artefacts with explicit evidence labels.
            </h2>
          </div>
          <p className="body" style={{ margin: 0, maxWidth: 460 }}>
            Facts, assumptions, inferences and speculation are classified separately. Quality labels
            are discrete — <strong>Agent-reviewed</strong>, <strong>Automatically tested</strong>,{" "}
            <strong>Human-reviewed</strong>, or <strong>Externally attested</strong>.
          </p>
        </div>

        <div style={{ marginTop: 32 }}>
          <ProductView
            frameLabel="Command Centre · Delivery ledger & evidence classification preview"
            note="Illustrative Stage 1 format — demonstrates separated evidence and discrete quality labels."
          >
            <div className="record-row">
              <span className="record-index">01</span>
              <div className="record-icon-wrap">{docIcon}</div>
              <div className="record-body">
                <div className="record-title">Investigate — sponsor reporting decision brief</div>
                <div className="record-sub">
                  intent:investigate · DX-011 · DX-012 · DX-020 · usage:18/100 credits
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
                <div className="record-title">Prototype — usage ceiling notification wireframe</div>
                <div className="record-sub">
                  intent:prototype · DX-021 · DX-023 · DX-035 · permission:create
                </div>
              </div>
              <div className="record-stat">
                <div className="record-band">Running</div>
                <div className="record-band-label">Tasks 2/3</div>
              </div>
              <span className="pill pill-neutral">Assumptions</span>
            </div>
            <div className="record-row">
              <span className="record-index">03</span>
              <div className="record-icon-wrap">{badgeIcon}</div>
              <div className="record-body">
                <div className="record-title">Improve — checkout drop-off remediation plan</div>
                <div className="record-sub">
                  intent:improve · DX-018 · DX-041 · DX-071 · quality:agent-reviewed
                </div>
              </div>
              <div className="record-stat">
                <div className="record-band" style={{ color: "var(--x-amber)" }}>
                  Delivered
                </div>
                <div className="record-band-label">Report ready</div>
              </div>
              <span className="pill pill-amber">Agent-reviewed</span>
            </div>
          </ProductView>
        </div>

        <div className="evidence-cards-grid">
          {DELIVERABLES.map((e) => (
            <div className="evidence-card" key={e.n}>
              <div className="evidence-card-top">
                <span className="evidence-card-num">{e.n}</span>
                <span className={`pill ${e.badge}`}>{e.title}</span>
              </div>
              <div className="evidence-card-title">{e.title}</div>
              <p className="evidence-card-desc">{e.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 7. What happens next — honest roadmap */}
      <section className="steps-section">
        <div className="section-header-split">
          <div>
            <div className="x-label">Release &amp; Capability Roadmap</div>
            <h2 className="heading-1" style={{ margin: "12px 0 0", maxWidth: 640 }}>
              An honest roadmap. Zero false connectors.
            </h2>
          </div>
          <p className="body" style={{ margin: 0, maxWidth: 460 }}>
            Stage 1 is a supervised operational preview. Future waves expand review depth and model
            routing — never disguised as live today.
          </p>
        </div>

        <div className="roadmap-grid">
          {ROADMAP.map((r, idx) => (
            <div className={`roadmap-card${idx === 0 ? " is-current" : ""}`} key={r.n}>
              <div className="roadmap-card-top">
                <span className="roadmap-stage">{r.n}</span>
                <span className="roadmap-status">{r.status}</span>
              </div>
              <div className="roadmap-title">{r.title}</div>
              <div className="roadmap-desc">{r.body}</div>
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
