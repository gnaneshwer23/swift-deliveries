import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { JourneyLadder } from "@/components/marketing/journey-ladder";
import { FaqSection, JourneyCrossSell } from "@/components/marketing/faq-section";
import { CtaLink } from "@/components/marketing/cta-link";

export const Route = createFileRoute("/professional-workspace")({
  head: () => ({
    meta: [
      { title: "Professional Workspace — From business case to delivery | DeliverX" },
      {
        name: "description",
        content:
          "The layer between the business case and the backlog. Freeze the baseline, form the team from capabilities, and report objective health to the sponsor.",
      },
      { property: "og:title", content: "DeliverX Professional Workspace" },
      {
        property: "og:description",
        content:
          "Turn an approved business case into a team, a plan and a weekly delivery loop — reported against objectives, not tickets.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://deliverx.dev/professional-workspace" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://deliverx.dev/professional-workspace" }],
  }),
  component: ProfessionalWorkspacePage,
});

const STAGES = [
  "Upload the approved business case",
  "Freeze the baseline",
  "Form the team from needed capabilities",
  "Plan work linked to objectives",
  "Run the weekly delivery loop",
  "Close and hand back evidence",
];

const FEATURES = [
  {
    n: "01",
    name: "Business case upload",
    desc: "Bring the approved case as PDF, Word or text. Objectives, benefits and constraints are drafted out of it with a pointer back to the source line — you confirm each one.",
  },
  {
    n: "02",
    name: "Frozen baseline",
    desc: "Once agreed, the case is frozen with a checksum and kept as a version. Changes go through a change request, so progress is always measured against what was approved.",
  },
  {
    n: "03",
    name: "Teams formed from capabilities",
    desc: "Each workstream lists the capabilities it needs, not names. Role slots are filled by invitation, and an empty slot is logged as a delivery risk automatically.",
  },
  {
    n: "04",
    name: "Every task tied to an objective",
    desc: "Work items link to the objective they serve. Anything unlinked is flagged, so effort that does not move the case is visible early.",
  },
  {
    n: "05",
    name: "Objective health for the sponsor",
    desc: "The sponsor view leads with how each objective is tracking, not ticket counts. Every figure and every assistant answer cites the record it came from.",
  },
  {
    n: "06",
    name: "Evidence that belongs to the person",
    desc: "Observation is off by default. Managers never see capability scores. When a project closes, consented delivery evidence goes into each person's own portable record.",
  },
];

const ROLES = [
  { name: "Sponsor", desc: "Owns the case. Approves the baseline, change requests and closure. Sees objective health first." },
  { name: "Delivery lead", desc: "Runs the weekly loop day to day: plan, decisions, risks and the approval queue." },
  { name: "Business analyst", desc: "Structures the case into objectives and requirements and keeps traceability honest." },
  { name: "Contributor", desc: "Engineers, QA and designers share one view with a role tag. Contributors join free." },
];

const CONTROL = ["Draft prepared", "Human reviewed", "Approved or returned", "Committed to the record"];

function ProfessionalWorkspacePage() {
  return (
    <MarketingLayout>
      <div className="hero-ws">
        <div className="hero-ws-tag">03 · Professional Workspace · For sponsors and delivery leads</div>
        <h1>
          The layer between the business case
          <br />
          and the backlog.
        </h1>
        <p className="body-lg" style={{ marginBottom: 32 }}>
          Turn an approved case into a team, a plan and a weekly delivery loop — and report progress
          against the case's objectives, not ticket counts.
        </p>
        <CtaLink signedInTo="/workspace/projects" signedInLabel="Open Workspace →" />
      </div>

      <JourneyLadder active="advance" />

      <div className="consent-bar">
        <strong>Now taking design partners.</strong> We are working with a small number of
        organisations running 5–30 change projects a year, starting in healthcare and education.
      </div>

      <div className="features-section">
        <h2 className="heading-2" style={{ marginBottom: 6 }}>
          Own the case, not the tickets.
        </h2>
        <p className="body">
          Keep your task tool. Workspace holds what it does not: the case, its objectives, decisions,
          risks and the sponsor's view.
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

      <div className="features-section">
        <h2 className="heading-2" style={{ marginBottom: 6 }}>
          Six stages, each ending at a human gate.
        </h2>
        <p className="body">Stage five repeats weekly until the sponsor closes the project.</p>
        <div className="features-grid">
          {STAGES.map((s, i) => (
            <div className="feature-card" key={s}>
              <div className="feature-n">{String(i + 1).padStart(2, "0")}</div>
              <div className="feature-name">{s}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="features-section">
        <h2 className="heading-2" style={{ marginBottom: 6 }}>
          Four roles. Nothing more to configure.
        </h2>
        <p className="body">
          Planned pricing is per active project per month, from £750, with unlimited free
          contributors.
        </p>
        <div className="features-grid">
          {ROLES.map((r) => (
            <div className="feature-card" key={r.name}>
              <div className="feature-name">{r.name}</div>
              <div className="feature-desc">{r.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="control-path">
        <div className="control-inner">
          <h2 className="control-title">AI drafts. Humans decide.</h2>
          <p className="control-sub">
            Actions, decisions and risks drafted from meeting notes wait in an approval queue. A
            rejected draft goes back with the reviewer's edits.
          </p>
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
              Nothing an assistant prepares becomes a commitment, a baseline change or an evidence
              entry until a named person approves it.
            </div>
          </div>
        </div>
      </div>

      <FaqSection
        items={[
          {
            q: "Does this replace Jira or Linear?",
            a: "No. Tasks stay minimal here; syncing with Jira and Linear is planned next. Workspace is where the case, objectives, decisions and risks live.",
          },
          {
            q: "What is not included in the first version?",
            a: "Gantt charts, resource levelling, timesheets, portfolio or programme views, and per-role dashboards beyond the four roles.",
          },
          {
            q: "Is anything recorded about how I work?",
            a: "Only if you switch observation on for that project. It is off by default, enforced in the database as well as the interface, and turning it off stops new records immediately.",
          },
          {
            q: "Can an assistant submit work on my behalf?",
            a: "No. Drafts arrive labelled as drafts. You approve, edit or dismiss them, and approving only creates working content — submitting is always a separate action you take.",
          },
          {
            q: "What happens when I submit an artefact?",
            a: "The text is frozen with a checksum, stored as an immutable version, and added to your evidence record. It cannot be edited afterwards, which is what makes it worth showing to someone else.",
          },
          {
            q: "Is Team Copilot a separate product?",
            a: "No. It is another name for the Professional Workspace, not a third thing to buy.",
          },
        ]}
      />

      <JourneyCrossSell note="The Professional Workspace is where delivery work happens; Experience is where you practise it and Launchpad is where you present it. The Complete Journey plan includes all three." />
    </MarketingLayout>
  );
}
