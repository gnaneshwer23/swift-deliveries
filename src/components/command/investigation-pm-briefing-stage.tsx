import { useState } from "react";
import { ListenBriefButton } from "@/components/command/listen-brief-button";
import { buildPmBrief } from "@/lib/pilot-mission/pm-brief";
import { buildPmBriefingPack } from "@/lib/pilot-mission/pm-briefing-pack";
import type { SupervisedMission } from "@/lib/pilot-mission/types";

type BriefingTab = "recommendation" | "swot" | "alternatives" | "evidence" | "next";

const TAB_LABELS: Record<BriefingTab, string> = {
  recommendation: "Recommendation",
  swot: "SWOT",
  alternatives: "Alternatives",
  evidence: "Evidence",
  next: "Next",
};

const SWOT_LABEL = {
  strength: "Strength",
  weakness: "Weakness",
  opportunity: "Opportunity",
  threat: "Threat",
} as const;

/** Screen 4 — AI PM briefing presenter; listen only when browser speech is available. */
export function InvestigationPmBriefingStage({ mission }: { mission: SupervisedMission }) {
  const pack = buildPmBriefingPack(mission);
  const brief = buildPmBrief(mission);
  const [tab, setTab] = useState<BriefingTab>("recommendation");

  if (!pack.ready) {
    return (
      <section
        className="ps-pm-briefing-stage ps-pm-briefing-stage-pending"
        aria-label="PM briefing"
      >
        <p className="cc-kicker">AI product manager</p>
        <h2 className="ps-pm-briefing-title">Briefing not ready</h2>
        <p className="cc-muted text-sm">
          The briefing opens when options or a decision are on the mission record — not before
          investigation work completes.
        </p>
      </section>
    );
  }

  return (
    <section className="ps-pm-briefing-stage" aria-label="AI PM briefing">
      <header className="ps-pm-briefing-stage-head">
        <p className="cc-kicker">AI product manager · draft presenter</p>
        <h2 className="ps-pm-briefing-title">Decision briefing</h2>
        <p className="cc-muted text-sm">{pack.roleDisclosure}</p>
        <p className="cc-muted text-xs">{pack.honesty}</p>
        <ListenBriefButton brief={brief} />
      </header>

      <div className="ps-pm-briefing-tabs" role="tablist" aria-label="Briefing sections">
        {(Object.keys(TAB_LABELS) as BriefingTab[]).map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className="ps-pm-briefing-tab"
            onClick={() => setTab(id)}
          >
            {TAB_LABELS[id]}
          </button>
        ))}
      </div>

      <div className="ps-pm-briefing-tab-panel" role="tabpanel">
        {tab === "recommendation" ? (
          <>
            <h3 className="ps-pm-briefing-h">Recommendation</h3>
            {pack.recommendationLabel ? (
              <p className="text-sm">
                <strong>{pack.recommendationLabel}</strong>
              </p>
            ) : (
              <p className="cc-muted text-sm">Pending.</p>
            )}
            <p className="cc-muted text-sm">{pack.recommendationRationale}</p>
            <h4 className="ps-pm-briefing-h">What could change it</h4>
            <ul className="text-sm cc-muted">
              {pack.unknowns.length ? (
                pack.unknowns.slice(0, 5).map((line) => <li key={line.slice(0, 48)}>{line}</li>)
              ) : (
                <li>No unknowns labelled yet — add evidence or gaps under Inspect.</li>
              )}
            </ul>
          </>
        ) : null}

        {tab === "swot" ? (
          <ul className="ps-pm-swot-list">
            {pack.swot.length ? (
              pack.swot.map((item) => (
                <li key={`${item.kind}-${item.statement.slice(0, 32)}`}>
                  <span className="cc-chip">{SWOT_LABEL[item.kind]}</span>
                  <p className="text-sm mb-0">{item.statement}</p>
                  <p className="cc-muted text-xs">Implication: {item.implication}</p>
                  <p className="cc-muted text-xs">Next question: {item.nextQuestion}</p>
                </li>
              ))
            ) : (
              <li className="cc-muted text-sm">
                SWOT items appear when the register supports them.
              </li>
            )}
          </ul>
        ) : null}

        {tab === "alternatives" ? (
          <ul className="text-sm cc-muted">
            {pack.alternatives.length ? (
              pack.alternatives.map((line) => <li key={line.slice(0, 48)}>{line}</li>)
            ) : (
              <li>No alternatives on the record yet.</li>
            )}
          </ul>
        ) : null}

        {tab === "evidence" ? (
          <>
            <h3 className="ps-pm-briefing-h">Supporting</h3>
            <ul className="text-sm cc-muted">
              {pack.supporting.map((line) => (
                <li key={line.slice(0, 48)}>{line}</li>
              ))}
            </ul>
            <h3 className="ps-pm-briefing-h">Counterevidence & gaps</h3>
            <ul className="text-sm cc-muted">
              {pack.counterevidence.length ? (
                pack.counterevidence.map((line) => <li key={line.slice(0, 48)}>{line}</li>)
              ) : (
                <li>None labelled yet.</li>
              )}
            </ul>
          </>
        ) : null}

        {tab === "next" ? (
          <>
            <h3 className="ps-pm-briefing-h">Smallest next step</h3>
            <p className="text-sm">{pack.smallestNextStep}</p>
            <p className="ps-pm-briefing-actions mt-3">
              <a className="cc-btn cc-btn-secondary" href="#mission-inspect">
                Inspect full record
              </a>
              <a className="cc-btn cc-btn-primary" href="#mission-next-action">
                Choose path
              </a>
            </p>
          </>
        ) : null}
      </div>
    </section>
  );
}
