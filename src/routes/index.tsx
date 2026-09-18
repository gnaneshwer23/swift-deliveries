import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/marketing-layout";

const TITLE = "DeliverX — Do the work. Keep the proof. Earn the signal.";
const DESCRIPTION =
  "DeliverX turns realistic product management work into traceable evidence, versioned capability judgements, and career-ready proof. Verified lights only from external attestation.";

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
                "Experience, Launchpad and Professional Workspace together, with the full evidence record and capability profile.",
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
              name: "How DeliverX builds verifiable capability",
              description: "The five-step DeliverX method, from realistic work to external verification.",
              step: STEPS.map((s, i) => ({
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
  <svg width="14" height="14" fill="none" stroke="var(--x-slate)" strokeWidth="1.5" viewBox="0 0 24 24">
    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const clipIcon = (
  <svg width="14" height="14" fill="none" stroke="var(--x-slate)" strokeWidth="1.5" viewBox="0 0 24 24">
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const badgeIcon = (
  <svg width="14" height="14" fill="none" stroke="var(--x-amber)" strokeWidth="1.5" viewBox="0 0 24 24">
    <path d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const STEPS = [
  { n: "01", name: "Do realistic work", desc: "Product situations with real constraints, stakeholders, and consequences." },
  { n: "02", name: "Capture the artefact", desc: "Decisions enter a private, provenance-backed evidence record." },
  { n: "03", name: "Judge capability", desc: "Evidence assessed against a pinned, versioned framework." },
  { n: "04", name: "Package readiness", desc: "Strong evidence becomes an explainable portfolio and readiness story." },
  { n: "05", name: "Verify externally", desc: "Only external attestation activates Verified. Nothing inside the platform lights it." },
];

const PRODUCTS = [
  {
    n: "01",
    name: "Experience",
    tag: "Build the experience",
    desc: "Work as a PM inside realistic simulated organisations. Your actions — not the setup — create the evidence.",
    link: "Start Experience →",
    to: "/experience",
  },
  {
    n: "02",
    name: "Launchpad",
    tag: "Land the opportunity",
    desc: "Turn judged evidence into an explainable portfolio, honest readiness story, and stronger interview preparation.",
    link: "Open Launchpad →",
    to: "/launchpad",
  },
  {
    n: "03",
    name: "Workspace",
    tag: "Succeed in the role",
    desc: "Carry the same evidence discipline into live product work with your organisation and team.",
    link: "Open Workspace →",
    to: "/professional-workspace",
  },
];

const PILLARS = [
  {
    n: "01",
    title: "Provenance-backed evidence",
    body: "Work is tied to an immutable version and records exactly where it came from.",
  },
  {
    n: "02",
    title: "Versioned capability judgement",
    body: "Capability is written only through a pinned framework and an explainable ScoreRun.",
  },
  {
    n: "03",
    title: "External verification only",
    body: "Verified appears only after an outside person attests. A ScoreRun alone can never light it.",
  },
];

const USE_CASES = [
  { tag: "The gap", text: "Job posts say two years PM experience required. You have none on paper." },
  { tag: "Proof", text: "You did the work. It disappeared the moment you closed the sprint." },
  { tag: "Trust", text: "Your CV is a best-guess reconstruction. Employers have learned to discount it." },
  { tag: "The gap", text: "Your course certificate says you completed it. Not that you can do it." },
  { tag: "Proof", text: "AI generated your portfolio. That's not a credential — it's a liability." },
  { tag: "Trust", text: "Hiring managers ask for a work sample. You don't have one you can defend." },
];

function HomePage() {
  return (
    <MarketingLayout>
      {/* HERO */}
      <div className="hero">
        <div className="hero-eyebrow">
          <span className="hero-dot" />
          <span className="caption" style={{ color: "var(--x-teal-text)", fontWeight: 500 }}>
            Professional Intelligence · Now open
          </span>
        </div>
        <h1 className="hero-h1">
          Do the work.
          <br />
          Keep the proof.
          <br />
          Earn the signal.
        </h1>
        <p className="hero-sub">
          DeliverX turns realistic product work into traceable evidence, versioned capability
          judgements, and career-ready proof. No shortcuts. No silent promotions.
        </p>
        <div className="hero-actions">
          <Link to="/signup" className="btn btn-primary">
            Start with Experience
          </Link>
          <Link to="/pricing" className="btn btn-secondary">
            See plans
          </Link>
          <Link to="/how-it-works" className="btn btn-secondary">
            How it works

          </Link>
        </div>
        <div className="hero-trust">
          <span className="hero-trust-mark">◆</span>
          Verified means verified — only external attestation lights the signal
        </div>
      </div>

      {/* LIVE EVIDENCE RECORD (illustrative sample) */}
      <div className="record-strip">
        <div className="strip-wrap">
          <div className="strip-head">
            <span className="strip-head-label">Evidence record · Maya R · Private by default</span>
            <span className="strip-head-live">3 entries this session</span>
          </div>
          <div className="record-row">
            <span className="record-index">01</span>
            <div className="record-icon-wrap">{docIcon}</div>
            <div className="record-body">
              <div className="record-title">Discovery brief — MediFlow Q3</div>
              <div className="record-sub">experience_simulation · pm-core@2026.1 · artefact:a1f4b3c</div>
            </div>
            <div className="record-stat">
              <div className="record-band">B+</div>
              <div className="record-band-label">Observed</div>
            </div>
            <span className="pill pill-teal">Assessed</span>
          </div>
          <div className="record-row">
            <span className="record-index">02</span>
            <div className="record-icon-wrap">{clipIcon}</div>
            <div className="record-body">
              <div className="record-title">Prioritisation decision — Feature roadmap</div>
              <div className="record-sub">experience_simulation · pm-core@2026.1 · artefact:b2e7d1f</div>
            </div>
            <div className="record-stat">
              <div className="record-band">A−</div>
              <div className="record-band-label">ScoreRun</div>
            </div>
            <span className="pill pill-purple">Capability</span>
          </div>
          <div className="record-row">
            <span className="record-index">03</span>
            <div className="record-icon-wrap">{badgeIcon}</div>
            <div className="record-body">
              <div className="record-title">Product requirements doc — GreenGrid</div>
              <div className="record-sub">coaching_submission · coach_confirmed:true · externally_attested</div>
            </div>
            <div className="record-stat">
              <div className="record-band" style={{ color: "var(--x-amber)" }}>
                ✓
              </div>
              <div className="record-band-label">Verified</div>
            </div>
            <span className="pill pill-amber">Verified</span>
          </div>
        </div>
      </div>

      {/* FIVE STEPS */}
      <div className="steps-section">
        <div className="steps-label">The method — no shortcuts</div>
        <div className="steps-grid">
          {STEPS.map((s) => (
            <div className="step-cell" key={s.n}>
              <div className="step-num">{s.n}</div>
              <div className="step-name">{s.name}</div>
              <div className="step-desc">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* THREE PRODUCTS */}
      <div className="products-section">
        <div className="products-grid">
          {PRODUCTS.map((p) => (
            <Link to={p.to} className="product-card" key={p.n}>
              <div className="product-card-head">
                <div className="product-card-num">{p.n}</div>
                <div className="product-card-name">{p.name}</div>
                <div className="product-card-tag">{p.tag}</div>
              </div>
              <div className="product-card-body">
                <div className="product-card-desc">{p.desc}</div>
                <div className="product-card-link">{p.link}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* TRUST MODEL */}
      <div className="trust-section">
        <div className="trust-inner">
          <div className="trust-eyebrow">THE TRUST MODEL</div>
          <h2 className="trust-heading">
            A claim is not evidence.
            <br />
            <em>A score is not verification.</em>
          </h2>
          <div className="trust-pillars">
            {PILLARS.map((p) => (
              <div className="trust-pillar" key={p.n}>
                <div className="trust-pillar-n">{p.n}</div>
                <div className="trust-pillar-title">{p.title}</div>
                <div className="trust-pillar-body">{p.body}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* USE CASES */}
      <div className="uc-section">
        <h2 className="heading-2" style={{ marginBottom: 8 }}>
          What brings people here
        </h2>
        <p className="body" style={{ marginBottom: 0 }}>
          Pick the sentence you've said yourself.
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

      {/* CTA */}
      <div className="cta-section">
        <div className="cta-box">
          <h2 className="cta-h">Your work should speak for itself.</h2>
          <p className="cta-sub">
            Start with realistic product work and build an evidence record you control.
          </p>
          <div className="cta-btns">
            <Link to="/signup" className="btn btn-primary">
              Create account
            </Link>
            <Link to="/pricing" className="btn btn-secondary">
              See plans
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
