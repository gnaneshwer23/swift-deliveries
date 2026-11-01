/**
 * The personal parts of the dashboard: the greeting with your onboarding goal, the
 * "Explain as we go" switch, and "Your first project" ticked from the record.
 */
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Check } from "lucide-react";
import type { ReactNode } from "react";
import { useExplainMode } from "@/hooks/use-explain-mode";
import { useSession } from "@/hooks/use-session";
import { firstNameOf } from "@/lib/dx-profile";
import {
  buildFirstProject,
  reachedSteps,
  type FirstProjectSource,
} from "@/lib/pilot-mission/first-project";
import { LESSONS, reachedLessons } from "@/lib/learn/lessons";
import { myProfileQuery } from "@/lib/profile-queries";

export function ExplainSwitch() {
  const explain = useExplainMode();
  return (
    <label className="prj-switch">
      <input type="checkbox" checked={explain.on} onChange={(e) => explain.set(e.target.checked)} />
      <span aria-hidden="true" />
      Explain as we go
    </label>
  );
}

/** Greeting, one status line, your goal and the page's actions. */
export function DashboardHello({ status, actions }: { status: string; actions: ReactNode }) {
  const { user } = useSession();
  const profile = useQuery(myProfileQuery);
  const goal = profile.data?.goal;
  return (
    <header className="prj-hello">
      <div>
        <p className="prj-crumb">Workspace / Projects</p>
        <h1>Hi {firstNameOf(user, profile.data)}</h1>
        <p className="prj-hello-status">{status}</p>
        <p className="prj-chips">
          {goal ? (
            <Link to="/onboarding" className="prj-chip" title="Change your goal">
              <span className="prj-chip-dot" aria-hidden="true" />
              Goal: {goal}
            </Link>
          ) : (
            <Link to="/onboarding" className="prj-chip">
              Tell us your goal
            </Link>
          )}
        </p>
      </div>
      <div className="prj-hello-actions">
        <ExplainSwitch />
        {actions}
      </div>
    </header>
  );
}

/** "Your first project": six step chips from the record, the next step and the next lesson. */
export function FirstProjectCard({ projects }: { projects: FirstProjectSource[] }) {
  const explain = useExplainMode();
  const first = buildFirstProject(projects);
  const reached = reachedLessons(reachedSteps(projects));
  const nextLesson = LESSONS.find((l) => !reached.has(l.id)) ?? null;

  return (
    <section className="prj-card prj-first" aria-labelledby="prj-first-title">
      <p className="prj-eyebrow">Your first project</p>
      {first ? (
        <>
          <h2 id="prj-first-title">
            {first.doneCount} of {first.steps.length} steps
          </h2>
          <p className="prj-card-sub" title={first.projectName}>
            {first.projectName}
          </p>
          <ol className="prj-step-chips" aria-label="Project path">
            {first.steps.map((s) => (
              <li
                key={s.id}
                title={s.label}
                data-state={s.done ? "done" : first.next?.id === s.id ? "next" : "todo"}
              >
                {s.done ? <Check size={12} aria-hidden="true" /> : null}
                {s.short}
                <span className="prj-sr">
                  {" "}
                  — {s.label}
                  {s.done ? " (done)" : first.next?.id === s.id ? " (next)" : ""}
                </span>
              </li>
            ))}
          </ol>
          {first.next ? (
            <>
              {explain.on ? <p className="prj-why">{first.next.why}</p> : null}
              <Link
                to="/command/supervised/$missionId"
                params={{ missionId: first.projectId }}
                className="prj-card-link"
              >
                Next: {first.next.label.toLowerCase()} <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </>
          ) : (
            <p className="prj-card-sub">All six steps done. Start another whenever you’re ready.</p>
          )}
        </>
      ) : (
        <>
          <h2 id="prj-first-title">Six steps</h2>
          <p className="prj-card-sub">Idea → plan → decide → build → package → outcome.</p>
        </>
      )}
      <p className="prj-lesson">
        <span>
          Lessons for steps reached: {reached.size} / {LESSONS.length}
        </span>
        {nextLesson ? (
          <Link to="/learn/$lessonId" params={{ lessonId: nextLesson.id }} className="prj-link">
            {nextLesson.title}
          </Link>
        ) : (
          <Link to="/learn" className="prj-link">
            All lessons
          </Link>
        )}
      </p>
    </section>
  );
}
