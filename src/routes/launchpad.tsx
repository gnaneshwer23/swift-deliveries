import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { JourneyLadder } from "@/components/marketing/journey-ladder";
import { FaqSection, JourneyCrossSell } from "@/components/marketing/faq-section";

export const Route = createFileRoute("/launchpad")({
  head: () => ({
    meta: [
      { title: "Launchpad — Make your readiness easy to inspect | DeliverX" },
      {
        name: "description",
        content:
          "Turn demonstrated work into a portfolio, interview narrative, and trust signal that can be explained. Verified comes only from external attestation.",
      },
      { property: "og:title", content: "DeliverX Launchpad — land the opportunity" },
      {
        property: "og:description",
        content:
          "Package the truth, not the theatre: evidence-backed claims, labelled heuristics, and an external attestation pathway.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LaunchpadPage,
});

const SURFACES = [
  {
    n: "01",
    name: "Career Intelligence",
    desc: "Understand which claims are evidence-backed, which are still heuristic, and where your record is thin. Every signal is labelled.",
    note: "Readiness uses labelled heuristics when ScoreRun data is thin. No unexplained percentages.",
    cls: "honest",
  },
  {
    n: "02",
    name: "Evidence Portfolio",
    desc: "Package selected artefacts into a clear portfolio without separating claims from their source. Private by default — share on your terms.",
    note: "Private evidence and attestor details are stripped from any shared view automatically.",
    cls: "trust",
  },
  {
    n: "03",
    name: "Interview Lab",
    desc: "Practise communicating decisions, trade-offs, and outcomes using the STAR framework against real artefacts you can defend under questioning.",
    note: "Stories are grounded in evidence you produced. Not fabricated scenarios or generic examples.",
    cls: "honest",
  },
  {
    n: "04",
    name: "External Attestation",
    desc: "Request independent confirmation of specific evidence from someone outside DeliverX. Verified remains off until the required checks are complete.",
    note: "Verified is never lit by a ScoreRun or coaching confirmation. External attestation is the only gate.",
    cls: "trust",
  },
  {
    n: "05",
    name: "Application tracking",
    desc: "Record the roles you apply for, the stage each one is at, and the next step you owe. Attach the portfolio link you shared with them.",
    note: "Your own record of your search. DeliverX does not submit applications for you and has no employer marketplace.",
    cls: "honest",
  },
];

const PATHWAY = [
  { h: "Select evidence", p: "In Launchpad, choose the specific artefact and framework dimension you want attested." },
  { h: "Name your attestor", p: "Identify an independent expert — former manager, senior peer, domain specialist. A secure link is created for them." },
  { h: "Attestor reviews", p: "They see the artefact, the provenance chain, and the framework dimension — nothing else from your profile." },
  { h: "Attestor confirms", p: "They confirm the evidence reflects capability they have personally witnessed. Their professional judgement, not a platform score." },
  { h: "Ledger updated", p: "An external verification record is added to the ledger entry. Attestor identity is held under privacy controls. Dispute mechanism available." },
  { h: "Verified lights", p: "Only now does the Verified signal activate on your profile and portfolio. It switches off if you revoke sharing." },
];

function LaunchpadPage() {
  return (
    <MarketingLayout>
      <div className="hero-lp">
        <div className="hero-lp-tag">02 · Launchpad · Land the opportunity</div>
        <h1>Make your readiness easy to inspect.</h1>
        <p className="hero-sub" style={{ marginBottom: 32 }}>
          Turn demonstrated work into a portfolio, interview narrative, and trust signal that can be
          explained.
        </p>
        <Link to="/signup" className="btn btn-amber">
          Get started
        </Link>
      </div>

      <JourneyLadder active="build" />

      <div className="rule-box">
        <span className="rule-box-mark">◆</span>
        <span className="rule-box-text">
          Explain the signal — or label it heuristic. Claims link to evidence. Framework versions
          stay visible. Verification comes from outside.
        </span>
      </div>

      <div className="surfaces-section">
        <h2 className="heading-2" style={{ marginBottom: 6 }}>
          Package the truth. Not the theatre.
        </h2>
        <p className="body">
          Launchpad helps you select, explain and present what your record actually supports.
        </p>
        <div className="surfaces-grid">
          {SURFACES.map((s) => (
            <div className="surface-card" key={s.n}>
              <div className="surface-n">{s.n}</div>
              <div className="surface-name">{s.name}</div>
              <div className="surface-desc">{s.desc}</div>
              <div className={`surface-note ${s.cls}`}>{s.note}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="attest-section">
        <div className="attest-inner">
          <h2 className="attest-title">The Verified pathway</h2>
          <p className="attest-sub">
            Six steps from request to signal — every one transparent, none skippable.
          </p>
          <div className="attest-steps">
            {PATHWAY.map((s, i) => (
              <div className="attest-step" key={s.h}>
                <div className="attest-num active">{i + 1}</div>
                <div className="attest-body">
                  <h4>{s.h}</h4>
                  <p>{s.p}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <FaqSection
        items={[
          {
            q: "What does the Verified badge actually mean?",
            a: "It means someone independent of DeliverX reviewed a specific piece of your work and confirmed it reflects capability they witnessed. A coach confirmation is shown separately and never lights Verified, and neither does an AI-assisted score.",
          },
          {
            q: "Does Interview Lab invent scenarios for me to practise?",
            a: "No. Questions are drafted from the work already on your record, and every drafted question is labelled as a draft you can edit, add to or remove. Your practice answers and self-ratings stay practice — they never become evidence.",
          },
          {
            q: "Who can see my portfolio?",
            a: "Nobody until you create a share link. Links expire, you can revoke them at any time, and private evidence and attestor details are removed from the shared view.",
          },
          {
            q: "Will DeliverX find me a job?",
            a: "No. There is no job guarantee and no employer marketplace. Launchpad helps you package and explain what your record supports, and track your own applications.",
          },
        ]}
      />

      <JourneyCrossSell note="Launchpad works from evidence produced in Experience and in the Professional Workspace. The Complete Journey plan covers all three so your record, your portfolio and your delivery work stay in one place." />
    </MarketingLayout>
  );
}
