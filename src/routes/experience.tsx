import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { JourneyLadder } from "@/components/marketing/journey-ladder";
import { FaqSection, JourneyCrossSell } from "@/components/marketing/faq-section";

export const Route = createFileRoute("/experience")({
  head: () => ({
    meta: [
      { title: "Experience — Stop describing potential. Demonstrate it. | DeliverX" },
      {
        name: "description",
        content:
          "Work as a product manager inside realistic simulated organisations. Your actions — not the setup — create the evidence.",
      },
      { property: "og:title", content: "DeliverX Experience — build the experience" },
      {
        property: "og:description",
        content:
          "A role you act in, not content you consume. Evidence only exists once you act.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ExperiencePage,
});

const COMPANIES = [
  {
    cls: "teal",
    name: "MediFlow Technologies",
    type: "Clinical AI · Series B",
    desc: "AI coordination platform for NHS and European hospitals. Stakeholders include clinicians, data engineers, and procurement leads. High regulatory sensitivity.",
    tags: ["Discovery", "Prioritisation", "Stakeholder alignment"],
  },
  {
    cls: "amber",
    name: "GreenGrid",
    type: "CleanTech · Carbon marketplace",
    desc: "Sustainability platform connecting corporate buyers with verified carbon offsets. Mission-driven trade-offs and complex regulatory context.",
    tags: ["Roadmapping", "PRD writing", "OKR setting"],
  },
  {
    cls: "purple",
    name: "LearnFlow",
    type: "EdTech · LMS SaaS",
    desc: "Learning management platform for mid-market enterprises. Consumer-feel product with B2B sales motion. Fast iteration cadence.",
    tags: ["Sprint planning", "A/B testing", "Release comms"],
  },
  {
    cls: "slate",
    name: "More companies in build",
    type: "FinTech · HealthTech · SaaS · B2B",
    desc: "Covering a broad range of domains, stakeholder types, and product maturity stages. Added scenario by scenario as the pilot expands.",
    tags: ["Pilot expanding"],
  },
];

const LOOP = [
  { l: "A", n: "Work happens", d: "You complete a task — a brief, a decision, an artefact. You submit." },
  { l: "B", n: "Artefact locked", d: "Immutable artefact version assigned. Private by default." },
  { l: "C", n: "Scoring", d: "Your submission is assessed against pm-core@2026.1." },
  { l: "D", n: "Ledger entry", d: "An append-only entry is created with full provenance." },
  {
    l: "E",
    n: "ScoreRun",
    d: "When sufficient evidence accumulates for a dimension, the Capability Engine runs. This is the only mechanism that writes capability.",
  },
  {
    l: "F",
    n: "Reflection",
    d: "Add reflections to any artefact. Reflections that meet the provenance threshold can become additional ledger entries.",
  },
];

function ExperiencePage() {
  return (
    <MarketingLayout>
      <div className="hero-xp">
        <div className="hero-xp-tag">01 · Experience · Build the experience</div>
        <h1>
          Stop describing potential.
          <br />
          Demonstrate it.
        </h1>
        <p>
          Work as a product manager inside realistic organisations. Your actions — not the setup —
          create the evidence.
        </p>
        <Link to="/signup" className="btn btn-amber">
          Get started
        </Link>
      </div>

      <JourneyLadder active="work" />

      <div className="principle-bar">
        A role you act in. Not content you consume. &nbsp;·&nbsp; <em>No evidence before you act.</em>
      </div>

      <div className="entry-seq">
        <h2 className="heading-2" style={{ marginBottom: 20 }}>
          Joining Experience
        </h2>
        <div className="entry-steps">
          <div className="entry-step">
            <div className="entry-step-n">01</div>
            <div className="entry-step-name">Offer</div>
            <div className="entry-step-desc">
              Browse the available companies. Select your scenario and accept. Your simulation state
              is generated.
            </div>
          </div>
          <div className="entry-step narrative">
            <div className="entry-step-n">02</div>
            <div className="entry-step-name">Hiring interview</div>
            <div className="entry-step-desc">
              Practice panel with two stakeholders — high trust and low trust. Skippable.
            </div>
            <div className="narrative-tag">Narrative only · creates no evidence</div>
          </div>
          <div className="entry-step narrative">
            <div className="entry-step-n">03</div>
            <div className="entry-step-name">Entry ceremony</div>
            <div className="entry-step-desc">
              Company → role → team → project → first task. Every step is skippable.
            </div>
            <div className="narrative-tag">Narrative only · creates no capability</div>
          </div>
          <div className="entry-step" style={{ background: "var(--x-amber-light)", border: "none" }}>
            <div className="entry-step-n" style={{ color: "var(--x-amber-text)" }}>
              04
            </div>
            <div className="entry-step-name" style={{ color: "var(--x-amber-text)" }}>
              Day 1 — work begins
            </div>
            <div className="entry-step-desc" style={{ color: "var(--x-amber-text)", opacity: 0.8 }}>
              Evidence only exists from here. Your first task is ready.
            </div>
          </div>
        </div>
      </div>

      <div className="companies-section">
        <h2 className="heading-2" style={{ marginBottom: 6 }}>
          Living organisations
        </h2>
        <p className="body" style={{ marginBottom: 0 }}>
          Real constraints, real stakeholders, real product context.
        </p>
        <div className="companies-grid">
          {COMPANIES.map((c) => (
            <div className={`company-card ${c.cls}`} key={c.name}>
              <div className="company-name">{c.name}</div>
              <div className="company-type">{c.type}</div>
              <div className="company-desc">{c.desc}</div>
              <div className="company-tags">
                {c.tags.map((t) => (
                  <span className="company-tag" key={t}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="loop-section">
        <div className="loop-inner">
          <h2 className="loop-title">The Day-1 work loop</h2>
          <div className="loop-steps">
            {LOOP.map((s) => (
              <div className="loop-step" key={s.l}>
                <div className="loop-step-l">{s.l}</div>
                <div className="loop-step-n">{s.n}</div>
                <div className="loop-step-d">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: "56px 32px", maxWidth: 960, margin: "0 auto", textAlign: "center" }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 12 }}>
          Ready to start?
        </h2>
        <p className="body-lg" style={{ marginBottom: 28 }}>
          Your first evidence entry is one task away.
        </p>
        <Link to="/signup" className="btn btn-amber" style={{ fontSize: 15, padding: "12px 28px" }}>
          Join the pilot →
        </Link>
      </div>

      <FaqSection
        items={[
          {
            q: "Is the company real?",
            a: "No, and we say so plainly. MediFlow Technologies is a simulated company with a defined product, stakeholders and constraints. The work you produce inside it is real work you wrote, and that is what goes on your record.",
          },
          {
            q: "What do I actually produce?",
            a: "Written artefacts a product manager produces: a stakeholder alignment brief, requirements, a decision record with the options you rejected, a risk register. Each one is frozen when you submit it.",
          },
          {
            q: "Does a score make me Verified?",
            a: "No. An AI-assisted judgement gives you a level with a written rationale and the evidence it read. Coach confirmation is shown separately, and only independent external attestation lights Verified.",
          },
          {
            q: "How long does it take?",
            a: "It depends on you — tasks are released in phases and there is no timer. Most people work through a phase over a week alongside a job.",
          },
        ]}
      />

      <JourneyCrossSell note="Experience produces the evidence; Launchpad presents it and the Professional Workspace is where you run real delivery work. The Complete Journey plan covers all three." />
    </MarketingLayout>
  );
}
