import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { CaseChatPanel } from "@/components/command/case-chat-panel";
import { ListenBriefButton } from "@/components/command/listen-brief-button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { buildPmBrief } from "@/lib/pilot-mission/pm-brief";
import {
  buildPmBriefingScreen,
  type PmBriefingActionIntent,
} from "@/lib/pilot-mission/pm-briefing-screen";
import type { SupervisedMission } from "@/lib/pilot-mission/types";
import "@/styles/pm-briefing-screen.css";

/**
 * Screen 6 — PM briefing after investigation.
 * Recommendation and cards come from the mission record; actions continue to discuss/decide.
 */
export function InvestigationPmBriefingStage({
  mission,
  missionId,
  onContinueToDecision,
}: {
  mission: SupervisedMission;
  missionId?: string;
  onContinueToDecision?: (intent: PmBriefingActionIntent, optionId?: string) => void;
}) {
  const model = buildPmBriefingScreen(mission);
  const brief = buildPmBrief(mission);
  // No option is preselected: options carry no recorded recommendation.
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  if (!model.ready) {
    return (
      <section className="pmb" aria-label="PM briefing">
        <div className="pmb-pending">
          <p className="cc-kicker">Aria — AI Product Manager</p>
          <h2 className="ps-pm-briefing-title">{model.headline}</h2>
          <p className="cc-muted text-sm">{model.ariaMessage}</p>
        </div>
      </section>
    );
  }

  function go(intent: PmBriefingActionIntent) {
    if (intent === "discuss") {
      setChatOpen(true);
      onContinueToDecision?.(intent, selectedOptionId ?? undefined);
      return;
    }
    onContinueToDecision?.(intent, selectedOptionId ?? undefined);
  }

  return (
    <section className="pmb" aria-label="PM briefing" data-studio-screen="pm-briefing">
      <div className="pmb-layout">
        <aside className="pmb-aria">
          <div className="pmb-aria-chip">
            <span className="pmb-avatar" aria-hidden="true">
              AR
            </span>
            <div>
              <strong>Aria</strong>
              <span>AI Product Manager</span>
            </div>
          </div>
          <h2>{model.headline}</h2>
          <p className="pmb-message">{model.ariaMessage}</p>
          <p className="pmb-honesty">{model.roleDisclosure}</p>
          <p className="pmb-honesty">{model.honesty}</p>
          <div className="mt-3">
            <ListenBriefButton brief={brief} />
          </div>
        </aside>

        <div className="pmb-cards" aria-label="Structured briefing">
          {model.cards.map((card) => (
            <article key={card.id} className={`pmb-card${card.wide ? " pmb-card-wide" : ""}`}>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </article>
          ))}
        </div>
      </div>

      <section className="pmb-options" aria-label="Product direction options">
        <div className="pmb-options-head">
          <h3>Direction options</h3>
          <p className="cc-muted text-xs mb-0">
            {model.options.length
              ? "Select an option, then choose an action. Saving the decision happens on the next step."
              : "Options appear when a comparison draft is on the record."}
          </p>
        </div>

        {model.options.length ? (
          <div className="pmb-options-grid" role="radiogroup" aria-label="Options A B C">
            {model.options.map((option) => {
              const selected = selectedOptionId === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={`pmb-option${selected ? " is-selected" : ""}`}
                  onClick={() => setSelectedOptionId(option.id)}
                >
                  <strong>
                    {option.label}: {option.title}
                  </strong>
                  <p>{option.detail}</p>
                  {option.basis ? (
                    <p className="cc-muted text-xs mt-2 mb-0">Basis: {option.basis}</p>
                  ) : null}
                  {!mission.proposal?.generation.ran ? <em className="pmb-sample">Draft</em> : null}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="cc-muted text-sm">
            No Option A/B/C cards yet. Continue when the investigation has drafted alternatives on
            this case.
          </p>
        )}
      </section>

      <div className="pmb-actions">
        <button
          type="button"
          className="pmb-btn pmb-btn-primary"
          onClick={() => go("approve_and_build")}
        >
          Approve and build
        </button>
        <button type="button" className="pmb-btn pmb-btn-secondary" onClick={() => go("discuss")}>
          <MessageSquare size={16} aria-hidden="true" />
          Discuss with Aria
        </button>
        <button type="button" className="pmb-btn pmb-btn-ghost" onClick={() => go("more_research")}>
          Request more research
        </button>
        <button
          type="button"
          className="pmb-btn pmb-btn-ghost"
          onClick={() => go("change_direction")}
        >
          Change direction
        </button>
      </div>
      <p className="pmb-honesty">
        “Approve and build” opens the decision step. External build work still requires an explicit
        human approval on the case — this screen does not start delivery by itself.
      </p>

      <Sheet open={chatOpen} onOpenChange={setChatOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Discuss with Aria</SheetTitle>
            <SheetDescription>
              Challenge the briefing or ask for clarification. Chat does not approve a path by
              itself.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4">
            <CaseChatPanel
              mission={mission}
              title="Talk with Aria"
              helperText="Ask why, or about risks and gaps. Decisions and changes are saved on the discuss & decide step."
              placeholder="Ask about the recommendation…"
              suggestedPrompts={[
                "Why is this your recommendation?",
                "What is the biggest risk?",
                "What should we research next?",
              ]}
            />
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
}
