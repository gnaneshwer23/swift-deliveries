import { useEffect, useState, type ReactNode } from "react";
import { ArrowRight, Check } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { loadPilotBrief, loadPilotPlan } from "@/lib/pilot/storage";
import { PILOT_PLAN_LABELS } from "@/lib/pilot/model";

export function AuthFrame({
  children,
  action,
  recovery = false,
}: {
  children: ReactNode;
  action?: ReactNode;
  recovery?: boolean;
}) {
  const [continuity, setContinuity] = useState("");
  useEffect(() => {
    const brief = loadPilotBrief();
    const plan = loadPilotPlan();
    if (brief?.problem.trim())
      setContinuity(
        `Your prepared brief stays in this browser.${plan ? ` Selected offer: ${PILOT_PLAN_LABELS[plan]}.` : ""} You can review it after signing in.`,
      );
  }, []);
  return (
    <div className="dxs psi-auth auth-entry">
      <header className="auth-entry-header">
        <BrandLogo tagline="Product Super Intelligence" />
        <div>{action}</div>
      </header>
      <main className="auth-entry-layout">
        <aside className="auth-entry-story">
          <p className="dxl-eyebrow">Product Super Intelligence</p>
          <h2>
            {recovery ? (
              <>
                Get back to
                <br />
                your product context.
              </>
            ) : (
              <>
                Your next decision.
                <br />
                With the context intact.
              </>
            )}
          </h2>
          <p>Evidence, specialist contributions and human decisions connected in one workspace.</p>
          <img
            src="/illustrations/connected-record-v1.webp"
            width="1536"
            height="1024"
            alt="A central product record connecting supplied sources, decisions, artefacts and observations."
          />
          <div className="auth-entry-flow">
            <span>Evidence</span>
            <ArrowRight size={14} />
            <span>Judgement</span>
            <ArrowRight size={14} />
            <span>Reviewable work</span>
          </div>
          <small>
            Illustrative product record. Account access does not activate a paid pilot or run a
            mission.
          </small>
        </aside>
        <div className="auth-entry-form">
          <div className="auth-entry-card">
            {continuity && !recovery && (
              <div className="auth-entry-continuity">
                <Check size={16} aria-hidden="true" />
                <p>{continuity}</p>
              </div>
            )}
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
