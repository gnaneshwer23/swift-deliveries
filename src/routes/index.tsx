import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { JourneyLadder } from "@/components/marketing/journey-ladder";
import { Bento, BentoTile } from "@/components/marketing/bento";
import { ProductView } from "@/components/marketing/product-view";
import { FaqSection } from "@/components/marketing/faq-section";
import { OnboardingGate } from "@/components/onboarding-gate";

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
              description: "The six-step DeliverX method, from realistic work to external verification.",
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
  { n: "06", name: "Carry it into live work", desc: "The same evidence discipline continues into your day-to-day product role." },
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

const HOME_FAQ = [
  {
    q: "Is this a course?",
    a: "No. You do product work inside realistic organisations, and what you produce is kept as a record you can defend. Learning happens through the work, not through lectures.",
  },
  {
    q: "What does Verified actually mean here?",
    a: "Only that a person outside DeliverX looked at a specific piece of your work and attested to it. A score, a coach confirmation or anything the platform calculates never lights Verified on its own.",
  },
  {
    q: "Is the work in Experience real client work?",
    a: "No. The organisations are simulated, with real constraints and consequences. We never present simulated work as paid client delivery.",
  },
  {
    q: "Can AI write my portfolio for me?",
    a: "No. AI can draft a starting point, always labelled as a draft, and nothing is saved until you read it, edit it and approve it. The record has to be yours to be worth anything.",
  },
];

function HomePage() {
  return (
    <MarketingLayout>
      <OnboardingGate />
      {/* HERO */}
      <div className="hero">
        <div className="hero-eyebrow">
          <span className="hero-dot" />
          <span className="x-label">Learn · Work · Build · Prove · Advance</span>
        </div>
        <h1 className="hero-h1">
          Don't just learn the job.
          <br />
          Do the job — and keep the proof.
        </h1>
        <p className="hero-sub">
          You do real product work, we keep a record of it, and the parts that hold up get confirmed
          by someone outside DeliverX. That record is yours to show.
        </p>
        <div className="hero-actions">
          <Link to="/signup" className="btn btn-amber">
            Get started
          </Link>
          <Link to="/pricing" className="btn btn-secondary">
            See plans
          </Link>
        </div>
        <div className="hero-trust">
          <span className="hero-trust-mark">◆</span>
          Verified means verified — only an outside attestation lights the signal
        </div>
      </div>

      {/* THE LADDER */}
      <JourneyLadder />

      {/* WHAT YOU GET */}
      <div className="steps-section">
        <div className="x-label">What you get</div>
        <h2 className="heading-1" style={{ margin: "14px 0 0", maxWidth: 640 }}>
          Five stages, one record that follows you through all of them.
        </h2>
        <Bento>
          <BentoTile
            span={4}
            onInk
            label="Work · Experience"
            title="Realistic product work, with consequences"
            body="You join a simulated organisation, meet its constraints and its awkward stakeholders, and make calls you have to defend. Every decision you make becomes an entry in your own record."
            foot="Experience →"
          />
          <BentoTile
            span={2}
            label="Build · Launchpad"
            title="A portfolio you can defend"
            body="Your strongest evidence becomes an explainable portfolio and an honest readiness story — no invented achievements."
          />
          <BentoTile
            span={2}
            label="Prove · Evidence record"
            title="Nothing edited after the fact"
            body="Each piece of work is frozen with a checksum the moment it is submitted, so what a coach confirms is exactly what you wrote."
          />
          <BentoTile
            span={2}
            label="Prove · Attestation"
            title="Confirmed by an outsider"
            body="A coach can confirm your work. Verified takes more: a person outside DeliverX has to attest to it directly."
          />
          <BentoTile
            span={2}
            label="Advance"
            title="Interviews and applications"
            body="Practise answers against your own evidence, and track applications in one place instead of a spreadsheet."
          />
        </Bento>
      </div>

      {/* PRODUCT VIEWS */}
      <div className="products-section">
        <div className="x-label">Inside the product</div>
        <h2 className="heading-1" style={{ margin: "14px 0 28px", maxWidth: 640 }}>
          This is what your record looks like.
        </h2>
        <ProductView
          frameLabel="Evidence record · sample entries"
          note="A sample record, shown to explain the format. It is not anyone's real results."
        >
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
        </ProductView>
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

      {/* SIX STEPS — the detail behind the ladder */}
      <div className="steps-section">
        <div className="x-label">How it actually works</div>
        <h2 className="heading-1" style={{ margin: "14px 0 0", maxWidth: 640 }}>
          Six steps, no shortcuts.
        </h2>
        <div className="steps-grid" style={{ marginTop: 32 }}>
          {STEPS.map((s) => (
            <div className="step-cell" key={s.n}>
              <div className="step-num">{s.n}</div>
              <div className="step-name">{s.name}</div>
              <div className="step-desc">{s.desc}</div>
            </div>
          ))}
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

      {/* PLANS TEASER */}
      <div className="products-section">
        <Bento>
          <BentoTile
            span={2}
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
            onInk
            label="Complete Journey"
            title="£29 / month"
            body="Everything above plus the Professional Workspace for live product work."
          />
        </Bento>
        <div style={{ marginTop: 20 }}>
          <Link to="/pricing" className="btn btn-amber">
            See plans
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
            <li>No job guarantee, and no money-back guarantee.</li>
            <li>No employer marketplace — we do not place you with companies.</li>
            <li>No score without a stated method you can read.</li>
            <li>No Verified signal from anything that happens inside the platform.</li>
          </ul>
        </div>
      </div>

      <FaqSection items={HOME_FAQ} />

      {/* CTA */}
      <div className="cta-section">
        <div className="cta-box">
          <h2 className="cta-h">Your work should speak for itself.</h2>
          <p className="cta-sub">
            Start with realistic product work and build an evidence record you control.
          </p>
          <div className="cta-btns">
            <Link to="/signup" className="btn btn-amber">
              Get started
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
