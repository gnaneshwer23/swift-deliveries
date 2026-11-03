/**
 * The sample project: a read-only walk through a project using the real project screens and
 * invented content. Built in memory; it has no actions that save anything and calls no
 * project server functions, so it can never touch your real projects.
 */
import { Link } from "@tanstack/react-router";
import { ArrowRight, CircleCheck, CircleDashed, FlaskConical } from "lucide-react";
import { useMemo } from "react";
import { CheckpointCard } from "@/components/command/checkpoint-card";
import { buildActivityFeed, feedTime } from "@/lib/pilot-mission/activity-feed";
import { projectSteps } from "@/lib/pilot-mission/first-project";
import {
  buildSampleProject,
  SAMPLE_NOTICE,
  SAMPLE_OPTIONS,
} from "@/lib/pilot-mission/sample-project";
import { nextRequiredAction } from "@/lib/pilot-mission/types";
import "@/styles/sample-project.css";

const CLASS_LABEL = { supplied: "Sourced", assumption: "Assumption", gap: "Gap" } as const;

export function SampleProjectView() {
  const mission = useMemo(() => buildSampleProject(), []);
  const next = useMemo(() => nextRequiredAction(mission), [mission]);
  const steps = projectSteps({
    id: mission.id,
    question: mission.brief.question,
    stage: mission.stage,
    archived: false,
    updatedAt: mission.updatedAt,
    planApproved: Boolean(mission.team?.approvedAt),
    decisionRecorded: Boolean(mission.approval),
    delivery: Boolean(mission.delivery),
    observationRecorded: Boolean(mission.observation),
  });
  const feed = buildActivityFeed(
    [{ id: mission.id, name: mission.brief.question, activity: mission.activity }],
    8,
  );

  return (
    <div className="sp">
      <p className="sp-notice" role="note">
        <FlaskConical size={16} aria-hidden="true" />
        <span>{SAMPLE_NOTICE}</span>
      </p>

      <header className="sp-head">
        <p className="sp-eyebrow">Sample project</p>
        <h1>{mission.brief.question}</h1>
        <p className="sp-sub">
          This is how a real project looks halfway through: the plan is approved, research is done,
          and the team has compared options. The next step is yours.
        </p>
      </header>

      <CheckpointCard mission={mission} next={next} />

      <div className="sp-grid">
        <section className="sp-card" aria-labelledby="sp-path">
          <h2 id="sp-path">The six steps</h2>
          <ol className="sp-steps">
            {steps.map((s) => (
              <li key={s.id} data-done={s.done ? "true" : undefined}>
                {s.done ? (
                  <CircleCheck size={16} aria-hidden="true" />
                ) : (
                  <CircleDashed size={16} aria-hidden="true" />
                )}
                <div>
                  <b>{s.label}</b>
                  <span>{s.why}</span>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="sp-card" aria-labelledby="sp-evidence">
          <h2 id="sp-evidence">Evidence, kept honest</h2>
          <p className="sp-muted">
            Every line says where it came from. Assumptions and gaps stay visible instead of being
            filled in.
          </p>
          <ul className="sp-evidence">
            {mission.evidence.map((e) => (
              <li key={e.id}>
                <span className="sp-tag" data-kind={e.classification}>
                  {CLASS_LABEL[e.classification]}
                </span>
                <p>{e.statement}</p>
                <span className="sp-muted">{e.source}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="sp-card" aria-labelledby="sp-options">
          <h2 id="sp-options">The decision waiting for you</h2>
          <p className="sp-muted">
            The team compares options and recommends one. You choose; agents never decide for you.
          </p>
          <ul className="sp-options">
            {SAMPLE_OPTIONS.map((o) => (
              <li key={o.id} data-recommended={o.recommended ? "true" : undefined}>
                <b>
                  {o.id}. {o.title}
                </b>
                <span>{o.tradeOff}</span>
                {o.recommended ? <em>Team’s recommendation</em> : null}
              </li>
            ))}
          </ul>
          <p className="sp-muted">In a real project you would record your choice here.</p>
        </section>

        <section className="sp-card" aria-labelledby="sp-feed">
          <h2 id="sp-feed">What the team did</h2>
          <ul className="sp-feed">
            {feed.map((f) => (
              <li key={f.key}>
                <b>{f.who}</b> {f.what}
                <time dateTime={f.at}>{feedTime(f.at)}</time>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <footer className="sp-cta">
        <div>
          <b>Ready to try it on your own idea?</b>
          <span>One or two lines is enough to start. Nothing runs until you approve the plan.</span>
        </div>
        <Link to="/command" className="sp-btn">
          Start your own project <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </footer>
    </div>
  );
}
