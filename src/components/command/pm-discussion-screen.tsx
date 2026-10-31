import { useMutation } from "@tanstack/react-query";
import { useId, useState } from "react";
import { CaseChatPanel } from "@/components/command/case-chat-panel";
import { decideSupervisedMission } from "@/lib/pilot-mission.functions";
import {
  buildPmDiscussionContext,
  pmDiscussionSampleThread,
} from "@/lib/pilot-mission/pm-discussion-screen";
import type { HumanNextPath } from "@/lib/pilot-mission/verdict";
import type { SupervisedMission } from "@/lib/pilot-mission/types";
import "@/styles/pm-discussion-screen.css";

type QuickIntent = "approve" | "research" | "scope";

const INTENT_PATH: Record<QuickIntent, HumanNextPath> = {
  approve: "authorise_bounded_test",
  research: "authorise_gather_evidence",
  scope: "authorise_revise",
};

const INTENT_PROMPT: Record<QuickIntent, string> = {
  approve: "Optional note for approving this direction…",
  research: "What should Aria investigate next?",
  scope: "What scope change do you want?",
};

/**
 * Screen 7 — Discussion with Aria + decision context and quick actions.
 */
export function PmDiscussionScreen({
  mission,
  missionId,
  onDone,
  onError,
  advancedDecisionSlot,
}: {
  mission: SupervisedMission;
  missionId: string;
  onDone: () => Promise<void>;
  onError: (error: unknown) => void;
  /** Optional full decision form kept for advanced path choices. */
  advancedDecisionSlot?: React.ReactNode;
}) {
  const context = buildPmDiscussionContext(mission);
  const sample = pmDiscussionSampleThread();
  const proposal = mission.proposal;
  // No option is preselected: the owner chooses one before a decision is saved.
  const [optionId, setOptionId] = useState("");
  const [intent, setIntent] = useState<QuickIntent | null>(null);
  const [note, setNote] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const statusId = useId();

  const decide = useMutation({
    mutationFn: (path: HumanNextPath) => {
      if (!proposal) throw new Error("No options draft is on this case yet.");
      if (!optionId) throw new Error("Select an option before saving a decision.");
      return decideSupervisedMission({
        data: {
          id: missionId,
          expectedVersion: mission.version,
          action: proposal.action,
          version: proposal.version,
          scopeHash: proposal.scopeHash,
          optionId,
          choice: path,
          note: note.trim(),
        },
      });
    },
    onSuccess: async () => {
      setLocalError(null);
      setIntent(null);
      setNote("");
      await onDone();
    },
    onError: (error) => {
      setLocalError(error instanceof Error ? error.message : "The decision could not be saved.");
      onError(error);
    },
  });

  function startIntent(next: QuickIntent) {
    setLocalError(null);
    setIntent(next);
  }

  function confirmIntent() {
    if (!intent) return;
    if (intent !== "approve" && !note.trim()) {
      setLocalError(
        intent === "research"
          ? "Describe what needs more research before saving."
          : "Describe the scope change before saving.",
      );
      return;
    }
    decide.mutate(INTENT_PATH[intent]);
  }

  const contextBody = (
    <>
      <details open>
        <summary>Decision requested</summary>
        <p>{context.decisionRequested}</p>
        {context.alreadyDecided && context.decisionSummary ? (
          <p>
            <strong>Saved:</strong> {context.decisionSummary}
          </p>
        ) : null}
        <p>
          <strong>Aria’s draft:</strong> {context.recommendationLabel}.{" "}
          {context.recommendationRationale}
        </p>
      </details>

      <details open>
        <summary>Options considered</summary>
        {context.optionsConsidered.length ? (
          <ul>
            {context.optionsConsidered.map((option) => (
              <li key={option.id}>
                <label className="flex gap-2 items-start">
                  <input
                    type="radio"
                    name="pmd-option"
                    value={option.id}
                    checked={optionId === option.id}
                    disabled={context.alreadyDecided || decide.isPending}
                    onChange={() => setOptionId(option.id)}
                  />
                  <span>
                    <strong>{option.title}</strong>
                    <br />
                    <span>{option.tradeoff || "No trade-off recorded."}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        ) : (
          <p>No options are on the record yet.</p>
        )}
      </details>

      <details open>
        <summary>Evidence used</summary>
        {context.evidenceUsed.length ? (
          <div className="pmd-evidence-row">
            {context.evidenceUsed.map((chip) =>
              chip.href ? (
                <a
                  key={chip.id}
                  className="pmd-chip"
                  data-kind={chip.kind}
                  href={chip.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  {chip.label}
                </a>
              ) : (
                <span key={chip.id} className="pmd-chip" data-kind={chip.kind}>
                  {chip.label}
                </span>
              ),
            )}
          </div>
        ) : (
          <p>No supplied evidence items are recorded yet.</p>
        )}
      </details>

      <details>
        <summary>Assumptions</summary>
        {context.assumptions.length ? (
          <ul>
            {context.assumptions.map((line) => (
              <li key={line.slice(0, 48)}>{line}</li>
            ))}
          </ul>
        ) : (
          <p>No assumptions labelled on the register.</p>
        )}
      </details>

      <details>
        <summary>Open questions</summary>
        {context.openQuestions.length ? (
          <ul>
            {context.openQuestions.map((line) => (
              <li key={line.slice(0, 48)}>{line}</li>
            ))}
          </ul>
        ) : (
          <p>No open questions labelled yet.</p>
        )}
      </details>
    </>
  );

  return (
    <section className="pmd" aria-label="Discussion with PM" data-studio-screen="pm-discussion">
      <header>
        <p className="pmd-kicker">Screen 7 · Discuss &amp; decide</p>
        <h2 className="sr-only">Discussion with Aria</h2>
      </header>

      <div className="pmd-layout">
        <div className="pmd-main">
          <p className="pmd-kicker">Aria — AI Product Manager</p>
          <h2>Discussion</h2>

          <div className="pmd-thread" aria-label="Sample conversation">
            <article className="pmd-bubble" data-role="user">
              <div className="pmd-bubble-meta">
                You <em className="pmd-sample">Sample</em>
              </div>
              <p>{sample.user}</p>
            </article>
            <article className="pmd-bubble" data-role="aria">
              <div className="pmd-bubble-meta">
                Aria <em className="pmd-sample">Sample</em>
              </div>
              <p>{sample.aria}</p>
              <p className="cc-muted text-xs mt-2 mb-0">
                Sample reply for layout only — not a verified finding from this case.
              </p>
            </article>
          </div>

          <CaseChatPanel
            mission={mission}
            title="Ask Aria"
            helperText="Ask follow-ups about the recommendation. Chat does not save a decision by itself — use the actions below."
            placeholder="Ask Aria about this case…"
            suggestedPrompts={[
              "Why is this your recommendation?",
              "What evidence supports this option?",
              "What should we research next?",
            ]}
          />

          <div className="pmd-actions mt-4">
            <button
              type="button"
              className="pmd-btn pmd-btn-primary"
              disabled={context.alreadyDecided || decide.isPending || !proposal}
              onClick={() => startIntent("approve")}
            >
              Approve direction
            </button>
            <button
              type="button"
              className="pmd-btn pmd-btn-secondary"
              disabled={context.alreadyDecided || decide.isPending || !proposal}
              onClick={() => startIntent("research")}
            >
              Request more research
            </button>
            <button
              type="button"
              className="pmd-btn pmd-btn-ghost"
              disabled={context.alreadyDecided || decide.isPending || !proposal}
              onClick={() => startIntent("scope")}
            >
              Change scope
            </button>
          </div>

          {intent ? (
            <div className="pmd-note-panel" role="region" aria-label="Confirm decision">
              <label className="cc-label" htmlFor="pmd-decision-note">
                {intent === "approve"
                  ? "Confirm approval"
                  : intent === "research"
                    ? "Research request"
                    : "Scope change"}
              </label>
              <textarea
                id="pmd-decision-note"
                className="cc-input cc-textarea"
                rows={3}
                maxLength={2000}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder={INTENT_PROMPT[intent]}
                disabled={decide.isPending}
              />
              <div className="pmd-actions">
                <button
                  type="button"
                  className="pmd-btn pmd-btn-primary"
                  disabled={decide.isPending}
                  onClick={() => confirmIntent()}
                >
                  {decide.isPending ? "Saving decision…" : "Save decision"}
                </button>
                <button
                  type="button"
                  className="pmd-btn pmd-btn-ghost"
                  disabled={decide.isPending}
                  onClick={() => {
                    setIntent(null);
                    setNote("");
                    setLocalError(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          <p id={statusId} className="pmd-status" role="status" aria-live="polite">
            {decide.isPending
              ? "Saving your decision to this case…"
              : context.alreadyDecided
                ? "A decision is already on the record."
                : localError
                  ? localError
                  : ""}
          </p>
          {localError ? (
            <p className="cc-error" role="alert">
              {localError}
            </p>
          ) : null}
        </div>

        <aside className="pmd-side" aria-label="Decision context">
          <p className="pmd-kicker">Decision context</p>
          <h2>Decision context</h2>
          {contextBody}
        </aside>
      </div>

      <details className="pmd-mobile-context pmd-main">
        <summary>Decision context</summary>
        {contextBody}
      </details>

      {advancedDecisionSlot ? (
        <details className="pmd-main">
          <summary>Advanced · full decision form</summary>
          {advancedDecisionSlot}
        </details>
      ) : null}
    </section>
  );
}
