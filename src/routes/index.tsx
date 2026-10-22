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

const TITLE = "DeliverX — Supervised AI Workforce Platform";
const DESCRIPTION = `Commission structured Investigate, Prototype, or Improve missions under human approval, explicit permissions, and deterministic usage ceilings.`;

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
              description: DESCRIPTION,
              url: "https://deliverx.dev/",
              brand: { "@id": "https://deliverx.dev/#organization" },
            },
            {
              "@type": "HowTo",
              name: "How DeliverX runs a supervised mission",
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
    tag: "Decision Research",
    title: "Investigate",
    image: "/assets/3d/intent-investigate.jpg",
    imageAlt: "3D frosted-glass optical prism separating evidence layers",
    body: "Research a strategic or product decision and return a structured brief with sourced facts explicitly separated from working assumptions.",
    permission: "Plan → Create",
    deliverable: "Decision Brief & Evidence Matrix",
  },
  {
    tag: "Product & UI Spec",
    title: "Prototype",
    image: "/assets/3d/intent-prototype.jpg",
    imageAlt: "3D translucent glass UI planes and brushed-gold wireframe cube",
    body: "Produce a reviewable product specification and a lightweight, sandboxed interactive prototype — never an unapproved production deploy.",
    permission: "Sandboxed Create",
    deliverable: "Product Spec & Interactive Prototype",
  },
  {
    tag: "Flow Diagnostics",
    title: "Improve",
    image: "/assets/3d/intent-improve.jpg",
    imageAlt: "3D ascending emerald stepped pathway and precision gold tuning dial",
    body: "Diagnose friction in an existing workflow, isolate root causes, and propose bounded remediation steps within your budget ceiling.",
    permission: "Internal Execution",
    deliverable: "Friction Diagnosis & Remediation Plan",
  },
];

const HOW_IT_WORKS = [
  {
    n: "01",
    name: "Mission",
    gate: "Intent & Scope",
    desc: "Select Investigate, Prototype or Improve and state your objective. Ambiguous briefs prompt clarifying questions before any plan is drafted.",
  },
  {
    n: "02",
    name: "Plan",
    gate: "Task Breakdown",
    desc: "Review a structured task graph, acceptance criteria, credit estimate, and assigned specialist capabilities before work begins.",
  },
  {
    n: "03",
    name: "Approve",
    gate: "Human Approval Gate",
    desc: "Nothing executes until you approve the plan within your permission ceiling and workspace budget. External actions require separate sign-off.",
  },
  {
    n: "04",
    name: "Execute",
    gate: "Bounded Execution",
    desc: "Approved tasks run step-by-step with live progress tracking and automatic hard-stop protection at your configured credit ceiling.",
  },
  {
    n: "05",
    name: "Deliver",
    gate: "Classified Evidence",
    desc: "Receive reviewable artefacts and a delivery report with separated evidence (Sourced facts, Assumptions, Inferences) and discrete quality labels.",
  },
];

const GOVERNANCE = [
  {
    n: "AUTHORITY",
    title: "Four-tier permission ladder",
    body: "Plan → Create → Execute internally → Act externally. External actions remain locked behind an explicit second approval.",
    service: "Permission Gate",
  },
  {
    n: "COST CONTROL",
    title: "Hard-stop usage ceilings",
    body: "Every workspace enforces a deterministic credit ceiling. Tasks verify remaining budget before running — zero silent overspend.",
    service: "Budget Enforcement",
  },
  {
    n: "SUPERVISION",
    title: "Plan-first human approval",
    body: "No free-form autonomous loops. You inspect assigned roles, acceptance criteria, and scope before queuing a single task.",
    service: "Human-in-the-Loop",
  },
  {
    n: "PROVENANCE",
    title: "Audit & quality trail",
    body: "Every state transition, approval decision, and credit charge is logged with discrete quality labels — never an unqualified Verified badge.",
    service: "Immutable Ledger",
  },
];

const HOME_FAQ = [
  {
    q: "How does DeliverX keep AI work under human control?",
    a: "Every mission follows a strict five-stage lifecycle: Mission → Plan → Approve → Execute → Deliver. Nothing executes until you inspect and approve the proposed plan, capability assignment, and credit estimate.",
  },
  {
    q: "How many capabilities are available in the workforce registry?",
    a: `The registry defines 150 specialist capabilities across 15 departments. Today, ${WAVE1_COUNT} verified capabilities are Available for active mission assignment, while the remaining roles are transparently marked Planned.`,
  },
  {
    q: "How is Command Centre different from Experience and Launchpad?",
    a: "Command Centre is our supervised AI workforce platform for executing bounded missions. Experience, Launchpad, and Prove form our career evidence path for Product Managers.",
  },
  {
    q: "How do usage ceilings and permissions work?",
    a: "Every workspace enforces a deterministic credit ceiling and a four-tier permission ladder (Plan, Create, Execute internally, Act externally). Tasks hard-stop automatically if the budget ceiling is reached.",
  },
];

function HomePage() {
  return (
    <MarketingLayout>
      <OnboardingGate />

      {/* 1. HERO — Clean Finsage-style executive headline + 3D sculptural showcase */}
      <section className="hero hero-workforce">
        <div className="hero-copy">
          <div className="hero-eyebrow">
            <span className="hero-dot" />
            <span className="x-label">Supervised AI Workforce Platform</span>
          </div>
          <h1 className="hero-h1">
            AI work that follows a plan.
            <br />
            <em>You stay in control.</em>
          </h1>
          <p className="hero-sub">
            Commission structured <strong>Investigate</strong>, <strong>Prototype</strong>, or{" "}
            <strong>Improve</strong> missions. Review the task breakdown and specialist assignments
            first — nothing runs without your approval, and spend hard-stops at your budget ceiling.
          </p>
          <div className="hero-actions">
            <CtaLink
              signedInTo="/command"
              signedInLabel="Open Command Centre →"
              signedOutLabel="Get started →"
              className="btn btn-primary"
            />
            <Link to="/how-it-works" className="btn btn-secondary">
              How it works
            </Link>
          </div>

          <dl className="hero-trust-strip" aria-label="Platform guardrails">
            <div>
              <dt>Plan-First Workflow</dt>
              <dd>Inspect scope &amp; tasks before execution</dd>
            </div>
            <div>
              <dt>Human Approval Gate</dt>
              <dd>Mandatory sign-off on plans &amp; external actions</dd>
            </div>
            <div>
              <dt>Hard-Stop Budget</dt>
              <dd>Deterministic credit ceiling per workspace</dd>
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
            <div className="x-label">Mission Intents</div>
            <h2 className="heading-1" style={{ margin: "12px 0 0", maxWidth: 640 }}>
              Investigate. Prototype. Improve.
            </h2>
          </div>
          <p className="body" style={{ margin: 0, maxWidth: 460 }}>
            Every mission begins with a clear intent, routing your brief to a structured planning
            template, specialist capability set, and permission boundary.
          </p>
        </div>

        <div className="mission-cards-grid">
          {MISSION_TYPES.map((m) => (
            <article className="mission-arch-card" key={m.title}>
              <div className="mission-arch-visual">
                <img src={m.image} alt={m.imageAlt} loading="lazy" />
                <span className="mission-arch-badge">{m.tag}</span>
              </div>
              <h3 className="mission-arch-title">{m.title}</h3>
              <p className="mission-arch-body">{m.body}</p>
              <div className="mission-arch-foot">
                <div>
                  <span>Permission</span>
                  <strong>{m.permission}</strong>
                </div>
                <div>
                  <span>Deliverable</span>
                  <strong>{m.deliverable}</strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 3. Five-Stage Supervised Lifecycle */}
      <section className="products-section" id="how-it-works">
        <div className="section-header-split">
          <div>
            <div className="x-label">Execution Lifecycle</div>
            <h2 className="heading-1" style={{ margin: "12px 0 0", maxWidth: 680 }}>
              Mission → Plan → Approve → Execute → Deliver
            </h2>
          </div>
          <p className="body" style={{ margin: 0, maxWidth: 460 }}>
            Five structured stages designed around human authority. Step 03 is a mandatory approval
            gate before any task is queued.
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
      </section>

      {/* 4. Deterministic Governance & Capability Registry */}
      <section className="trust-section" id="governance">
        <div className="trust-inner">
          <div className="trust-eyebrow">CONTROL &amp; GOVERNANCE</div>
          <h2 className="trust-heading">
            Permissions, ceilings, approvals.
            <br />
            <em>Supervision is the architecture.</em>
          </h2>
          <p className="trust-lead">
            Budget enforcement, permission gates, and audit logging are enforced deterministically
            by the platform — never delegated to an autonomous prompt.
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
            <div className="x-label">Career Evidence Product</div>
            <h2 className="heading-2" style={{ marginTop: 8 }}>
              Building a verified Product Management portfolio?
            </h2>
            <p className="body" style={{ marginTop: 6, maxWidth: 620 }}>
              <strong>Experience</strong>, <strong>Launchpad</strong>, and <strong>Prove</strong>{" "}
              remain available as our dedicated career evidence path — where <em>Verified</em>{" "}
              lights only after independent external attestation.
            </p>
          </div>
          <div className="career-compact-actions">
            <Link to="/experience" className="btn btn-secondary">
              Experience →
            </Link>
            <Link to="/launchpad" className="btn btn-secondary">
              Launchpad →
            </Link>
            <Link to="/pricing" className="btn btn-secondary">
              Pricing
            </Link>
          </div>
        </div>
      </section>

      <FaqSection items={HOME_FAQ} />

      <section className="cta-section">
        <div className="cta-box">
          <h2 className="cta-h">Put AI labour under a plan you approve.</h2>
          <p className="cta-sub">
            Commission your first supervised mission in the Command Centre or explore the
            architecture model.
          </p>
          <div className="cta-btns">
            <CtaLink
              signedInTo="/command"
              signedInLabel="Open Command Centre →"
              signedOutLabel="Get started →"
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
