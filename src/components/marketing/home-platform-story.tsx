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
import { savePilotBrief } from "@/lib/pilot/storage";

const CHAPTERS = [
  { id: "hp-workforce", label: "Specialists" },
  { id: "hp-decisions", label: "Decisions" },
  { id: "hp-record", label: "Build record" },
  { id: "hp-control", label: "Your control" },
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
            The catalogue spans {WORKFORCE_DEPARTMENTS.length} departments, from research and design
            to security and growth. For each mission DeliverX assembles a small team and shows you
            who is on it before anything runs.
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
  const veto = R.vetoes[0]!;
  return (
    <section className="hp-section" id="hp-decisions">
      <div className="dxl-wrap">
        <Heading n="02" eyebrow="Decisions" title="Agents disagree on purpose. You see why.">
          <p>
            Each specialist scores the options through its own lens before seeing anyone else’s
            view. Security, QA and Finance hold hard vetoes. An option needs{" "}
            {Math.round(R.supermajority * 100)}% of expertise-weighted support, and high-impact
            calls still come to you.
          </p>
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
                      <Lock size={13} aria-hidden="true" /> Vetoed by {veto.role}: {veto.reason}
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
                ? `${chosen.label} reached ${Math.round(R.tally[0]!.share * 100)}% — waiting for your ratification`
                : "Positions taken independently, before anyone sees the others"
            }
          >
            <p>
              {round === 2
                ? `Two panellists changed their vote after critique; UX Research kept its dissent, and it stays on the record. Sample decision: the real tally rules running on template scores, not customer data.`
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
    who: "Nine specialists, then you",
    used: "The evidence register and three options.",
    decided: "Shorter sign-up, 84% weighted support. Import existing work vetoed by Security.",
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
          <p>
            Every product carries its own record: the prompt, the evidence used, the options
            weighed, who decided, what was built, how it was checked and what happened next. Replay
            it to learn from it, audit it, or start the next product from it.
          </p>
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
            Every mission runs on a permission ladder and inside a usage ceiling. Plans need your
            approval, anything external needs your explicit sign-off, and the ceiling stops further
            billable steps the moment it is reached.
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
// 05 Learning
// ---------------------------------------------------------------------------
function LearningSection() {
  return (
    <section className="hp-section" id="hp-learning">
      <div className="dxl-wrap">
        <Heading
          n="05"
          eyebrow="Learn by building"
          title="Learn product craft beside the specialists."
        >
          <p>
            Students and new builders work in the same environment as the agents: frame the
            question, challenge a recommendation, approve a gate. Each contribution is recorded with
            what it changed, so the record becomes the lesson.
          </p>
        </Heading>
        <div className="hp-split hp-split-reverse">
          <ul className="hp-points">
            <li>
              <strong>Real decisions, real stakes</strong>
              <span>Practise on your own product idea, not a canned exercise.</span>
            </li>
            <li>
              <strong>See the reasoning</strong>
              <span>Read why each specialist voted the way it did, including the dissent.</span>
            </li>
            <li>
              <strong>Keep your work</strong>
              <span>
                Your contributions stay in the build record of the product you helped make.
              </span>
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
    if (text) savePilotBrief({ ...EMPTY_BRIEF, problem: text.slice(0, 1000) });
    void navigate({ to: "/onboarding" });
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
