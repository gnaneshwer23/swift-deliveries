import { ArrowLeft } from "lucide-react";
import { SupervisedMissionStart } from "@/components/command/supervised-mission-start";
import { StudioReadiness } from "@/components/command/studio-readiness";

/**
 * New project — the idea form. Starts a supervised case via the clarifying step;
 * nothing runs until the owner approves the plan.
 */
export function StudioIdeaDashboard({
  allowanceLine,
  onBack,
  onContinueToClarifying,
}: {
  allowanceLine: string | null;
  /** Back to the projects dashboard (absent for a first project). */
  onBack?: () => void;
  onContinueToClarifying: () => void;
}) {
  return (
    <div className="sd-shell sd-shell-submission" data-studio-screen="idea-submission">
      <div className="sd-topbar">
        {onBack ? (
          <button type="button" className="sd-back" onClick={onBack}>
            <ArrowLeft size={16} aria-hidden="true" />
            Projects
          </button>
        ) : (
          <p className="sd-brand">New project</p>
        )}
        {allowanceLine ? (
          <p className="sd-note" style={{ margin: 0 }} role="status">
            {allowanceLine}
          </p>
        ) : null}
      </div>

      <section className="sd-card sd-submission-card" aria-labelledby="sd-submission-title">
        <SupervisedMissionStart tone="submission" onContinueToClarifying={onContinueToClarifying} />
      </section>

      <footer className="ps-foyer-footnotes">
        <details>
          <summary>Inspect · readiness</summary>
          <StudioReadiness />
        </details>
      </footer>
    </div>
  );
}
