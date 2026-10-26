import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  CheckCheck,
  FileText,
  Gavel,
  ListChecks,
  Loader2,
  MessageSquareText,
  Pause,
  Play,
  Rocket,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  SAMPLE_MISSION_INTENT,
  SAMPLE_MISSION_PLAN,
  SAMPLE_MISSION_QUESTIONS,
  SAMPLE_MISSION_REQUEST,
} from "@/lib/marketing/sample-mission";
import {
  INTENT_LABELS,
  PERMISSION_LABELS,
  STATUS_LABELS,
  type MissionStatus,
} from "@/lib/workforce/types";

/** Sample workspace ceiling for the walkthrough; real ceilings are set per workspace. */
const CEILING = 100;
const STEP_MS = 6200;

const STEPS: Array<{
  id: string;
  label: string;
  icon: LucideIcon;
  status: MissionStatus;
  title: string;
  body: string;
}> = [
  {
    id: "describe",
    label: "Describe",
    icon: MessageSquareText,
    status: "draft",
    title: "Say what you need in a sentence.",
    body: "Pick a mission type and describe the outcome. No forms, no setup of agents.",
  },
  {
    id: "clarify",
    label: "Clarify",
    icon: Sparkles,
    status: "needs_clarification",
    title: "It asks before it guesses.",
    body: "When the request is missing something a plan depends on, you get a short question instead of a wrong plan.",
  },
  {
    id: "plan",
    label: "Plan",
    icon: ListChecks,
    status: "planned",
    title: "See the plan, the team and the cost.",
    body: "Tasks, who does each one, how it will be checked and the usage estimate, before anything runs.",
  },
  {
    id: "approve",
    label: "Approve",
    icon: Gavel,
    status: "awaiting_approval",
    title: "Nothing runs until you approve.",
    body: "Approve, change or cancel. Anything outside DeliverX would need a separate, explicit approval.",
  },
  {
    id: "run",
    label: "Run",
    icon: Loader2,
    status: "running",
    title: "Watch the work move.",
    body: "Each task starts only when the one before it has passed its checks. Problems stop the line instead of spreading.",
  },
  {
    id: "deliver",
    label: "Deliver",
    icon: Rocket,
    status: "completed",
    title: "Get results you can inspect.",
    body: "Every artefact says how it was produced and how it was checked, and the build record keeps the whole path.",
  },
];

const RAIL: MissionStatus[] = [
  "draft",
  "needs_clarification",
  "planned",
  "awaiting_approval",
  "running",
  "completed",
];

export function MissionWalkthroughLive() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [tick, setTick] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useRef(true);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !reduced.current) setPlaying(true);
        if (!entry?.isIntersecting) setPlaying(false);
      },
      { threshold: 0.35 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  // A fine-grained clock animates each step while playing; paused or
  // chosen by hand, the step shows its finished state.
  useEffect(() => {
    if (reduced.current || !playing) {
      setTick(99);
      return;
    }
    setTick(0);
    const id = window.setInterval(() => setTick((t) => t + 1), 120);
    return () => window.clearInterval(id);
  }, [step, playing]);

  useEffect(() => {
    if (!playing) return;
    const id = window.setTimeout(() => setStep((s) => (s + 1) % STEPS.length), STEP_MS);
    return () => window.clearTimeout(id);
  }, [playing, step]);

  const choose = (i: number) => {
    setStep(i);
    setPlaying(false);
  };
  const current = STEPS[step]!;
  const shown = Math.min(tick, 99);

  return (
    <div className="mw" ref={ref}>
      <ol className="mw-steps" aria-label="Mission steps">
        {STEPS.map((s, i) => (
          <li key={s.id}>
            <button
              type="button"
              aria-current={i === step ? "step" : undefined}
              data-done={i < step || undefined}
              onClick={() => choose(i)}
            >
              <span className="mw-step-n">{i < step ? <Check size={13} /> : i + 1}</span>
              <span>
                <strong>{s.label}</strong>
                <small>{i === step ? s.title : STATUS_LABELS[s.status]}</small>
              </span>
              {i === step && playing && (
                <i className="mw-step-timer" style={{ animationDuration: `${STEP_MS}ms` }} />
              )}
            </button>
          </li>
        ))}
        <li className="mw-steps-play">
          <button type="button" onClick={() => setPlaying((p) => !p)}>
            {playing ? <Pause size={14} /> : <Play size={14} />}{" "}
            {playing ? "Pause" : "Play the mission"}
          </button>
        </li>
      </ol>

      <p className="sr-only" aria-live="polite">
        Step {step + 1} of {STEPS.length}: {current.label}. {current.title}
      </p>
      <div className="mw-window">
        <div className="mw-chrome">
          <span className="mw-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="mw-chrome-title">Command Centre · Setup drop-off investigation</span>
          <span className="mw-status" data-status={current.status}>
            {STATUS_LABELS[current.status]}
          </span>
        </div>
        <div className="mw-rail" aria-label="Mission status">
          {RAIL.map((r) => {
            const at = RAIL.indexOf(current.status);
            const i = RAIL.indexOf(r);
            return (
              <span key={r} data-state={i < at ? "done" : i === at ? "now" : undefined}>
                {STATUS_LABELS[r]}
              </span>
            );
          })}
        </div>
        <div className="mw-screen" key={current.id}>
          <header className="mw-screen-head">
            <h3>{current.title}</h3>
            <p>{current.body}</p>
          </header>
          {current.id === "describe" && <Describe tick={shown} />}
          {current.id === "clarify" && <Clarify tick={shown} />}
          {current.id === "plan" && <PlanView tick={shown} />}
          {current.id === "approve" && <Approve tick={shown} />}
          {current.id === "run" && <Run tick={shown} />}
          {current.id === "deliver" && <Deliver tick={shown} />}
        </div>
      </div>
    </div>
  );
}

function Describe({ tick }: { tick: number }) {
  const text = SAMPLE_MISSION_REQUEST.slice(
    0,
    Math.round((tick / 26) * SAMPLE_MISSION_REQUEST.length),
  );
  return (
    <div className="mw-describe">
      <div className="mw-intents">
        {(["investigate", "prototype", "improve", "build"] as const).map((i) => (
          <span key={i} data-on={i === SAMPLE_MISSION_INTENT || undefined}>
            {INTENT_LABELS[i]}
          </span>
        ))}
      </div>
      <div className="mw-input">
        {text}
        {text.length < SAMPLE_MISSION_REQUEST.length && <i className="mw-caret" />}
      </div>
      <div className="mw-row-end">
        <span className="mw-btn" data-pulse={tick > 30 || undefined}>
          Plan this mission <ArrowRight size={14} />
        </span>
      </div>
    </div>
  );
}

function Clarify({ tick }: { tick: number }) {
  return (
    <div className="mw-chat">
      {SAMPLE_MISSION_QUESTIONS.map((q, i) => (
        <div key={q.id} className="mw-chat-pair">
          {tick > 4 + i * 18 && (
            <div className="mw-bubble mw-bubble-ask">
              <small>Planner · needs one detail</small>
              {q.prompt}
            </div>
          )}
          {tick > 12 + i * 18 && <div className="mw-bubble mw-bubble-you">{q.answer}</div>}
        </div>
      ))}
    </div>
  );
}

function PlanView({ tick }: { tick: number }) {
  const P = SAMPLE_MISSION_PLAN;
  return (
    <div className="mw-plan">
      <ol>
        {P.tasks.map((t, i) => (
          <li key={t.key} data-in={tick > 2 + i * 5 || undefined}>
            <div className="mw-task-head">
              <span className="mw-task-n">{i + 1}</span>
              <strong>{t.title}</strong>
              <span className="mw-usage">{t.usage} credits</span>
            </div>
            <p>{t.acceptance}</p>
            <div className="mw-team">
              {t.team.map((m) => (
                <span key={m.id}>
                  <b>{m.id}</b> {m.name}
                </span>
              ))}
            </div>
          </li>
        ))}
      </ol>
      <aside className="mw-plan-side">
        <div>
          <small>Estimated usage</small>
          <strong>
            {P.estimatedUsage} of {CEILING} credits
          </strong>
          <div className="mw-meter">
            <i style={{ width: `${(P.estimatedUsage / CEILING) * 100}%` }} />
          </div>
        </div>
        <div>
          <small>Permission needed</small>
          <strong>{PERMISSION_LABELS[P.requiredPermission]}</strong>
        </div>
        <div>
          <small>Team</small>
          <strong>{P.capabilityIds.length} available specialists</strong>
        </div>
      </aside>
    </div>
  );
}

function Approve({ tick }: { tick: number }) {
  const approved = tick > 22;
  return (
    <div className="mw-approve">
      <div className="mw-approve-card" data-approved={approved || undefined}>
        <div>
          <small>Plan · 4 tasks · {SAMPLE_MISSION_PLAN.estimatedUsage} credits</small>
          <strong>
            {approved ? "Approved by you. Queued to run." : "Waiting for your decision"}
          </strong>
          <p>No step in this plan acts outside DeliverX, so no external approval is needed.</p>
        </div>
        <div className="mw-approve-actions">
          <span className="mw-btn mw-btn-ghost">Change plan</span>
          <span
            className="mw-btn"
            data-pulse={!approved || undefined}
            data-done={approved || undefined}
          >
            {approved ? <Check size={14} /> : null} {approved ? "Approved" : "Approve plan"}
          </span>
        </div>
      </div>
      <ul className="mw-rules">
        <li>Agents can stop at a gate. They can never pass one for you.</li>
        <li>If usage reaches the ceiling, billable steps stop.</li>
      </ul>
    </div>
  );
}

function Run({ tick }: { tick: number }) {
  const tasks = SAMPLE_MISSION_PLAN.tasks;
  const per = 11;
  const progress = Math.min(tasks.length, tick / per);
  const log = [
    "Scope statement written. Handoff check passed.",
    "Facts and assumptions tagged in the evidence table. Handoff check passed.",
    "Brief drafted with options, risks and open questions. Handoff check passed.",
    "Second agent pass: labels consistent, no contradictions left.",
  ];
  return (
    <div className="mw-run">
      <ol className="mw-chain">
        {tasks.map((t, i) => {
          const state = progress >= i + 1 ? "done" : progress > i ? "running" : "queued";
          return (
            <li key={t.key} data-state={state}>
              <span className="mw-node">
                {state === "done" ? (
                  <Check size={14} />
                ) : state === "running" ? (
                  <Loader2 size={14} />
                ) : (
                  i + 1
                )}
              </span>
              <div>
                <strong>{t.title}</strong>
                <small>
                  {state === "done"
                    ? "Passed its checks"
                    : state === "running"
                      ? "Running"
                      : "Waiting for the step before"}
                </small>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="mw-log" aria-label="Activity">
        {log.slice(0, Math.floor(progress)).map((line, i) => (
          <p key={i}>
            <CheckCheck size={13} aria-hidden="true" /> {line}
          </p>
        ))}
        {progress < tasks.length && (
          <p className="mw-log-live">
            <Loader2 size={13} aria-hidden="true" /> {tasks[Math.floor(progress)]!.title}…
          </p>
        )}
      </div>
    </div>
  );
}

function Deliver({ tick }: { tick: number }) {
  const items = [
    {
      name: "Investigation brief",
      label: "Agent-reviewed",
      how: "Simulated draft, labelled as such",
    },
    {
      name: "Evidence table",
      label: "Agent-reviewed",
      how: "Every claim tagged fact or assumption",
    },
    { name: "Delivery report", label: "Agent-reviewed", how: "Usage, checks and open questions" },
  ];
  return (
    <div className="mw-deliver">
      <ul>
        {items.map((it, i) => (
          <li key={it.name} data-in={tick > 2 + i * 4 || undefined}>
            <FileText size={18} aria-hidden="true" />
            <div>
              <strong>{it.name}</strong>
              <small>{it.how}</small>
            </div>
            <span className="mw-label">{it.label}</span>
          </li>
        ))}
      </ul>
      <div className="mw-deliver-foot" data-in={tick > 16 || undefined}>
        <div>
          <small>Next</small>
          <strong>Add what you observe after acting on it.</strong>
        </div>
        <Link to="/" hash="hp-record" className="mw-link">
          See the build record <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
