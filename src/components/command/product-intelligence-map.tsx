import { useId, useState } from "react";
import { MessageSquare, NotebookText } from "lucide-react";
import { CaseChatPanel } from "@/components/command/case-chat-panel";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  buildProductIntelligenceMap,
  type ProductIntelligenceWorkstreamId,
} from "@/lib/pilot-mission/product-intelligence-map";
import type { SupervisedMission } from "@/lib/pilot-mission/types";
import "@/styles/product-intelligence-map.css";

const CLUSTER_ORDER: ProductIntelligenceWorkstreamId[] = [
  "market",
  "users",
  "competition",
  "risks",
  "opportunities",
  "direction",
];

function formatNoteTime(iso: string): string {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return iso;
  return new Date(ms).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Screen 5 — Product Intelligence Map for the supervised investigation workspace.
 * States and notes are event-backed; empty when the plan is not yet approved.
 */
export function ProductIntelligenceMap({ mission }: { mission: SupervisedMission }) {
  const model = buildProductIntelligenceMap(mission);
  const [notesOpen, setNotesOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const progressLabelId = useId();

  const workstreams = CLUSTER_ORDER.map((id) => model.workstreams.find((w) => w.id === id)!);

  return (
    <section
      className="pim"
      aria-label="Product intelligence map"
      data-studio-screen="intelligence-map"
    >
      <header className="pim-topbar">
        <div className="pim-topbar-main">
          <p className="pim-stage">{model.stageLabel}</p>
          <h2 className="pim-project">{model.projectName}</h2>
        </div>

        <div className="pim-progress-wrap">
          <label id={progressLabelId} htmlFor={`${progressLabelId}-bar`}>
            Overall progress · {model.progressPercent}%
          </label>
          <div
            id={`${progressLabelId}-bar`}
            className="pim-progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={model.progressPercent}
            aria-labelledby={progressLabelId}
          >
            <span style={{ width: `${model.progressPercent}%` }} />
          </div>
        </div>

        <div className="pim-topbar-actions">
          <button
            type="button"
            className="pim-btn pim-btn-ghost"
            onClick={() => setNotesOpen(true)}
          >
            <NotebookText size={16} aria-hidden="true" />
            See working notes
          </button>
          <button
            type="button"
            className="pim-btn pim-btn-primary"
            onClick={() => setChatOpen(true)}
          >
            <MessageSquare size={16} aria-hidden="true" />
            Talk to Aria
          </button>
        </div>
      </header>

      <div className="pim-stage-frame">
        <div className="pim-constellation" aria-hidden="true">
          <svg viewBox="0 0 900 560" preserveAspectRatio="xMidYMid slice">
            <g fill="none" stroke="rgba(99,102,241,0.2)" strokeWidth="1">
              <path d="M450 280 L160 120 M450 280 L740 120 M450 280 L140 280 M450 280 L760 280 M450 280 L180 440 M450 280 L720 440" />
            </g>
            <g fill="rgba(34,211,238,0.35)">
              <circle cx="160" cy="120" r="3" />
              <circle cx="740" cy="120" r="3" />
              <circle cx="140" cy="280" r="2.5" />
              <circle cx="760" cy="280" r="2.5" />
              <circle cx="180" cy="440" r="3" />
              <circle cx="720" cy="440" r="3" />
              <circle cx="450" cy="280" r="4" />
            </g>
          </svg>
        </div>

        <div className="pim-map" data-layout="radial">
          <div className="pim-core" aria-label="Submitted idea">
            <span>Idea</span>
            <strong>{model.ideaLabel}</strong>
          </div>

          {workstreams.map((stream) => (
            <article
              key={stream.id}
              className="pim-cluster"
              data-id={stream.id}
              data-state={stream.state}
              title={stream.eventBasis.join(", ") || undefined}
            >
              <div className="pim-cluster-head">
                <h3>{stream.label}</h3>
                <span className="pim-state">
                  <i aria-hidden="true" />
                  {stream.stateLabel}
                </span>
              </div>
              <p>{stream.detail}</p>
              <div className="pim-agent">
                <strong>
                  {stream.agent.name}
                  <span aria-hidden="true"> · </span>
                  {stream.agent.role}
                </strong>
                <span>{stream.agent.task}</span>
              </div>
            </article>
          ))}
        </div>
      </div>

      {!model.planApproved ? (
        <p className="pim-empty" role="status">
          Investigation workstreams stay idle until you approve the specialist plan. Your idea and
          clarifying answers are already on the case record.
        </p>
      ) : null}

      {model.insightCards.length > 0 ? (
        <ul className="pim-insights" aria-label="Recorded insight cards">
          {model.insightCards.map((card) => (
            <li key={card.id} className="pim-insight">
              <h4>
                {card.title}
                {/sample|illustrative|draft/i.test(card.honestyLabel) ? (
                  <em className="pim-sample">Sample</em>
                ) : null}
              </h4>
              <p>{card.summary}</p>
              <p>{card.honestyLabel}</p>
            </li>
          ))}
        </ul>
      ) : null}

      <footer className="pim-status-bar">
        <p role="status">
          <strong>Aria</strong> — {model.pmStatus}
        </p>
        <p role="status">{model.progressLabel}</p>
      </footer>

      <Sheet open={notesOpen} onOpenChange={setNotesOpen}>
        <SheetContent side="right" className="sx w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Working notes</SheetTitle>
            <SheetDescription>
              Timeline from saved activity on this case. Nothing here is invented for display.
            </SheetDescription>
          </SheetHeader>
          <div className="pim-notes mt-4">
            {model.notes.length === 0 ? (
              <p className="pim-empty">
                No working notes yet. Notes appear when specialists or Aria save activity to this
                case.
              </p>
            ) : (
              model.notes.map((note) => (
                <details key={note.id} className="pim-note">
                  <summary>
                    <strong>{note.agent}</strong>
                    <span aria-hidden="true"> — </span>
                    {note.action}
                  </summary>
                  <div className="pim-note-meta">
                    <span>Time: {formatNoteTime(note.at)}</span>
                    <span>Source: {note.sourceType}</span>
                    <span>Evidence: {note.evidenceStatus}</span>
                  </div>
                </details>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={chatOpen} onOpenChange={setChatOpen}>
        <SheetContent side="right" className="sx w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Aria — AI Product Manager</SheetTitle>
            <SheetDescription>
              Ask about this investigation. Aria drafts; you still approve plans and decisions.
            </SheetDescription>
          </SheetHeader>
          <div className="pim-chat-body">
            <CaseChatPanel
              mission={mission}
              title="Talk with Aria"
              helperText="Ask about the idea, workstreams, or what is waiting on you. Nothing runs until you approve it on the case."
              placeholder="e.g. What are we still missing about day-one users?"
              suggestedPrompts={[
                "Summarise what is on the record so far",
                "What is waiting on me?",
                "Which workstream has the most gaps?",
              ]}
            />
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
}
