/**
 * The personal part of the dashboard: your goal from onboarding, "Your first project"
 * ticked from the record, and the "Explain as we go" switch.
 */
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { useExplainMode } from "@/hooks/use-explain-mode";
import { useSession } from "@/hooks/use-session";
import { firstNameOf } from "@/lib/dx-profile";
import { buildFirstProject, type FirstProjectSource } from "@/lib/pilot-mission/first-project";
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

export function FirstRunPanel({ projects }: { projects: FirstProjectSource[] }) {
  const { user } = useSession();
  const profile = useQuery(myProfileQuery);
  const explain = useExplainMode();
  const first = buildFirstProject(projects);
  const goal = profile.data?.goal;
  const allDone = first && !first.next;

  return (
    <section className="prj-panel prj-first" aria-labelledby="prj-first-title">
      <div className="prj-first-head">
        <div>
          <h2 id="prj-first-title">Hi {firstNameOf(user, profile.data)}</h2>
          <p className="prj-muted">
            {goal ? (
              <>
                Your goal: <b>{goal}</b> ·{" "}
                <Link to="/onboarding" className="prj-link">
                  Change
                </Link>
              </>
            ) : (
              <Link to="/onboarding" className="prj-link">
                Tell us your goal
              </Link>
            )}
          </p>
        </div>
        <ExplainSwitch />
      </div>

      {first ? (
        allDone ? (
          <p className="prj-muted">
            All six steps done on “{first.projectName}”. Start another project whenever you’re
            ready.
          </p>
        ) : (
          <>
            <p className="prj-first-sub">
              <span className="room-mono">Your project path</span> “{first.projectName}” ·{" "}
              {first.doneCount} of {first.steps.length} done
            </p>
            <ol className="prj-steps">
              {first.steps.map((s) => (
                <li
                  key={s.id}
                  data-state={s.done ? "done" : first.next?.id === s.id ? "next" : "todo"}
                >
                  <span className="prj-step-dot" aria-hidden="true">
                    {s.done ? <Check size={12} /> : null}
                  </span>
                  <div>
                    <b>{s.label}</b>
                    <span className="prj-sr">{s.done ? " (done)" : ""}</span>
                    {explain.on ? <p>{s.why}</p> : null}
                  </div>
                </li>
              ))}
            </ol>
            {first.next ? (
              <Link
                to="/command/supervised/$missionId"
                params={{ missionId: first.projectId }}
                className="prj-btn prj-btn-primary prj-btn-small"
              >
                Next: {first.next.label.toLowerCase()}
              </Link>
            ) : null}
          </>
        )
      ) : null}
    </section>
  );
}
