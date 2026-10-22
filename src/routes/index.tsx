import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, X as XIcon, ShieldCheck, Lock, FileCheck2, Sparkles } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { FaqSection } from "@/components/marketing/faq-section";
import { OnboardingGate } from "@/components/onboarding-gate";
import { CtaLink } from "@/components/marketing/cta-link";
import { WorkforcePreview } from "@/components/marketing/workforce-preview";
import {
  HeroProductInteractiveModule,
  InteractiveProductDashboardShowcase,
  ProductAccordionVisual,
  DesktopMobileCommandShowcase,
  ProductDiscoveryIcon,
  ProductPrdIcon,
  ProductPrototypeIcon,
  ProductImproveIcon,
  MissionPlannerIcon,
  ApprovalGateIcon,
  BudgetShieldIcon,
} from "@/components/marketing/motion-product-visuals";
import { WAVE1_AVAILABLE_IDS } from "@/lib/workforce/registry";

const WAVE1_COUNT = WAVE1_AVAILABLE_IDS.length;

const TITLE = "DeliverX — The Supervised AI Workforce Platform for Product Teams";
const DESCRIPTION =
  "Commission structured Investigate, Prototype, and Improve product missions. Review the task plan first, approve under 4-tier permissions, and ship with evidence-separated delivery reports.";

const HOW_IT_WORKS_SCHEMA = [
  {
    name: "Mission",
    desc: "Select Investigate, Prototype or Improve and state your product objective. Ambiguous briefs prompt clarifying questions before planning.",
  },
  {
    name: "Plan",
    desc: "Review a structured task graph, acceptance criteria, credit estimate, and assigned specialist capabilities before work begins.",
  },
  {
    name: "Approve",
    desc: "Nothing executes until you approve the plan within your permission ceiling and workspace budget.",
  },
  {
    name: "Execute",
    desc: "Approved tasks run step-by-step with live progress tracking and automatic hard-stop protection at your configured credit ceiling.",
  },
  {
    name: "Deliver",
    desc: "Receive reviewable artefacts and a delivery report with separated evidence (Sourced facts, Assumptions, Inferences) and discrete quality labels.",
  },
];

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
              name: "How DeliverX runs a supervised product mission",
              description: "Mission through plan, approval, execution and delivery.",
              step: HOW_IT_WORKS_SCHEMA.map((s, i) => ({
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

const ROLE_OUTCOMES = [
  {
    role: "Product Managers & Leads",
    metric: "Investigate & Specify",
    desc: "Turn ambiguous stakeholder requests into structured Decision Briefs, PRDs, and acceptance criteria with sourced facts separated from assumptions.",
    ctaLabel: "Draft a Decision Brief →",
    intent: "investigate" as const,
  },
  {
    role: "Product Designers & Builders",
    metric: "Sandboxed Prototyping",
    desc: "Generate reviewable UI specifications and interactive HTML prototypes inside an isolated sandbox — never an unapproved production push.",
    ctaLabel: "Prototype in Sandbox →",
    intent: "prototype" as const,
  },
  {
    role: "Growth & Product Ops",
    metric: "Flow Diagnostics",
    desc: "Diagnose checkout, onboarding, or funnel drop-off root causes and produce bounded remediation plans with impact vs. risk scoring.",
    ctaLabel: "Audit a Product Flow →",
    intent: "improve" as const,
  },
  {
    role: "Founders & PMO Sponsors",
    metric: "Supervised Governance",
    desc: "Control exactly what AI can plan, create, or execute with mandatory human approval gates and deterministic workspace credit ceilings.",
    ctaLabel: "Inspect Governance →",
    intent: "investigate" as const,
  },
] as const;

const OLD_WAY_PAINS = [
  "Open-ended AI chat threads that blend verified customer facts with hallucinated assumptions",
  "Manually copying messy notes between research docs, PRD templates, and prototyping tools",
  "Autonomous agent loops that burn API credits silently without a deterministic hard-stop",
  "Unbounded code or workflow changes triggered without a mandatory human approval gate",
  "Flat directories of 100+ generic prompt bots with no coordinated task dependency graph",
  "Zero audit trail or quality provenance showing whether an output was tested or reviewed",
] as const;

const DELIVERX_GAINS = [
  "Structured 5-stage lifecycle: Mission → Plan → Approve → Execute → Deliver",
  "Epistemic separation of Sourced Facts, Working Assumptions, and Inferences in every report",
  "Mandatory Step 03 Human Approval Gate before any task queues or credits are spent",
  "Sandboxed interactive HTML prototyping + structured PRDs generated in one coordinated run",
  "Deterministic 100-credit workspace ceiling enforced before every individual task execution",
  "Discrete quality labels (Agent-reviewed, Automatically tested, Human-reviewed, Externally attested)",
] as const;

interface AccordionFeatureSection {
  id: string;
  sectionKey: "discovery" | "prototype" | "improve" | "lifecycle" | "governance";
  eyebrow: string;
  titlePrefix: string;
  titleGradient: string;
  titleSuffix: string;
  lead: string;
  reverse?: boolean;
  items: Array<{
    title: string;
    body: string;
    tag: string;
  }>;
}

const ACCORDION_SECTIONS: AccordionFeatureSection[] = [
  {
    id: "feature-discovery",
    sectionKey: "discovery",
    eyebrow: "01 · INVESTIGATE MISSIONS",
    titlePrefix: "AI Product Discovery that ",
    titleGradient: "separates facts",
    titleSuffix: " from assumptions.",
    lead: "Stop basing product roadmaps on unverified chat summaries. DeliverX investigates strategic product decisions and classifies every claim by epistemic confidence.",
    items: [
      {
        title: "Separates Sourced Facts from Working Assumptions",
        body: "Every Decision Brief automatically tags claims as Sourced Facts, Working Assumptions, or Analytical Inferences — so product leads know exactly what requires customer validation before committing engineering sprint capacity.",
        tag: "Epistemic Evidence Matrix",
      },
      {
        title: "Clarifies Ambiguous Product Briefs Before Planning",
        body: "When a founder or stakeholder submits a one-line prompt, the Intake Gate pauses and asks targeted clarifying questions on target persona, platform scope, and constraints before generating a task graph.",
        tag: "Structured Intake Gate",
      },
      {
        title: "Synthesizes Build-vs-Partner & Competitive Trade-offs",
        body: "Product Research and Decision Memo specialists evaluate implementation options across time-to-value, engineering complexity, and compliance risk in a single structured deliverable.",
        tag: "Decision Memo Specialist",
      },
    ],
  },
  {
    id: "feature-prototype",
    sectionKey: "prototype",
    eyebrow: "02 · PROTOTYPE MISSIONS",
    titlePrefix: "AI PRDs & ",
    titleGradient: "Sandboxed Prototypes",
    titleSuffix: " ready for stakeholder sign-off.",
    lead: "Go from product objective to a complete Product Requirements Document and a clickable, sandboxed HTML prototype in one supervised workflow.",
    reverse: true,
    items: [
      {
        title: "Drafts Complete PRDs with Testable Acceptance Criteria",
        body: "Automatically structures problem framing, user stories, functional requirements, and explicit non-goals — formatted so design and engineering teams can review scope immediately.",
        tag: "PRD & Spec Architect",
      },
      {
        title: "Builds Interactive HTML Prototypes in an Isolated Sandbox",
        body: "Generates self-contained, interactive UI states (Default, Warning, Hard-Stop, Confirmation) inside a zero-risk browser sandbox. Never touches production repositories or live customer data.",
        tag: "Sandboxed UI Prototyper",
      },
      {
        title: "Maps Edge Cases, Empty States & Permission Boundaries",
        body: "Surfaces missing error states, role permission boundaries, and accessibility requirements alongside the visual prototype so nothing slips into sprint planning unexamined.",
        tag: "State & Edge-Case Coverage",
      },
    ],
  },
  {
    id: "feature-improve",
    sectionKey: "improve",
    eyebrow: "03 · IMPROVE MISSIONS",
    titlePrefix: "AI Flow Diagnostics that ",
    titleGradient: "pinpoint friction",
    titleSuffix: " & bound remediation.",
    lead: "Diagnose drop-offs in onboarding, checkout, or core product workflows and generate prioritized, low-risk remediation plans.",
    items: [
      {
        title: "Isolates Funnel Drop-Off & Workflow Friction Root Causes",
        body: "Breaks multi-step user journeys into stage-by-stage conversion telemetry, highlighting where latency, form friction, or unclear UX copy causes abandonment.",
        tag: "Funnel & Friction Auditor",
      },
      {
        title: "Scores Remediation Options by Impact vs. Implementation Risk",
        body: "Proposes concrete product fixes ranked by expected conversion lift, engineering effort, and schema safety — respecting your explicit non-goals.",
        tag: "Bounded Remediation Plan",
      },
      {
        title: "Packages Verification Checklists & Rollback Guardrails",
        body: "Every Improve mission concludes with a pre-release verification checklist, synthetic test scenarios, and clear rollback triggers.",
        tag: "Verification & QA Pack",
      },
    ],
  },
  {
    id: "how-it-works",
    sectionKey: "lifecycle",
    eyebrow: "04 · SUPERVISED LIFECYCLE",
    titlePrefix: "Mission → Plan → ",
    titleGradient: "Approve",
    titleSuffix: " → Execute → Deliver.",
    lead: "Unlike autonomous agent loops that act first and apologize later, DeliverX enforces a deterministic 5-stage lifecycle built around human authority.",
    reverse: true,
    items: [
      {
        title: "Step 01–02: Inspect the Full Task Dependency Graph First",
        body: "Before a single credit is consumed, DeliverX compiles a dependency-ordered task plan showing assigned specialist capabilities, acceptance criteria, and estimated credit cost.",
        tag: "Plan-First Architecture",
      },
      {
        title: "Step 03: Mandatory Human Approval & 4-Tier Permission Gate",
        body: "Nothing executes until you click Approve Plan. Every mission is bounded by our 4-tier permission ladder: Plan → Create → Execute internally → Act externally.",
        tag: "Mandatory Human Gate",
      },
      {
        title: "Step 04–05: Bounded Execution & Classified Delivery Report",
        body: "Approved tasks run step-by-step and compile into an executive Delivery Report with classified evidence and discrete quality provenance badges.",
        tag: "Delivery Report & Provenance",
      },
    ],
  },
  {
    id: "feature-governance",
    sectionKey: "governance",
    eyebrow: "05 · WORKFORCE GOVERNANCE & REGISTRY",
    titlePrefix: "Deterministic ",
    titleGradient: "budget ceilings",
    titleSuffix: " & honest capability states.",
    lead: "Built for product leaders and enterprise sponsors who require predictable spend, workspace isolation, and total transparency.",
    items: [
      {
        title: "Deterministic Hard-Stop Credit Ceilings",
        body: "Every workspace enforces a strict credit ceiling (e.g., 100 credits). The execution engine checks remaining balance before each task and halts cleanly if a task would exceed the cap.",
        tag: "Zero Silent Overspend",
      },
      {
        title: `${WAVE1_COUNT} Verified Available Roles — Planned Roles Never Faked`,
        body: `Our 150-role catalogue spans 15 product & delivery departments. Only the ${WAVE1_COUNT} verified Available capabilities can be assigned to missions today; the 138 Planned roles are transparently locked.`,
        tag: "Honest Capability Registry",
      },
      {
        title: "Immutable Audit Ledger & Discrete Quality Provenance",
        body: "Every state transition, approval timestamp, and credit charge is recorded in an immutable workspace audit log — using honest quality states rather than an unqualified 'Verified' claim.",
        tag: "Immutable Audit Trail",
      },
    ],
  },
];

const REPLACED_TOOLS = [
  {
    category: "Unstructured AI Chatbots",
    replacedBy: "Supervised Investigate & Decision Briefs",
    icon: ProductDiscoveryIcon,
  },
  {
    category: "Manual PRD & Spec Docs",
    replacedBy: "Automated PRD & Acceptance Criteria Generator",
    icon: ProductPrdIcon,
  },
  {
    category: "Throwaway Wireframe Tools",
    replacedBy: "Sandboxed Interactive HTML Prototyper",
    icon: ProductPrototypeIcon,
  },
  {
    category: "Ad-hoc Funnel Spreadsheets",
    replacedBy: "Structured Flow Diagnostics & Remediation Plans",
    icon: ProductImproveIcon,
  },
  {
    category: "Disconnected Task Trackers",
    replacedBy: "Dependency-Ordered Mission Task Graph",
    icon: MissionPlannerIcon,
  },
  {
    category: "Unbounded Agent Scripts",
    replacedBy: "4-Tier Permission Gate & Hard-Stop Credit Cap",
    icon: ApprovalGateIcon,
  },
] as const;

const HOME_FAQ = [
  {
    q: "How is DeliverX different from ChatGPT, Claude, or generic AI agent tools?",
    a: "Chatbots give you unstructured prose in an open-ended thread, and autonomous agent scripts run without predictable boundaries. DeliverX is a Supervised AI Product Workforce built around a 5-stage lifecycle (Mission → Plan → Approve → Execute → Deliver). You inspect the task graph, specialist assignments, and credit estimate before approving execution.",
  },
  {
    q: "What product missions can I run in the Command Centre today?",
    a: "You can commission three core product mission intents: Investigate (strategic decision research with sourced facts separated from assumptions), Prototype (structured PRDs plus sandboxed interactive HTML prototypes), and Improve (workflow friction diagnostics and bounded remediation plans).",
  },
  {
    q: "How many AI specialists are available in the Capability Registry?",
    a: `The DeliverX capability catalogue defines 150 specialist roles across 15 product, design, engineering, and operations departments. Today, ${WAVE1_COUNT} verified capabilities are Available for active mission assignment, while 138 roles are transparently marked Planned and never routed as fake labour.`,
  },
  {
    q: "How do permission tiers and budget ceilings protect my workspace?",
    a: "Every mission operates under a four-tier permission ladder (Plan → Create → Execute internally → Act externally) and a deterministic workspace credit ceiling (100 credits). Nothing executes without your approval, external actions require separate sign-off, and tasks hard-stop automatically at your credit limit.",
  },
  {
    q: "How does the Command Centre connect to Experience, Launchpad, and Prove?",
    a: "Command Centre is our supervised AI workforce platform for running product missions. Experience, Launchpad, and Prove form our dedicated PM Career Evidence track — where product managers build portfolio artefacts and earn an externally attested Verified signal from an independent reviewer.",
  },
];

function AccordionSectionBlock({ section }: { section: AccordionFeatureSection }) {
  const [activeIndex, setActiveIndex] = useState(0);

  const sectionCta =
    section.sectionKey === "discovery"
      ? { label: "Commission an Investigate Mission →", intent: "investigate" as const }
      : section.sectionKey === "prototype"
        ? { label: "Commission a Prototype Mission →", intent: "prototype" as const }
        : section.sectionKey === "improve"
          ? { label: "Commission an Improve Mission →", intent: "improve" as const }
          : section.sectionKey === "lifecycle"
            ? { label: "Inspect 5-Stage Lifecycle →", to: "/how-it-works" as const }
            : { label: "Explore 150-Role Registry →", to: "/command/capabilities" as const };

  return (
    <section className="motion-feature-section" id={section.id}>
      <div className="motion-feature-header">
        <span className="motion-eyebrow">{section.eyebrow}</span>
        <h2 className="motion-section-h2">
          {section.titlePrefix}
          <span className="motion-gradient-text">{section.titleGradient}</span>
          {section.titleSuffix}
        </h2>
        <p className="motion-section-lead">{section.lead}</p>
      </div>

      <div className={`motion-accordion-grid${section.reverse ? " is-reversed" : ""}`}>
        <div className="motion-accordion-list" role="tablist" aria-label={section.eyebrow}>
          {section.items.map((item, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={item.title}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveIndex(idx)}
                className={`motion-accordion-item${isActive ? " is-active" : ""}`}
              >
                <div className="motion-accordion-item-top">
                  <span className="motion-accordion-tag">{item.tag}</span>
                  <span className="motion-accordion-step">0{idx + 1}</span>
                </div>
                <h3 className="motion-accordion-title">{item.title}</h3>
                {isActive && <p className="motion-accordion-body">{item.body}</p>}
              </button>
            );
          })}

          <div className="pt-2">
            {"intent" in sectionCta ? (
              <Link
                to="/command"
                search={{ intent: sectionCta.intent } as never}
                className="btn motion-btn-primary text-xs px-4 py-2.5"
              >
                {sectionCta.label}
              </Link>
            ) : (
              <Link to={sectionCta.to} className="btn motion-btn-secondary text-xs px-4 py-2.5">
                {sectionCta.label}
              </Link>
            )}
          </div>
        </div>

        <div className="motion-accordion-stage">
          <ProductAccordionVisual section={section.sectionKey} activeIndex={activeIndex} />
        </div>
      </div>
    </section>
  );
}

function HomePage() {
  return (
    <MarketingLayout>
      <OnboardingGate />

      {/* 1. MOTION-STYLE PRODUCT HERO + INTERACTIVE AI PRODUCT SUITE MODULE */}
      <section className="motion-hero-section">
        <div className="motion-hero-inner">
          <div className="motion-hero-badge">
            <Sparkles className="size-3.5 text-[#3e63dd]" />
            <span>THE SUPERVISED AI WORKFORCE FOR PRODUCT TEAMS</span>
          </div>

          <h1 className="motion-hero-h1">
            Ship product discovery, PRDs &amp; prototypes with an{" "}
            <span className="motion-gradient-text">AI Workforce you supervise.</span>
          </h1>

          <p className="motion-hero-sub">
            Commission structured <strong>Investigate</strong>, <strong>Prototype</strong>, and{" "}
            <strong>Improve</strong> product missions. Inspect the task graph and specialist
            assignments first — nothing executes without your approval, and spend hard-stops at your
            workspace ceiling.
          </p>

          <div className="motion-hero-cta-row">
            <CtaLink
              signedInTo="/command"
              signedInLabel="Open Command Centre →"
              signedOutLabel="Try DeliverX for free →"
              className="btn motion-btn-primary motion-btn-lg"
            />
            <a href="#product-dashboard" className="btn motion-btn-secondary motion-btn-lg">
              Explore Product Dashboard
            </a>
            <Link to="/how-it-works" className="btn motion-btn-secondary motion-btn-lg">
              5-stage architecture
            </Link>
          </div>

          {/* Interactive 1fr / 2fr Product AI Tool Selector + Live Command Stage */}
          <HeroProductInteractiveModule />

          {/* 4-Column Product Role Outcomes Grid (Motion style) */}
          <div className="motion-role-strip" id="use-cases">
            {ROLE_OUTCOMES.map((item) => (
              <div key={item.role} className="motion-role-card">
                <span className="motion-role-badge">{item.metric}</span>
                <h2 className="motion-role-title">{item.role}</h2>
                <p className="motion-role-desc">{item.desc}</p>
                <Link
                  to="/command"
                  search={{ intent: item.intent } as never}
                  className="motion-role-link"
                >
                  {item.ctaLabel}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. FLAGSHIP PRODUCT COMMAND DASHBOARD SHOWCASE (Product Counterpart to Motion's Project Dashboard) */}
      <section className="motion-dashboard-showcase-section" id="product-dashboard">
        <div className="motion-section-container">
          <div className="motion-feature-header">
            <span className="motion-eyebrow">BUILT FOR PRODUCT TEAMS, NOT TICKET CHASERS</span>
            <h2 className="motion-section-h2">
              Your unified{" "}
              <span className="motion-gradient-text">Product &amp; AI Workforce Dashboard.</span>
            </h2>
            <p className="motion-section-lead">
              Traditional project tools track due dates and tickets. DeliverX gives Product
              Managers, Founders, and Sponsors a live Command Centre for discovery briefs, PRDs,
              sandboxed HTML prototypes, epistemic evidence, and human approval gates.
            </p>
          </div>

          <InteractiveProductDashboardShowcase />
        </div>
      </section>

      {/* 3. BEFORE / AFTER COMPARISON — "Stop using fragmented, unsupervised AI tools" */}
      <section className="motion-comparison-section">
        <div className="motion-section-container">
          <div className="motion-feature-header">
            <span className="motion-eyebrow">WHY PRODUCT TEAMS UPGRADE TO DELIVERX</span>
            <h2 className="motion-section-h2">
              Stop stitching together unstructured chat threads.{" "}
              <span className="motion-gradient-text">Upgrade to Supervised Product AI.</span>
            </h2>
            <p className="motion-section-lead">
              Product work requires epistemic rigour, structured specs, and clear human sign-off —
              not open-ended prompt roulette.
            </p>
          </div>

          <div className="motion-comparison-grid">
            {/* Left: Old Fragmented Tools */}
            <div className="motion-compare-card is-old">
              <div className="motion-compare-head">
                <span className="motion-compare-pill is-old">The Old Stack</span>
                <h3>Fragmented, unsupervised AI &amp; manual docs</h3>
              </div>
              <ul className="motion-compare-list">
                {OLD_WAY_PAINS.map((pain) => (
                  <li key={pain}>
                    <span className="motion-compare-icon is-no">
                      <XIcon className="size-3.5" />
                    </span>
                    <span>{pain}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: DeliverX Supervised Product Workforce */}
            <div className="motion-compare-card is-new">
              <div className="motion-compare-head">
                <span className="motion-compare-pill is-new">The DeliverX Way</span>
                <h3>Supervised AI Product Workforce Platform</h3>
              </div>
              <ul className="motion-compare-list">
                {DELIVERX_GAINS.map((gain) => (
                  <li key={gain}>
                    <span className="motion-compare-icon is-yes">
                      <Check className="size-3.5" />
                    </span>
                    <span>{gain}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-medium text-slate-600">
                  100 workspace credits included in early access
                </span>
                <CtaLink
                  signedInTo="/command"
                  signedInLabel="Open Command Centre →"
                  signedOutLabel="Switch to DeliverX for free →"
                  className="btn motion-btn-primary text-xs px-4 py-2"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FIVE ALTERNATING INTERACTIVE ACCORDION DEEP-DIVE SECTIONS */}
      <div className="motion-accordions-wrapper" id="mission-types">
        {ACCORDION_SECTIONS.map((section) => (
          <AccordionSectionBlock key={section.id} section={section} />
        ))}
      </div>

      {/* 5. WHY UNIFIED PRODUCT PLATFORM + "DELIVERX REPLACES..." */}
      <section className="motion-replaces-section">
        <div className="motion-section-container">
          <div className="motion-feature-header">
            <span className="motion-eyebrow">UNIFIED PRODUCT WORKFORCE</span>
            <h2 className="motion-section-h2">
              Why one supervised product platform beats{" "}
              <span className="motion-gradient-text">6 disconnected tools.</span>
            </h2>
            <p className="motion-section-lead">
              When discovery research, PRD drafting, sandboxed prototyping, and approval governance
              live in one Command Centre, context flows seamlessly from initial brief to final
              delivery report.
            </p>
          </div>

          <div className="motion-replaces-grid">
            {REPLACED_TOOLS.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.category} className="motion-replace-card">
                  <div className="motion-replace-top">
                    <Icon className="size-7" />
                    <span className="motion-replace-old">Replaces: {item.category}</span>
                  </div>
                  <h3 className="motion-replace-new">{item.replacedBy}</h3>
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex justify-center">
            <CtaLink
              signedInTo="/command"
              signedInLabel="Open Unified Command Centre →"
              signedOutLabel="Try the Unified Product Workforce →"
              className="btn motion-btn-primary motion-btn-lg"
            />
          </div>
        </div>
      </section>

      {/* 5. DESKTOP + MOBILE COMMAND CENTRE SHOWCASE */}
      <section className="motion-devices-section">
        <div className="motion-section-container">
          <div className="motion-feature-header">
            <span className="motion-eyebrow">COMMAND CENTRE EVERYWHERE</span>
            <h2 className="motion-section-h2">
              Commission on desktop.{" "}
              <span className="motion-gradient-text">Approve gates from anywhere.</span>
            </h2>
            <p className="motion-section-lead">
              Inspect mission plans, verify credit consumption, and sign off on human approval gates
              whether you are at your desk or between stakeholder reviews.
            </p>
          </div>

          <DesktopMobileCommandShowcase />
        </div>
      </section>

      {/* 6. CAPABILITY REGISTRY PREVIEW (12 Available / 138 Planned) */}
      <WorkforcePreview maxAvailable={12} />

      {/* 7. ENTERPRISE GOVERNANCE & SECURITY PILLARS */}
      <section className="motion-security-section" id="governance">
        <div className="motion-section-container">
          <div className="motion-security-card">
            <div className="motion-security-copy">
              <span className="motion-eyebrow">DETERMINISTIC GOVERNANCE</span>
              <h2
                className="motion-section-h2"
                style={{ textAlign: "left", margin: "10px 0 12px" }}
              >
                Enterprise-grade supervision built into the runtime.
              </h2>
              <p className="motion-section-lead" style={{ textAlign: "left", margin: 0 }}>
                Permission enforcement, credit hard-stops, and workspace isolation are enforced by
                deterministic platform services — never left to a prompt instruction.
              </p>
            </div>

            <div className="motion-security-badges">
              <div className="motion-sec-pill">
                <ShieldCheck className="size-5 text-[#3e63dd]" />
                <div>
                  <strong>4-Tier Permission Ladder</strong>
                  <span>Plan → Create → Internal → External</span>
                </div>
              </div>
              <div className="motion-sec-pill">
                <BudgetShieldIcon className="size-5" />
                <div>
                  <strong>Hard-Stop Budget Ceiling</strong>
                  <span>Deterministic pre-task credit verification</span>
                </div>
              </div>
              <div className="motion-sec-pill">
                <Lock className="size-5 text-[#3e63dd]" />
                <div>
                  <strong>Workspace RLS Isolation</strong>
                  <span>Dedicated wf_* schema &amp; tenant boundaries</span>
                </div>
              </div>
              <div className="motion-sec-pill">
                <FileCheck2 className="size-5 text-[#3e63dd]" />
                <div>
                  <strong>Honest Quality Provenance</strong>
                  <span>Discrete review states · Zero fake badges</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. COMPACT PM CAREER EVIDENCE BRIDGE */}
      <section className="career-compact-section">
        <div className="career-compact-banner">
          <div>
            <div className="x-label">PM Career Evidence Suite</div>
            <h2 className="heading-2" style={{ marginTop: 8 }}>
              Building an externally attested Product Management portfolio?
            </h2>
            <p className="body" style={{ marginTop: 6, maxWidth: 620 }}>
              Alongside our Supervised AI Workforce Command Centre, <strong>Experience</strong>,{" "}
              <strong>Launchpad</strong>, and <strong>Prove</strong> let product managers turn real
              delivery artefacts into externally verified career evidence.
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

      {/* 9. FAQ + FINAL CTA */}
      <FaqSection items={HOME_FAQ} />

      <section className="cta-section">
        <div className="cta-box motion-cta-box">
          <span className="motion-eyebrow" style={{ color: "#93c5fd" }}>
            READY TO SUPERVISE YOUR AI PRODUCT WORKFORCE?
          </span>
          <h2 className="cta-h" style={{ marginTop: 10 }}>
            Put AI product work under a plan you approve.
          </h2>
          <p className="cta-sub">
            Commission your first Investigate, Prototype, or Improve mission in the Command Centre
            today.
          </p>
          <div className="cta-btns">
            <CtaLink
              signedInTo="/command"
              signedInLabel="Open Command Centre →"
              signedOutLabel="Try DeliverX for free →"
              className="btn motion-btn-primary motion-btn-lg"
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
