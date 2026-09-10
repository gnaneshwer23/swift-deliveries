import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/marketing-layout";

export const Route = createFileRoute("/professional-workspace")({
  head: () => ({
    meta: [
      { title: "Professional Workspace — Move the work forward | DeliverX" },
      {
        name: "description",
        content:
          "One controlled space for meetings, artefacts, decisions and evidence — built around human ownership. Observation starts off; privacy starts on.",
      },
      { property: "og:title", content: "DeliverX Professional Workspace" },
      {
        property: "og:description",
        content:
          "Assistance without loss of control. Nothing becomes a commitment by accident.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfessionalWorkspacePage,
});

const FEATURES = [
  {
    n: "01",
    name: "Meetings with continuity",
    desc: "Keep agendas, decisions, and follow-ups connected to the work they affect — not in a separate notes app.",
  },
  {
    n: "02",
    name: "Living artefacts",
    desc: "Maintain charters, requirements, and change history without losing context. Assistants prepare drafts — drafts remain drafts until you review and submit.",
  },
  {
    n: "03",
    name: "Review before commitment",
    desc: "Nothing becomes a commitment by accident. The control path is explicit and enforced at the architecture level.",
  },
  {
    n: "04",
    name: "Consent-led observation",
    desc: "Observation is off by default. You must actively consent. When on, contributions with sufficient provenance can enter your evidence record.",
  },
];

const CONTROL = ["Context captured", "Draft prepared", "Human reviewed", "Team committed"];

function ProfessionalWorkspacePage() {
  return (
    <MarketingLayout>
      <div className="hero-ws">
        <div className="hero-ws-tag">03 · Professional Workspace · Succeed in the role</div>
        <h1>
          Move the work forward.
          <br />
          Keep the context.
        </h1>
        <p className="body-lg" style={{ marginBottom: 32 }}>
          One controlled space for meetings, artefacts, decisions and evidence — built around human
          ownership.
        </p>
        <Link to="/pilot" className="btn btn-primary">
          Open Workspace →
        </Link>
      </div>

      <div className="consent-bar">
        <strong>Observation starts off.</strong> Privacy starts on. You decide when observation is
        active and what stays private.
      </div>

      <div className="features-section">
        <h2 className="heading-2" style={{ marginBottom: 6 }}>
          Assistance without loss of control.
        </h2>
        <p className="body">
          Support can prepare and review work. People remain accountable for decisions, submissions,
          and commitments.
        </p>
        <div className="features-grid">
          {FEATURES.map((f) => (
            <div className="feature-card" key={f.n}>
              <div className="feature-n">{f.n}</div>
              <div className="feature-name">{f.name}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="control-path">
        <div className="control-inner">
          <h2 className="control-title">Nothing becomes a commitment by accident.</h2>
          <p className="control-sub">The control path is explicit, not advisory.</p>
          <div className="control-steps">
            {CONTROL.map((c, i) => (
              <div className="control-step" key={c}>
                <div className="control-step-n">{String(i + 1).padStart(2, "0")}</div>
                <div className="control-step-name">{c}</div>
              </div>
            ))}
          </div>
          <div className="invariant-box">
            <div className="invariant-label">The human ownership invariant</div>
            <div className="invariant-text">
              "AI suggests. Humans decide. Delivery happens." No assisted action in Workspace
              creates a commitment, a ledger entry, or a capability signal without a human reviewing
              and submitting it first. This is architecturally enforced, not a policy preference.
            </div>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
