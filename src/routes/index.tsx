import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { Bento, BentoTile } from "@/components/marketing/bento";
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
    image: "/assets/3d/intent-investigate.jpg",
    imageAlt: "3D frosted-glass optical prism separating evidence layers",
    body: "Research a strategic or product decision and return a structured brief with sourced facts explicitly separated from assumptions and inferences.",
    capabilities: ["DX-001", "DX-011", "DX-012", "DX-020"],
    permission: "Plan → Create",
    deliverable: "Decision Brief + Evidence Matrix",
  },
  {
    n: "02",
    tag: "Product & UI Specification",
    title: "Prototype",
    image: "/assets/3d/intent-prototype.jpg",
    imageAlt: "3D translucent glass UI planes and brushed-gold wireframe cube in a sandbox tray",
    body: "Produce a reviewable PRD and a lightweight, sandboxed interactive HTML or structured UI pack — never an unapproved production deploy.",
    capabilities: ["DX-021", "DX-023", "DX-035", "DX-049"],
    permission: "Create (Sandboxed)",
    deliverable: "Product Spec + Interactive HTML Pack",
  },
  {
    n: "03",
    tag: "Flow & Funnel Diagnostics",
    title: "Improve",
    image: "/assets/3d/intent-improve.jpg",
    imageAlt: "3D ascending emerald stepped pathway and precision gold tuning dial",
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
    body: "Every state transition, approval decision, and credit charge is logged. Workforce outputs carry discrete quality labels — never a bare 'Verified' claim.",
    service: "svc-audit · Deterministic service",
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

      {/* 1. HERO — Editorial headline + 3D Finsage-inspired Command Centre showcase */}
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
              signedInLabel="Open Command Centre →"
              signedOutLabel="Open Command Centre →"
              className="btn btn-primary"
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
        </div>
      </section>

      {/* 2. Three Bounded Mission Intents with 3D Sculptural Visuals */}
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
              <div className="mission-arch-visual">
                <img src={m.image} alt={m.imageAlt} loading="lazy" />
                <span className="mission-arch-badge">
                  {m.n} · {m.tag}
                </span>
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

      {/* 3. Five-Stage Supervised Lifecycle + Compact Epistemic Evidence Strip */}
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
              span={s.n === "01" || s.n === "02" ? 3 : 2}
              label={`${s.n} · ${s.gate}`}
              title={s.name}
              body={s.desc}
              onInk={s.n === "03"}
            />
          ))}
        </Bento>

        {/* Compact Epistemic Evidence & Quality Strip (Replaces bulky 8-card ledger wall) */}
        <div className="epistemic-strip" aria-label="Evidence classification and quality labels">
          <div className="epistemic-strip-copy">
            <span className="x-label">Epistemic Honesty in Every Report</span>
            <p>
              Every delivered artefact separates claims into four explicit classes and uses discrete
              quality labels (<strong>Agent-reviewed</strong>, <strong>Automatically tested</strong>
              , <strong>Human-reviewed</strong>, <strong>Externally attested</strong>) — never an
              unqualified <code>Verified</code> badge.
            </p>
          </div>
          <div className="epistemic-strip-pills">
            <div className="epistemic-chip">
              <span className="pill pill-teal">01 · Sourced facts</span>
              <small>Traceable to your brief or cited sources</small>
            </div>
            <div className="epistemic-chip">
              <span className="pill pill-neutral">02 · Assumptions</span>
              <small>Working premises stated openly for review</small>
            </div>
            <div className="epistemic-chip">
              <span className="pill pill-purple">03 · Inferences</span>
              <small>Analytical conclusions reasoned from facts</small>
            </div>
            <div className="epistemic-chip">
              <span className="pill pill-amber">04 · Speculative</span>
              <small>Directional options flagged as low-confidence</small>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Deterministic Governance & Wave 1 Capability Spotlight */}
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

      <WorkforcePreview maxAvailable={12} />

      {/* 5. Compact Career Path Banner + FAQs + Final CTA */}
      <section className="career-compact-section">
        <div className="career-compact-banner">
          <div>
            <div className="x-label">Coexisting Product Line · Career Evidence</div>
            <h2 className="heading-2" style={{ marginTop: 8 }}>
              Looking for the PM Career Evidence path?
            </h2>
            <p className="body" style={{ marginTop: 6, maxWidth: 620 }}>
              <strong>Experience</strong>, <strong>Launchpad</strong>, and <strong>Prove</strong>{" "}
              remain available as our dedicated career product (£19/month). Build a
              provenance-backed PM portfolio where <em>Verified</em> lights only after independent
              external attestation.
            </p>
          </div>
          <div className="career-compact-actions">
            <Link to="/experience" className="btn btn-secondary">
              Explore Experience →
            </Link>
            <Link to="/launchpad" className="btn btn-secondary">
              Launchpad →
            </Link>
            <Link to="/pricing" className="btn btn-secondary">
              Career pricing
            </Link>
          </div>
        </div>
      </section>

      <FaqSection items={HOME_FAQ} />

      <section className="cta-section">
        <div className="cta-box">
          <h2 className="cta-h">Put AI labour under a plan you approve.</h2>
          <p className="cta-sub">
            Open Command Centre for the Stage 1 workforce preview — or explore the architecture and
            governance model first.
          </p>
          <div className="cta-btns">
            <CtaLink
              signedInTo="/command"
              signedInLabel="Open Command Centre →"
              signedOutLabel="Open Command Centre →"
            />
            <Link to="/how-it-works" className="btn btn-secondary">
              How it works
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
