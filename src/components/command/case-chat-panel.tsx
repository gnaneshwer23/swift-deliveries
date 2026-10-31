import { useId, useRef, useState } from "react";
import { MessageSquare } from "lucide-react";
import { answerCaseQuestion, type CaseAnswer } from "@/lib/pilot-mission/case-questions";
import type { SupervisedMission } from "@/lib/pilot-mission/types";

type Turn = { id: number; question: string; answer: CaseAnswer };

/**
 * Aria answering questions about the case on screen, from its saved record.
 * Read-only: nothing typed here is stored, sent to a model, or acted on.
 */
export function CaseChatPanel({
  mission,
  title = "Talk with Aria",
  helperText,
  placeholder = "Ask Aria about this case…",
  suggestedPrompts = [],
}: {
  mission: SupervisedMission;
  title?: string;
  helperText: string;
  placeholder?: string;
  suggestedPrompts?: string[];
}) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [text, setText] = useState("");
  const nextId = useRef(1);
  const inputId = useId();
  const titleId = useId();

  function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed) return;
    // Answered on the latest saved record each time, so answers follow the case.
    const answer = answerCaseQuestion(mission, trimmed);
    setTurns((prev) => [...prev, { id: nextId.current++, question: trimmed, answer }].slice(-20));
    setText("");
  }

  return (
    <section className="cc-panel" aria-labelledby={titleId} data-case-chat="">
      <h2 id={titleId} className="cc-panel-title flex items-center gap-2">
        <MessageSquare className="size-4" aria-hidden="true" /> {title}
      </h2>
      <p className="text-sm text-slate-600 mb-3">{helperText}</p>

      {turns.length ? (
        <ol className="space-y-3 mb-3" aria-label="Questions and answers" aria-live="polite">
          {turns.map((t) => (
            <li key={t.id} className="text-sm">
              <p className="font-medium mb-1">You: {t.question}</p>
              <p className="whitespace-pre-line mb-1">Aria: {t.answer.text}</p>
              <p className="text-xs text-slate-500">Source: {t.answer.basis}</p>
            </li>
          ))}
        </ol>
      ) : null}

      <form
        className="space-y-2"
        onSubmit={(ev) => {
          ev.preventDefault();
          ask(text);
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
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
        />
        {suggestedPrompts.length ? (
          <div className="ps-conversation-prompts" aria-label="Suggested questions">
            {suggestedPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="ps-conversation-prompt"
                onClick={() => ask(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>
        ) : null}
        <button type="submit" className="cc-btn cc-btn-primary" disabled={!text.trim()}>
          Ask
        </button>
      </form>

      <p className="text-xs text-slate-500 mt-3">
        Answers come from this case’s saved record. Questions are not stored or sent to a model, and
        chat cannot approve or change the case.
      </p>
    </section>
  );
}
