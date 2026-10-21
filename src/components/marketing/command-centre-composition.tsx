import { INTENT_LABELS } from "@/lib/workforce/types";
import { WAVE1_AVAILABLE_IDS } from "@/lib/workforce/registry";

/**
 * Labelled Command Centre concept view for marketing.
 * Mirrors Stage 1 intake + plan approval chrome — not live session data.
 */
export function CommandCentreComposition() {
  const wave1 = WAVE1_AVAILABLE_IDS.length;

  return (
    <div className="cc-compose" aria-hidden="true">
      <div className="cc-compose-chrome">
        <div className="cc-compose-dots">
          <span />
          <span />
          <span />
        </div>
        <span className="cc-compose-url">deliverx.dev/command</span>
        <span className="cc-compose-usage">Usage 12 / 100 · {wave1} Available</span>
      </div>

      <div className="cc-compose-body">
        <div className="cc-compose-kicker">Command Centre · Stage 1</div>
        <div className="cc-compose-title">Commission a mission</div>

        <div className="cc-compose-intents">
          {(
            [
              { id: "investigate", active: true, hint: "Brief with sourced facts" },
              { id: "prototype", active: false, hint: "Reviewable HTML / UI pack" },
              { id: "improve", active: false, hint: "Diagnose + propose changes" },
            ] as const
          ).map((item) => (
            <div key={item.id} className={`cc-compose-intent${item.active ? " is-active" : ""}`}>
              <strong>{INTENT_LABELS[item.id]}</strong>
              <span>{item.hint}</span>
            </div>
          ))}
        </div>

        <div className="cc-compose-panel">
          <div className="cc-compose-label">Mission request</div>
          <div className="cc-compose-request">
            Investigate whether we should add a sponsor dashboard for healthcare delivery leads —
            separate facts from assumptions.
          </div>
          <div className="cc-compose-plan">
            <div className="cc-compose-plan-row">
              <span>Plan · 5 tasks</span>
              <span>Est. 18 credits</span>
            </div>
            <div className="cc-compose-plan-row">
              <span>DX-011 · DX-012 · DX-020</span>
              <span className="cc-compose-gate">Awaiting your approval</span>
            </div>
          </div>
          <div className="cc-compose-actions">
            <span className="cc-compose-btn primary">Approve plan</span>
            <span className="cc-compose-btn">Revise</span>
          </div>
        </div>
      </div>
    </div>
  );
}
