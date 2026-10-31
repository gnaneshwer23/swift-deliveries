import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { ProductIntelligenceMap } from "@/components/marketing/product-intelligence-map";

const STEPS = [
  {
    n: "01",
    title: "Describe your idea",
    body: "A short idea is enough. Add users, constraints and platform only when useful.",
  },
  {
    n: "02",
    title: "AI team investigates",
    body: "Specialist capabilities research, compare options and surface evidence gaps.",
  },
  {
    n: "03",
    title: "PM explains options",
    body: "A plain-language briefing separates findings, assumptions and the recommendation.",
  },
  {
    n: "04",
    title: "You approve the direction",
    body: "Major choices stay with you. Agents propose; they do not silently decide.",
  },
  {
    n: "05",
    title: "Build and document",
    body: "Approved work continues with a visible team, artefacts and a downloadable record.",
  },
] as const;

const AUDIENCES = [
  { title: "Founders", body: "Validate a product direction before spending months building." },
  {
    title: "Solo builders",
    body: "Keep research, decisions and delivery in one supervised workspace.",
  },
  {
    title: "Small product teams",
    body: "Share an evidence trail instead of scattered chat threads.",
  },
  { title: "Agencies", body: "Give clients a clear brief, options and recorded approvals." },
  {
    title: "Enterprise explorers",
    body: "Run bounded investigations with usage ceilings and human gates.",
  },
  {
    title: "Learners",
    body: "See how real product work is structured on your own idea.",
  },
] as const;

const TRUST = [
  {
    title: "Human approval",
    body: "Consequential scope and external actions require an explicit decision.",
  },
  {
    title: "Evidence trail",
    body: "Findings, gaps and decisions stay attached to the mission record.",
  },
  {
    title: "Transparent activity",
    body: "Visible progress comes from saved events—not decorative fake work.",
  },
  {
    title: "Clear limits",
    body: "Usage and provider implications are shown before investigation begins.",
  },
] as const;

const FAQ = [
  {
    q: "Is this fully autonomous?",
    a: "No. DeliverX investigates and prepares work. You approve consequential decisions and can pause, revise or stop.",
  },
  {
    q: "Can I change the plan?",
    a: "Yes. You can edit the brief, challenge the recommendation and request more research before continuing.",
  },
  {
    q: "What do I receive?",
    a: "A structured briefing, evidence register, decision record and, when available, a downloadable project package for that mission.",
  },
  {
    q: "Can I download the project?",
    a: "Exports cover the persisted decision and evidence record today. Full engineering packages expand as those stages are implemented and verified.",
  },
  {
    q: "How are costs controlled?",
    a: "Scoped missions show commitment and usage ceilings before work starts. Everyday assistance stays separate from bounded research runs.",
  },
] as const;

export function DeliverxLanding() {
  return (
    <div className="dx-pi">
      <section className="dx-pi-hero dx-pi-wrap" aria-labelledby="dx-pi-hero-title">
        <div>
          <p className="dx-pi-eyebrow">DeliverX · AI product team</p>
          <h1 className="dx-pi-h1" id="dx-pi-hero-title">
            Turn an idea into a complete product project.
          </h1>
          <p className="dx-pi-lead">
            Describe your idea. DeliverX’s AI product team researches it, plans it, builds it, and
            keeps the evidence.
          </p>
          <div className="dx-pi-ctas">
            <Link to="/welcome" className="dx-pi-btn dx-pi-btn-primary">
              Start with an idea <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <a href="#how-it-works" className="dx-pi-btn dx-pi-btn-ghost">
              See how it works
            </a>
          </div>
        </div>
        <ProductIntelligenceMap />
      </section>

      <section className="dx-pi-section" id="how-it-works" aria-labelledby="dx-pi-how-title">
        <div className="dx-pi-wrap">
          <h2 id="dx-pi-how-title">How it works</h2>
          <p className="dx-pi-section-lead">
            One PM-facing journey. Specialists work behind the scenes. You stay the decision-maker.
          </p>
          <div className="dx-pi-steps">
            {STEPS.map((step) => (
              <article className="dx-pi-step" key={step.n}>
                <span>{step.n}</span>
                <strong>{step.title}</strong>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="dx-pi-section" aria-labelledby="dx-pi-audience-title">
        <div className="dx-pi-wrap">
          <h2 id="dx-pi-audience-title">Who it is for</h2>
          <p className="dx-pi-section-lead">
            Built for people who need a clear product path—not a catalogue of unmanaged agents.
          </p>
          <div className="dx-pi-audiences">
            {AUDIENCES.map((item) => (
              <article className="dx-pi-card" key={item.title}>
                <strong>{item.title}</strong>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="dx-pi-section" aria-labelledby="dx-pi-trust-title">
        <div className="dx-pi-wrap">
          <h2 id="dx-pi-trust-title">Trust</h2>
          <p className="dx-pi-section-lead">
            Sample illustrations on this page are labelled. Unverified claims are never marked as
            verified.
          </p>
          <div className="dx-pi-trust">
            {TRUST.map((item) => (
              <article className="dx-pi-card" key={item.title}>
                <strong>{item.title}</strong>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="dx-pi-section" aria-labelledby="dx-pi-faq-title">
        <div className="dx-pi-wrap">
          <h2 id="dx-pi-faq-title">FAQ</h2>
          <p className="dx-pi-section-lead">Straight answers about control, outputs and cost.</p>
          <div className="dx-pi-faq">
            {FAQ.map((item) => (
              <details key={item.q}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
          <div className="dx-pi-ctas" style={{ marginTop: "2rem" }}>
            <Link to="/welcome" className="dx-pi-btn dx-pi-btn-primary">
              Start with an idea <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link to="/pricing" className="dx-pi-btn dx-pi-btn-ghost">
              Pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
