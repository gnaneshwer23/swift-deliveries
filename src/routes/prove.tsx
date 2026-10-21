import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { FaqSection, JourneyCrossSell } from "@/components/marketing/faq-section";
import { CtaLink } from "@/components/marketing/cta-link";

export const Route = createFileRoute("/prove")({
  head: () => ({
    meta: [
      { title: "Prove — Proof of skill, verified from outside | DeliverX" },
      {
        name: "description",
        content:
          "A four-step ladder from Submitted to Verified, backed by the Government Digital and Data Capability Framework, Open Badges 3.0 credentials and independent attesters.",
      },
      { property: "og:title", content: "DeliverX Prove — proof that cites more than itself" },
      {
        property: "og:description",
        content:
          "Every claim climbs a visible ladder: Submitted, Assessed, Coach-confirmed, Verified. Verified only lights when someone outside DeliverX signs an attestation.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://deliverx.dev/prove" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://deliverx.dev/prove" }],
  }),
  component: ProvePage,
});

const LADDER = [
  {
    n: "01",
    name: "Submitted",
    desc: "You freeze an artefact from a simulated organisation or your real work. It gets a checksum and a permanent place in your evidence ledger.",
    note: "Self-reported. Shown as such, always.",
    cls: "honest",
  },
  {
    n: "02",
    name: "Assessed",
    desc: "The artefact is scored against a versioned rubric with citations back to the evidence. The AI score is a draft signal, never proof on its own.",
    note: "An AI score alone never counts as proof.",
    cls: "honest",
  },
  {
    n: "03",
    name: "Coach-confirmed",
    desc: "A human coach reviews the artefact and the assessment, and confirms or rejects it with a written note. Their judgement is recorded, not blended into a score.",
    note: "Coach confirmation is shown separately — it never lights Verified.",
    cls: "trust",
  },
  {
    n: "04",
    name: "Verified",
    desc: "An independent attester you name — never DeliverX staff, never a paid coach, never someone on your own email domain — signs a fixed statement about one artefact. An Open Badges 3.0 credential is issued.",
    note: "The only path to Verified. Revocable by the attester within the hour.",
    cls: "trust",
  },
];

const REFERENCES = [
  {
    n: "A",
    name: "Government Digital and Data Capability Framework",
    desc: "Every artefact maps to named product manager skills and levels, from associate PM to head of product. Our level mapping is published as our interpretation — not a government endorsement.",
    note: "Framework version stays visible on every claim.",
    cls: "honest",
  },
  {
    n: "B",
    name: "Open Badges 3.0",
    desc: "Each signed attestation issues a standards-based digital credential you can take anywhere. It validates in any independent Open Badges verifier.",
    note: "Portable by design. Your record is yours.",
    cls: "trust",
  },
  {
    n: "C",
    name: "Independent attesters",
    desc: "Verification comes from a named person with a verified work identity who states their relationship to you. DeliverX never pays anyone per attestation — ever.",
    note: "Attestations expire: a renewal prompt appears after two years.",
    cls: "trust",
  },
];

function ProvePage() {
  return (
    <MarketingLayout>
      <div className="hero-lp">
        <div className="hero-lp-tag">Prove · Proof of skill, verified from outside</div>
        <h1>Proof that cites more than itself.</h1>
        <p className="hero-sub" style={{ marginBottom: 32 }}>
          Every claim on your record climbs a visible four-step ladder, and the top step is lit by
          someone outside DeliverX — never by us.
        </p>
        <CtaLink signedInTo="/workspace" signedInLabel="Open your record →" />
      </div>

      <div className="rule-box">
        <span className="rule-box-mark">◆</span>
        <span className="rule-box-text">
          Never counted as proof: course completion, an AI score alone, self-reported claims, or
          attestations from DeliverX staff or paid coaches.
        </span>
      </div>

      <div className="surfaces-section">
        <h2 className="heading-2" style={{ marginBottom: 6 }}>
          The ladder
        </h2>
        <p className="body">
          Four steps. Each one labels who is vouching and how much that vouch is worth.
        </p>
        <div className="surfaces-grid">
          {LADDER.map((s) => (
            <div className="surface-card" key={s.n}>
              <div className="surface-n">{s.n}</div>
              <div className="surface-name">{s.name}</div>
              <div className="surface-desc">{s.desc}</div>
              <div className={`surface-note ${s.cls}`}>{s.note}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="surfaces-section">
        <h2 className="heading-2" style={{ marginBottom: 6 }}>
          Three external references
        </h2>
        <p className="body">
          DeliverX is never the only source vouching for your record.
        </p>
        <div className="surfaces-grid">
          {REFERENCES.map((s) => (
            <div className="surface-card" key={s.n}>
              <div className="surface-n">{s.n}</div>
              <div className="surface-name">{s.name}</div>
              <div className="surface-desc">{s.desc}</div>
              <div className={`surface-note ${s.cls}`}>{s.note}</div>
            </div>
          ))}
        </div>
      </div>

      <FaqSection
        items={[
          {
            q: "Who can attest my work?",
            a: "Someone you name with a verified work email or LinkedIn identity who states their relationship to you. The system rejects DeliverX staff, paid coaches and anyone sharing your email domain. They see the frozen artefact, its checksum, the scenario brief and the rubric — never your score.",
          },
          {
            q: "Can an attestation be withdrawn?",
            a: "Yes. The attester can withdraw at any time and the credential is marked revoked within the hour — Verified switches off in the same step. Every attestation shows its date, and a renewal prompt appears after two years.",
          },
          {
            q: "What is the credential?",
            a: "An Open Badges 3.0 credential signed by DeliverX's issuer key, recording the attester's name, relationship and statement. It validates in independent Open Badges verifiers, so your proof travels with you.",
          },
          {
            q: "Does a simulation count as real experience?",
            a: "Simulated organisations are labelled as simulated on every screen and every shared link. What is being proven is the quality of your judgement and artefacts — assessed against a public framework — not employment history.",
          },
        ]}
      />

      <JourneyCrossSell note="Prove is built into every DeliverX surface: artefacts from Experience and the Professional Workspace climb the same ladder, and Launchpad shares only the steps you choose." />
    </MarketingLayout>
  );
}
