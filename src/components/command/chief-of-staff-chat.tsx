import { useId, useRef, useState } from "react";
import { MessageSquare } from "lucide-react";
import { performChiefOfStaffAction } from "@/components/command/chief-of-staff-actions";
import {
  consultChiefOfStaff,
  cosActionLabel,
  type CosAction,
  type CosContext,
  type CosReply,
} from "@/lib/pilot-mission/chief-of-staff";
import type { SupervisedMission } from "@/lib/pilot-mission/types";

type Turn = { id: number; question: string; reply: CosReply };

const PROMPTS = [
  "What's the budget for this project?",
  "What did Market record?",
  "What is the next human gate?",
  "Prepare the project documents",
  "Should we stop mid-project?",
];

/**
 * Chief of Staff (DX-001) on the case in view.
 * Aria remains the product-manager path. This panel reads the programme record,
 * and continue, stop and document actions wait for a click.
 */
export function ChiefOfStaffChat({
  mission,
  deliveryState = null,
  deliveryMissionId = null,
  onRecordChange,
  onAction,
}: {
  mission: SupervisedMission;
  deliveryState?: CosContext["deliveryState"];
  deliveryMissionId?: string | null;
  onRecordChange?: () => void | Promise<void>;
  /** Tests pass this so a click does not call the server. */
  onAction?: (action: CosAction) => void | Promise<void>;
}) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nextId = useRef(1);
  const inputId = useId();
  const titleId = useId();
  const context: CosContext = {
    deliveryState: deliveryState ?? null,
    hasDelivery: Boolean(deliveryMissionId),
  };
  const latestId = turns.length ? turns[turns.length - 1]!.id : null;

  function ask(question: string, fromInput: boolean) {
    const trimmed = question.trim();
    if (!trimmed) return;
    const reply = consultChiefOfStaff(mission, trimmed, context);
    setTurns((prev) => [...prev, { id: nextId.current++, question: trimmed, reply }].slice(-20));
    setError(null);
    if (fromInput) setText("");
  }

  async function confirm(action: CosAction) {
    setPending(true);
    setError(null);
    try {
      if (onAction) await onAction(action);
      else await performChiefOfStaffAction({ mission, deliveryMissionId, action });
      if (action.kind !== "download_package") await onRecordChange?.();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That could not be completed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="cc-panel" aria-labelledby={titleId} data-cos-chat="">
      <h2 id={titleId} className="cc-panel-title flex items-center gap-2">
        <MessageSquare className="size-4" aria-hidden="true" /> Talk to Chief of Staff
      </h2>
      <p className="text-sm text-slate-600 mb-3">
        Chief of Staff (DX-001) answers from this case: budget, evidence, team, gates and the
        package. Aria stays the product-manager path. A specialist mention is a lookup of that role
        on the record, not another model. Nothing is cancelled, paused, resumed or downloaded until
        you click.
      </p>

      {turns.length ? (
        <ol className="space-y-3 mb-3" aria-label="Chief of Staff transcript" aria-live="polite">
          {turns.map((turn) => (
            <li key={turn.id} className="text-sm">
              <p className="font-medium mb-1">You: {turn.question}</p>
              <p className="whitespace-pre-line mb-1">Chief of Staff: {turn.reply.text}</p>
              {turn.reply.consulted.length ? (
                <p className="text-xs text-slate-500 mb-1">
                  Consulted: {turn.reply.consulted.map((item) => item.label).join(", ")}
                </p>
              ) : null}
              <p className="text-xs text-slate-500 mb-2">
                Source: {turn.reply.basis}. {turn.reply.lookupNote}
              </p>
              {turn.reply.action ? (
                <button
                  type="button"
                  className={
                    turn.reply.action.kind === "cancel_case" ||
                    turn.reply.action.kind === "pause_investigation" ||
                    turn.reply.action.kind === "pause_delivery"
                      ? "cc-btn cc-btn-secondary"
                      : "cc-btn cc-btn-primary"
                  }
                  disabled={pending || turn.id !== latestId}
                  onClick={() => void confirm(turn.reply.action!)}
                >
                  {pending && turn.id === latestId
                    ? "Working…"
                    : cosActionLabel(turn.reply.action.kind)}
                </button>
              ) : null}
            </li>
          ))}
        </ol>
      ) : null}

      <form
        className="space-y-2"
        onSubmit={(event) => {
          event.preventDefault();
          ask(text, true);
        }}
      >
        <label className="block text-sm font-medium" htmlFor={inputId}>
          Question
        </label>
        <textarea
          id={inputId}
          className="cc-input cc-textarea"
          rows={2}
          maxLength={1000}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Ask Chief of Staff about this case…"
        />
        <div className="ps-conversation-prompts" aria-label="Suggested questions">
          {PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className="ps-conversation-prompt"
              onClick={() => ask(prompt, false)}
            >
              {prompt}
            </button>
          ))}
        </div>
        <button type="submit" className="cc-btn cc-btn-primary" disabled={!text.trim() || pending}>
          Ask
        </button>
      </form>

      {error ? (
        <p className="cc-error text-xs mt-3" role="alert">
          {error}
        </p>
      ) : null}
      <p className="text-xs text-slate-500 mt-3">
        Answers use the saved record. Approving a plan or passing a gate stays on the page controls.
      </p>
    </section>
  );
}
