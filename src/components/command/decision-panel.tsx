/**
 * Your decision — Aria's recommendation, the directions, and what happens next.
 * Saves through the existing version-bound decideSupervisedMission; nothing proceeds until saved.
 */
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { AgentAvatar } from "@/components/command/agent-avatar";
import { decideSupervisedMission } from "@/lib/pilot-mission.functions";
import type { DecisionChoice, SupervisedMission } from "@/lib/pilot-mission/types";
import {
  AGENT_RECOMMENDATION_LABELS,
  deriveAgentRecommendation,
  type AgentRecommendation,
  type HumanNextPath,
} from "@/lib/pilot-mission/verdict";

const PATHS: Array<{ id: HumanNextPath; title: string; detail: string }> = [
  {
    id: "authorise_bounded_test",
    title: "Build it",
    detail: "Approve this direction; the team can start delivery.",
  },
  {
    id: "authorise_gather_evidence",
    title: "Research more first",
    detail: "Close the open questions before committing.",
  },
  {
    id: "authorise_revise",
    title: "Change it",
    detail: "Rethink the users, the problem or the first version.",
  },
  { id: "close_case", title: "Stop here", detail: "Keep what we found and close this idea." },
];

const SUGGESTED: Record<AgentRecommendation, HumanNextPath> = {
  proceed_bounded_test: "authorise_bounded_test",
  revise_proposition: "authorise_revise",
  pause_pending_evidence: "authorise_gather_evidence",
  do_not_pursue: "close_case",
};

/** "[Cited · tavily] Title: snippet" → "Title". */
function sourceTitle(statement: string): string {
  const t = statement.replace(/^\[[^\]]*\]\s*/, "");
  const cut = t.split(/:\s|\s[—|]\s/)[0] ?? t;
  return cut.length > 80 ? `${cut.slice(0, 79)}…` : cut;
}

function firstSentence(text: string): string {
  const m = text.match(/^.*?[.!?](\s|$)/);
  return (m ? m[0] : text).trim();
}

export function DecisionPanel({
  mission,
  missionId,
  onDone,
  onError,
}: {
  mission: SupervisedMission;
  missionId: string;
  onDone: () => Promise<void>;
  onError: (error: unknown) => void;
}) {
  const proposal = mission.proposal;
  const draft = deriveAgentRecommendation(mission);
  const suggested = SUGGESTED[draft.recommendation];
  const [optionId, setOptionId] = useState(
    proposal?.options.length === 1 ? proposal.options[0]!.id : "",
  );
  const [choice, setChoice] = useState<HumanNextPath | null>(null);
  const [note, setNote] = useState("");
  const decide = useMutation({
    mutationFn: () =>
      decideSupervisedMission({
        data: {
          id: missionId,
          expectedVersion: mission.version,
          action: proposal!.action,
          version: proposal!.version,
          scopeHash: proposal!.scopeHash,
          optionId,
          choice: choice as DecisionChoice,
          note,
        },
      }),
    onSuccess: onDone,
    onError,
  });

  if (!proposal) {
    return <p className="plan-hint">The team hasn’t drafted directions yet.</p>;
  }
  const sources = mission.evidence
    .filter((e) => e.classification === "supplied" && /^https?:\/\//i.test(e.source))
    .slice(0, 5);

  return (
    <form
      className="plan"
      onSubmit={(e) => {
        e.preventDefault();
        decide.mutate();
      }}
    >
      <div className="plan-aria">
        <AgentAvatar name="Aria" role="Product Manager" size={40} />
        <p>
          My recommendation: <b>{AGENT_RECOMMENDATION_LABELS[draft.recommendation]}</b>.{" "}
          {firstSentence(draft.rationale)}
        </p>
      </div>

      <fieldset className="dec-group">
        <legend className="room-mono">Which direction?</legend>
        {proposal.options.map((o) => (
          <label
            key={o.id}
            className="dec-card"
            data-selected={optionId === o.id ? "true" : undefined}
          >
            <input
              type="radio"
              name="dec-option"
              checked={optionId === o.id}
              onChange={() => setOptionId(o.id)}
            />
            <span>
              <b>{o.title}</b>
              <small>
                {o.tradeoff.replace(/\s*\(basis:?\s[^)]*\)/gi, "") || "No trade-offs recorded."}
              </small>
            </span>
          </label>
        ))}
      </fieldset>

      <fieldset className="dec-group">
        <legend className="room-mono">What happens next?</legend>
        <div className="dec-paths">
          {PATHS.map((p) => (
            <label
              key={p.id}
              className="dec-card"
              data-selected={choice === p.id ? "true" : undefined}
            >
              <input
                type="radio"
                name="dec-path"
                checked={choice === p.id}
                onChange={() => setChoice(p.id)}
              />
              <span>
                <b>
                  {p.title}
                  {p.id === suggested ? <em className="dec-suggest">Aria suggests</em> : null}
                </b>
                <small>{p.detail}</small>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="room-gate-note">
        Anything the team should know? (optional)
        <textarea
          rows={2}
          maxLength={2000}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="A reason, a change, or a question — saved with your decision."
        />
      </label>

      {sources.length ? (
        <details className="dec-sources">
          <summary>What this is based on ({sources.length} sources)</summary>
          <ul>
            {sources.map((s) => (
              <li key={s.id}>
                <a href={s.source} target="_blank" rel="noreferrer noopener">
                  {sourceTitle(s.statement)}
                </a>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <div className="plan-actions">
        <button
          type="submit"
          className="room-pill room-pill-primary"
          disabled={decide.isPending || !optionId || !choice}
        >
          {decide.isPending ? "Saving…" : "Save my decision"}
        </button>
        <p className="plan-hint">
          {!optionId || !choice
            ? "Pick a direction and what happens next."
            : "Nothing proceeds until you save. Disagreeing with Aria is fine — both are kept."}
        </p>
      </div>
    </form>
  );
}
