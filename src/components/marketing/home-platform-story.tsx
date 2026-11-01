import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCheck,
  Code2,
  Eye,
  FilePenLine,
  Gavel,
  Lightbulb,
  Lock,
  MessageSquareText,
  Rocket,
  ScanSearch,
  Send,
  Target,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  BuildPathIllustration,
  ControlIllustration,
  LearningIllustration,
  OptionVessel,
  WorkforceIllustration,
} from "@/components/illustrations/platform-illustrations";
import { SAMPLE_DECISION_RESULT, SAMPLE_DECISION_SPEC } from "@/lib/marketing/sample-deliberation";
import {
  WORKFORCE_AVAILABLE_IDS,
  WORKFORCE_DEPARTMENTS,
  WORKFORCE_INTENTS,
  WORKFORCE_TOTAL,
  type WorkforceIntent,
} from "@/lib/marketing/workforce-summary";
import { EMPTY_BRIEF } from "@/lib/marketing/product-resources";
import { loadPilotBrief, savePilotBrief } from "@/lib/pilot/storage";

const CHAPTERS = [
  { id: "hp-workforce", label: "Specialists" },
  { id: "hp-decisions", label: "Decisions" },
  { id: "hp-record", label: "Build record" },
  { id: "hp-control", label: "Your control" },
  { id: "hp-workspace", label: "Your workspace" },
  { id: "hp-learning", label: "Learn by building" },
];

export function HomePlatformStory() {
  return (
    <div className="hp-story">
      <nav className="hp-chapters" aria-label="Explore the platform">
        <div className="dxl-wrap">
          {CHAPTERS.map((c, i) => (
            <a key={c.id} href={`#${c.id}`}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              {c.label}
            </a>
          ))}
        </div>
      </nav>
      <WorkforceSection />
      <DecisionSection />
      <BuildRecordSection />
      <ControlSection />
      <FoundationSection />
      <WorkspaceSection />
      <LearningSection />
      <PromptSection />
    </div>
  );
}

function Heading({
  n,
  eyebrow,
  title,
  children,
}: {
  n: string;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <header className="hp-heading">
      <span className="hp-n">{n}</span>
      <div>
        <p className="dxl-eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      <div className="hp-lede">{children}</div>
    </header>
  );
}

function StageBar({
  label,
  value,
  children,
}: {
  label: string;
  value: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="hp-stagebar">
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 01 Specialists
// ---------------------------------------------------------------------------
const INTENTS: Array<{ id: WorkforceIntent; label: string; prompt: string }> = [
  { id: "investigate", label: "Investigate", prompt: "Why do new users leave during setup?" },
  { id: "prototype", label: "Prototype", prompt: "Prototype a guided first-project flow." },
  { id: "improve", label: "Improve", prompt: "Improve our current sign-up journey." },
  { id: "build", label: "Build", prompt: "Take onboarding from question to tested prototype." },
];

function WorkforceSection() {
  const [intent, setIntent] = useState<WorkforceIntent>("prototype");
  const team = WORKFORCE_INTENTS[intent];
  const active = useMemo(() => {
    const m = new Map<number, number>();
    for (const c of team) m.set(c.department, (m.get(c.department) ?? 0) + 1);
    return m;
  }, [team]);
  const current = INTENTS.find((i) => i.id === intent)!;
  return (
    <section className="hp-section" id="hp-workforce">
      <div className="dxl-wrap">
        <Heading
          n="01"
          eyebrow="Specialist agents"
          title={`${WORKFORCE_TOTAL} specialists. Only the ones your mission needs.`}
        >
          <p>
            A small team, picked from {WORKFORCE_DEPARTMENTS.length} departments for each mission.
            You see who before anything runs.
          </p>
        </Heading>
        <div className="ix hp-stage">
          <div className="hp-input">
            <div>
              <small>Your prompt</small>
              <strong>“{current.prompt}”</strong>
            </div>
            <div className="hp-chips" role="group" aria-label="Choose a mission type">
              {INTENTS.map((i) => (
                <button
                  key={i.id}
                  type="button"
                  aria-pressed={i.id === intent}
                  onClick={() => setIntent(i.id)}
                >
                  {i.label}
                </button>
              ))}
            </div>
          </div>
          <div className="hp-rule">
            <span>Assembled team</span>
          </div>
          <div className="hp-wf-grid">
            <WorkforceIllustration departments={WORKFORCE_DEPARTMENTS} active={active} />
            <ol className="hp-roster" aria-label="Specialists on this mission">
              {team.map((c) => (
                <li key={c.id}>
                  <span>{c.id}</span>
                  {c.name.replace(/ Agent$/, "")}
                </li>
              ))}
            </ol>
          </div>
          <StageBar
            label="Mission team"
            value={`${team.length} specialists · ${active.size} departments`}
          >
            <p>
              {WORKFORCE_AVAILABLE_IDS.length} roles are available today. The other{" "}
              {WORKFORCE_TOTAL - WORKFORCE_AVAILABLE_IDS.length} are in development and are never
              shown as live.
            </p>
          </StageBar>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 02 Decisions
// ---------------------------------------------------------------------------
function DecisionSection() {
  const R = SAMPLE_DECISION_RESULT;
  const [round, setRound] = useState<1 | 2>(2);
  // In round 1 the persuaded panellists still held their first view.
  const votesFor = (optionId: string) =>
    R.votes.filter(
      (v) => (round === 1 && "revisedFrom" in v ? v.revisedFrom : v.optionId) === optionId,
    ).length;
  const ordered = [...SAMPLE_DECISION_SPEC.options].sort(
    (a, b) =>
      (R.tally.find((t) => t.optionId === b.id)?.share ?? 0) -
      (R.tally.find((t) => t.optionId === a.id)?.share ?? 0),
  );
  const chosen = SAMPLE_DECISION_SPEC.options.find((o) => o.id === R.chosenOptionId)!;
  const chosenShare = Math.round(
    (R.tally.find((t) => t.optionId === R.chosenOptionId)?.share ?? 0) * 100,
  );
  return (
    <section className="hp-section" id="hp-decisions">
      <div className="dxl-wrap">
        <Heading n="02" eyebrow="Decisions" title="Agents disagree on purpose. You see why.">
          <p>Each specialist scores alone first. Vetoes are hard rules. Big calls come to you.</p>
        </Heading>
        <div className="ix hp-stage">
          <div className="hp-input">
            <div>
              <small>Decision</small>
              <strong>{SAMPLE_DECISION_SPEC.question}</strong>
            </div>
            <div className="hp-chips" role="group" aria-label="Deliberation round">
              <button type="button" aria-pressed={round === 1} onClick={() => setRound(1)}>
                Independent views
              </button>
              <button type="button" aria-pressed={round === 2} onClick={() => setRound(2)}>
                After critique
              </button>
            </div>
          </div>
          <div className="hp-rule">
            <span>
              {SAMPLE_DECISION_SPEC.panel.length + 1} specialists · each figure is one vote
            </span>
          </div>
          <div className="hp-options">
            {ordered.map((o) => {
              const t = R.tally.find((x) => x.optionId === o.id)!;
              const share = round === 2 ? t.share : 0;
              return (
                <div key={o.id} className="hp-option" data-vetoed={t.vetoed || undefined}>
                  <OptionVessel
                    votes={votesFor(o.id)}
                    vetoed={t.vetoed}
                    chosen={round === 2 && o.id === R.chosenOptionId}
                  />
                  <h3>{o.label}</h3>
                  <p>{o.summary}</p>
                  {t.vetoed ? (
                    <div className="hp-veto">
                      <Lock size={13} aria-hidden="true" /> Vetoed by{" "}
                      {R.vetoes.find((v) => v.optionId === o.id)?.role}:{" "}
                      {R.vetoes.find((v) => v.optionId === o.id)?.reason}
                    </div>
                  ) : (
                    <div className="hp-support">
                      <div className="hp-support-row">
                        <span>Weighted support</span>
                        <strong>{round === 2 ? `${Math.round(share * 100)}%` : "—"}</strong>
                      </div>
                      <div className="hp-bar" style={{ ["--share" as string]: `${share * 100}%` }}>
                        <i />
                        <b style={{ left: `${R.supermajority * 100}%` }} aria-hidden="true" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <StageBar
            label={round === 2 ? "Outcome" : "Round 1"}
            value={
              round === 2
                ? `${chosen.label} reached ${chosenShare}% — waiting for your ratification`
                : "Positions taken independently, before anyone sees the others"
            }
          >
            <p>
              {round === 2
                ? `Two panellists changed their vote after critique; UX Research kept its dissent, and it stays on the record. Sample decision: the real tally rules running on template scores, not customer data, with a panel drawn from the full catalogue, including roles still in development.`
                : "Switch to “After critique” to see who changed their mind, and who persuaded them."}
            </p>
          </StageBar>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 03 Build record
// ---------------------------------------------------------------------------
type Step = {
  id: string;
  label: string;
  icon: LucideIcon;
  who: string;
  used: string;
  decided: string;
  open: string;
  how: string;
};
const SAMPLE_DECIDED = (() => {
  const R = SAMPLE_DECISION_RESULT;
  const label = (id: string) => SAMPLE_DECISION_SPEC.options.find((o) => o.id === id)?.label;
  const share = R.tally.find((t) => t.optionId === R.chosenOptionId)?.share ?? 0;
  const vetoes = R.vetoes.map((v) => `${label(v.optionId)} vetoed by ${v.role}.`).join(" ");
  return `${label(R.chosenOptionId)}, ${Math.round(share * 100)}% weighted support. ${vetoes}`;
})();
const STEPS: Step[] = [
  {
    id: "prompt",
    label: "Prompt",
    icon: MessageSquareText,
    who: "You",
    used: "One sentence: “Help new users reach their first product in one session.”",
    decided: "The objective and the constraints you set: two weeks, no change to billing.",
    open: "Who exactly counts as a new user.",
    how: "Written by you.",
  },
  {
    id: "frame",
    label: "Frame",
    icon: Target,
    who: "Problem-Framing · DX-002",
    used: "Your prompt and constraints.",
    decided: "A problem statement, a desired outcome and three questions to answer first.",
    open: "Whether setup or first use is the bigger drop-off.",
    how: "Simulated draft (deterministic planner), labelled as such.",
  },
  {
    id: "evidence",
    label: "Evidence",
    icon: ScanSearch,
    who: "Research Synthesis · DX-020, Evidence Verification · DX-018",
    used: "Six sources you supplied, each linked to the claims it supports.",
    decided: "What is known, what is inferred, and one gap kept open.",
    open: "No drop-off data was supplied, so none is assumed.",
    how: "Cited sources; synthetic interviews are rehearsal only and never count as evidence.",
  },
  {
    id: "decide",
    label: "Decide",
    icon: Gavel,
    who: `${SAMPLE_DECISION_SPEC.panel.length + 1} specialists, then you`,
    used: `The evidence register and ${SAMPLE_DECISION_SPEC.options.length} options.`,
    decided: SAMPLE_DECIDED,
    open: "UX Research’s dissent on customer value, kept as a review condition.",
    how: "Deterministic tally rules; high impact, so it waits for your ratification.",
  },
  {
    id: "build",
    label: "Build",
    icon: Code2,
    who: "Wireframing · DX-035, Software Architect · DX-041",
    used: "The ratified decision and its acceptance criteria.",
    decided: "An HTML prototype (v1) and an architecture note.",
    open: "Production deployment is out of scope for this mission.",
    how: "Each artefact names the model or says it is a simulated draft.",
  },
  {
    id: "verify",
    label: "Verify",
    icon: CheckCheck,
    who: "Test Strategy · DX-071, Code Review · DX-049",
    used: "The prototype and its acceptance criteria.",
    decided: "Quality label: Agent-reviewed.",
    open: "No runtime test log yet, so it is not labelled Automatically tested.",
    how: "Labels are Agent-reviewed, Automatically tested, Human-reviewed or Externally attested — never a generic “verified”.",
  },
  {
    id: "learn",
    label: "Release & learn",
    icon: Rocket,
    who: "You",
    used: "The expected measure set before the build.",
    decided: "A proposed next mission, waiting for your approval.",
    open: "Observed result not yet supplied — it stays missing until you add it.",
    how: "Only outcomes you observe and supply are recorded as outcomes.",
  },
];

function BuildRecordSection() {
  const [selected, setSelected] = useState("decide");
  const step = STEPS.find((s) => s.id === selected)!;
  const index = STEPS.indexOf(step);
  return (
    <section className="hp-section hp-section-feature" id="hp-record">
      <div className="dxl-wrap">
        <Heading
          n="03"
          eyebrow="Build record"
          title="Ask how your product was built. Get the whole pathway."
        >
          <p>Prompt, evidence, options, decision, build and checks, in one record you download.</p>
        </Heading>
        <div className="ix hp-stage">
          <div className="hp-input">
            <div>
              <small>Product</small>
              <strong>Onboarding redesign · sample record</strong>
            </div>
            <div className="hp-chips">
              <button
                type="button"
                onClick={() => setSelected(STEPS[Math.max(0, index - 1)]!.id)}
                disabled={index === 0}
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setSelected(STEPS[Math.min(STEPS.length - 1, index + 1)]!.id)}
                disabled={index === STEPS.length - 1}
              >
                Next step
              </button>
            </div>
          </div>
          <div className="hp-path-scroll">
            <BuildPathIllustration steps={STEPS} selected={selected} onSelect={setSelected} />
          </div>
          <div className="hp-record" aria-live="polite">
            <div className="hp-record-title">
              <small>
                Step {index + 1} of {STEPS.length}
              </small>
              <h3>{step.label}</h3>
              <p>{step.who}</p>
            </div>
            <dl>
              <div>
                <dt>Used</dt>
                <dd>{step.used}</dd>
              </div>
              <div>
                <dt>Decided or produced</dt>
                <dd>{step.decided}</dd>
              </div>
              <div>
                <dt>Left open</dt>
                <dd>{step.open}</dd>
              </div>
              <div>
                <dt>How it was produced</dt>
                <dd>{step.how}</dd>
              </div>
            </dl>
          </div>
          <StageBar
            label="Exported with every project"
            value="project-manifest.json states what was simulated"
          >
            <Link to="/how-it-works" hash="sample-documents" className="hp-link">
              Open the sample documents <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </StageBar>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 04 Control
// ---------------------------------------------------------------------------
const RUNGS = [
  { label: "Read", icon: Eye },
  { label: "Draft", icon: FilePenLine },
  { label: "Propose", icon: Lightbulb },
  { label: "Act externally", icon: Lock, locked: true },
];

function ControlSection() {
  return (
    <section className="hp-section" id="hp-control">
      <div className="dxl-wrap">
        <Heading
          n="04"
          eyebrow="Your control"
          title="Agents draft. You decide what becomes action."
        >
          <p>
            Plans need your approval. Anything external needs your sign-off. Ceilings stop spend.
          </p>
        </Heading>
        <div className="hp-split">
          <div className="ix hp-stage hp-stage-compact">
            <ControlIllustration rungs={RUNGS} usage={0.62} />
          </div>
          <ul className="hp-points">
            <li>
              <strong>Plans before work</strong>
              <span>
                You see the tasks, the team and the estimated usage, then approve or change them.
              </span>
            </li>
            <li>
              <strong>A ladder, not a switch</strong>
              <span>
                Agents can read, draft and propose. Acting outside DeliverX always waits for you.
              </span>
            </li>
            <li>
              <strong>Ceilings that stop</strong>
              <span>
                When a mission reaches its ceiling, further billable steps halt. Nothing runs on
                credit.
              </span>
            </li>
            <li>
              <strong>Gates only people pass</strong>
              <span>
                Agents can stop at a lifecycle gate. They can never pass one on your behalf.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 05 Workspace — the product as it is today, in words (no mock screenshots)
// ---------------------------------------------------------------------------

const WORKSPACE_TAGS: Array<{ icon: LucideIcon; label: string }> = [
  { icon: Target, label: "Projects" },
  { icon: MessageSquareText, label: "Project room" },
  { icon: CheckCheck, label: "Workroom" },
  { icon: ScanSearch, label: "Meeting notes" },
];

/** An illustration of the signed-in workspace, drawn with sample data and labelled as such. */
function WorkspaceSample() {
  const projects = [
    {
      i: "FW",
      name: "Food waste log",
      next: "Make your decision",
      pill: "Needs you",
      tone: "w",
      pct: 40,
    },
    {
      i: "DW",
      name: "Dog walker booking",
      next: "Research is running",
      pill: "Researching",
      tone: "a",
      pct: 22,
    },
    {
      i: "TS",
      name: "Campus textbook swap",
      next: "Prototype in progress",
      pill: "In delivery",
      tone: "o",
      pct: 68,
    },
  ];
  return (
    <figure
      className="hp-frame"
      aria-label="Illustration of the projects workspace with sample data"
    >
      <div className="hp-frame-bar" aria-hidden="true">
        <span />
        <span />
        <span />
        <em>deliverx.dev/command</em>
      </div>
      <div className="hp-frame-body">
        <div className="hp-frame-hero">
          <small>Needs you now</small>
          <strong>Food waste log</strong>
          <ul>
            <li>12 evidence items, 3 gaps listed</li>
            <li>3 options with trade-offs</li>
          </ul>
          <span className="hp-frame-btn">Make your decision</span>
        </div>
        <div className="hp-frame-cards">
          {projects.map((p) => (
            <div key={p.i} className="hp-frame-card">
              <div>
                <b className="hp-frame-ico">{p.i}</b>
                <span className={`hp-frame-pill is-${p.tone}`}>{p.pill}</span>
              </div>
              <strong>{p.name}</strong>
              <span>{p.next}</span>
              <i style={{ width: `${p.pct}%` }} />
            </div>
          ))}
        </div>
      </div>
      <figcaption>Sample project · illustration</figcaption>
    </figure>
  );
}

function WorkspaceSection() {
  return (
    <section className="hp-section" id="hp-workspace">
      <div className="dxl-wrap">
        <Heading n="05" eyebrow="Your workspace" title="One place to build, decide and review.">
          <p>
            {WORKFORCE_AVAILABLE_IDS.length} of {WORKFORCE_TOTAL} roles run today. Each project gets
            only the ones it needs.
          </p>
        </Heading>
        <WorkspaceSample />
        <ul className="hp-workspace-tags">
          {WORKSPACE_TAGS.map((w) => (
            <li key={w.label}>
              <w.icon size={16} aria-hidden="true" />
              {w.label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Every project stands on
// ---------------------------------------------------------------------------
const FOUNDATION: Array<{ title: string; line: string; join?: string }> = [
  {
    title: "You decide",
    line: "Plans, gates and high-impact decisions wait for you",
    join: "Approved plans only",
  },
  { title: "Specialist roles", line: "Each drafts its part of the work", join: "Checked handoffs" },
  { title: "Gates", line: "Only a person can pass one", join: "Every step saved" },
  { title: "The saved record", line: "Who did what, when, and how it was made" },
];

function FoundationSection() {
  return (
    <section className="hp-foundation" aria-labelledby="hp-foundation-title">
      <div className="dxl-wrap">
        <p className="dxl-eyebrow">How every project runs</p>
        <h2 id="hp-foundation-title">
          Four layers. <em>One rule: you decide.</em>
        </h2>
        <ol className="hp-layers">
          {FOUNDATION.map((f, i) => (
            <li key={f.title}>
              <div className="hp-layer">
                <span>{String(FOUNDATION.length - i).padStart(2, "0")}</span>
                <strong>{f.title}</strong>
                <em>{f.line}</em>
              </div>
              {f.join ? <div className="hp-join">{f.join}</div> : null}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 06 Learning
// ---------------------------------------------------------------------------
function LearningSection() {
  return (
    <section className="hp-section" id="hp-learning">
      <div className="dxl-wrap">
        <Heading
          n="06"
          eyebrow="Learn by building"
          title="Learn product craft beside the specialists."
        >
          <p>Build your own product beside the agents. The record becomes the lesson.</p>
        </Heading>
        <div className="hp-split hp-split-reverse">
          <ul className="hp-points">
            <li>
              <strong>Real decisions, real stakes</strong>
              <span>Practise on your own product idea, not a canned exercise.</span>
            </li>
            <li>
              <strong>Explain as we go</strong>
              <span>
                Switch it on and every step says why it matters, with a short lesson behind it.
              </span>
            </li>
            <li>
              <strong>Keep your work</strong>
              <span>
                Your contributions stay in the build record of the product you helped make.
              </span>
            </li>
            <li>
              <Link to="/learn" className="hp-link">
                Read the eight lessons <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </li>
          </ul>
          <div className="ix hp-stage hp-stage-compact">
            <LearningIllustration />
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Close: start with one sentence
// ---------------------------------------------------------------------------
function PromptSection() {
  const navigate = useNavigate();
  const [idea, setIdea] = useState("");
  const start = (event: React.FormEvent) => {
    event.preventDefault();
    const text = idea.trim();
    // keep anything already written in the brief builder; only the question changes
    if (text) savePilotBrief({ ...EMPTY_BRIEF, ...loadPilotBrief(), problem: text.slice(0, 1000) });
    // Auth wall is expected; after login/onboarding continue into the supervised one-liner path.
    void navigate({
      to: "/onboarding",
      search: { redirect: "/command#supervised-brief" },
    });
  };
  return (
    <section className="hp-close">
      <div className="dxl-wrap">
        <p className="dxl-eyebrow">Start with your product</p>
        <h2>Describe it in one sentence.</h2>
        <p>
          We turn it into a scoped mission, show you the team and the plan, and wait for your
          approval before anything runs.
        </p>
        <form className="hp-prompt" onSubmit={start}>
          <label htmlFor="hp-idea" className="sr-only">
            Your product idea
          </label>
          <input
            id="hp-idea"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            maxLength={1000}
            placeholder="e.g. A booking app that helps small clinics fill cancelled slots"
          />
          <button type="submit">
            Start building <Send size={15} aria-hidden="true" />
          </button>
        </form>
        <p className="hp-close-note">
          Creating an account does not start a paid pilot. Scope and billing are agreed before work
          starts. <Link to="/pricing">Compare pilots</Link>
        </p>
      </div>
    </section>
  );
}
