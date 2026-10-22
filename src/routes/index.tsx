import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FileStack, Gavel, Quote, ShieldCheck } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { FaqSection } from "@/components/marketing/faq-section";
import { OnboardingGate } from "@/components/onboarding-gate";
import { CtaLink } from "@/components/marketing/cta-link";
import {
  ExportTree,
  LiveDecision,
  LiveProgrammeFlow,
  WorkforceMatrix,
} from "@/components/marketing/dxsi-landing";

const TITLE = "DeliverX — Your idea, run like a product company";
const DESCRIPTION =
  "150 AI specialists research, debate, design, build and verify your product. You approve every decision that matters, and download the whole project.";

const HOW_IT_WORKS_SCHEMA = [
  { name: "Describe", desc: "Describe your idea or business case." },
  { name: "Discover", desc: "Agents research the market, customers and technology in parallel." },
  { name: "Decide", desc: "Specialist panels debate options; you approve high-impact decisions." },
  { name: "Build", desc: "Design, architecture and build sprints with peer review." },
  {
    name: "Verify & launch",
    desc: "Automated verification, go/no-go, launch plan and full export.",
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

const HOME_FAQ = [
  {
    q: "Is this a chatbot?",
    a: "No. DeliverX runs your idea as a programme: a roadmap with owners, meetings, decisions, deliverables and approval gates — and you can download all of it.",
  },
  {
    q: "Who makes the decisions?",
    a: "Specialist panels form independent views, challenge each other and vote under fixed rules. High-impact or weakly evidenced decisions always come to you.",
  },
  {
    q: "Are the customer interviews real?",
    a: "Only the ones you add. Agents can rehearse with clearly labelled synthetic personas, but only real interview notes count as evidence.",
  },
  {
    q: "What do I get at the end?",
    a: "A portable project: business case, research with sources, PRD, roadmap, designs, architecture, prototype, decisions, meetings, tests and a full audit trail.",
  },
];

const PHASES = [
  { name: "Discover", items: ["Market", "Research", "Foresight", "Interviews"] },
  { name: "Define", items: ["PRD", "Business model", "Roadmap"], gate: true },
  { name: "Design", items: ["UX", "Architecture", "Threat model"], gate: true },
  { name: "Build", items: ["Sprints", "Code review", "Prototype"], gate: true },
  { name: "Verify", items: ["Tests", "Go / no-go"], gate: true },
  { name: "Launch", items: ["GTM", "Analytics"] },
  { name: "Evolve", items: ["Experiments", "Radar"] },
];

const TRUST = [
  {
    icon: Gavel,
    title: "You hold the gates",
    text: "Four approvals. Nothing consequential runs without you.",
  },
  {
    icon: Quote,
    title: "Evidence, cited",
    text: "Claims link to sources. Unsourced numbers are rejected.",
  },
  {
    icon: ShieldCheck,
    title: "Nothing fabricated",
    text: "Simulated work is labelled. Real interviews are yours.",
  },
  {
    icon: FileStack,
    title: "Fully portable",
    text: "Every file, decision and event — one download.",
  },
];

function HomePage() {
  return (
    <MarketingLayout>
      <OnboardingGate />

      <section className="dxl-hero">
        <div className="dxl-wrap">
          <p className="dxl-eyebrow">DeliverX Super Intelligence</p>
          <h1 className="dxl-h1">
            Your idea,
            <br />
            <span className="dxl-grad">run like a product company.</span>
          </h1>
          <p className="dxl-lead">
            150 AI specialists research, debate, design, build and verify. You approve what matters.
          </p>
          <div className="dxl-ctas">
            <CtaLink
              signedInTo="/command/programmes"
              signedInLabel="Start a programme"
              signedOutLabel="Start free"
              className="dxl-btn dxl-btn-primary"
            />
            <a href="#decisions" className="dxl-btn dxl-btn-ghost">
              Watch a decision <ArrowRight className="size-4" />
            </a>
          </div>
        </div>
        <div className="dxl-wrap dxl-wide">
          <LiveProgrammeFlow />
        </div>
        <ul className="dxl-stats dxl-wrap" aria-label="At a glance">
          <li>
            <b>150</b>specialists
          </li>
          <li>
            <b>15</b>departments
          </li>
          <li>
            <b>7</b>phases
          </li>
          <li>
            <b>4</b>founder gates
          </li>
          <li>
            <b>1</b>download
          </li>
        </ul>
      </section>

      <section className="dxl-section" id="decisions">
        <div className="dxl-wrap">
          <header className="dxl-head">
            <p className="dxl-eyebrow">Collective judgement</p>
            <h2 className="dxl-h2">Watch a decision get made.</h2>
            <p className="dxl-sub">
              Independent views. A red team. Hard vetoes. A rule-based verdict — or your call.
            </p>
          </header>
          <LiveDecision />
        </div>
      </section>

      <section className="dxl-section dxl-alt">
        <div className="dxl-wrap">
          <header className="dxl-head">
            <p className="dxl-eyebrow">One workflow</p>
            <h2 className="dxl-h2">Idea to launch, with you at every gate.</h2>
          </header>
          <ol className="dxl-rail">
            {PHASES.map((p, i) => (
              <li key={p.name} style={{ animationDelay: `${i * 90}ms` }}>
                <span className="dxl-rail-step">{String(i + 1).padStart(2, "0")}</span>
                <strong>{p.name}</strong>
                <span className="dxl-rail-items">
                  {p.items.map((it) => (
                    <em key={it}>{it}</em>
                  ))}
                </span>
                {p.gate ? <span className="dxl-rail-gate">You approve</span> : null}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="dxl-section">
        <div className="dxl-wrap dxl-two">
          <header className="dxl-head dxl-left">
            <p className="dxl-eyebrow">The workforce</p>
            <h2 className="dxl-h2">150 roles. Each with a seat.</h2>
            <p className="dxl-sub">
              Panels form around each decision. Reviewers come from another department. Track
              records build with every outcome.
            </p>
            <Link to="/how-it-works" hash="workforce" className="dxl-link">
              Explore the roles <ArrowRight className="size-4" />
            </Link>
          </header>
          <WorkforceMatrix />
        </div>
      </section>

      <section className="dxl-section dxl-alt">
        <div className="dxl-wrap dxl-two">
          <ExportTree />
          <header className="dxl-head dxl-left">
            <p className="dxl-eyebrow">Yours to keep</p>
            <h2 className="dxl-h2">Leave with the whole project.</h2>
            <p className="dxl-sub">
              Business case to audit trail, in one archive. A manifest states exactly what is real
              and what was simulated.
            </p>
          </header>
        </div>
      </section>

      <section className="dxl-section">
        <div className="dxl-wrap">
          <ul className="dxl-trust">
            {TRUST.map((t) => (
              <li key={t.title}>
                <t.icon className="size-5" aria-hidden="true" />
                <strong>{t.title}</strong>
                <span>{t.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <FaqSection items={HOME_FAQ} />

      <section className="dxl-final">
        <div className="dxl-wrap">
          <h2 className="dxl-h2">Bring an idea. Leave with a product.</h2>
          <div className="dxl-ctas">
            <CtaLink
              signedInTo="/command/programmes"
              signedInLabel="Start a programme"
              signedOutLabel="Start free"
              className="dxl-btn dxl-btn-primary"
            />
            <Link to="/resources" className="dxl-btn dxl-btn-ghost">
              Learn through building →
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
