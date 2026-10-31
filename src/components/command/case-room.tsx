/**
 * The Room — the case as one story told by Aria, with one next step at a time.
 *
 * Reads only the saved record (`buildRoomModel`). Each decision opens the existing, tested
 * control set for that step in a side sheet, so approvals keep their version binding and
 * consent rules. The full record stays one link away, below the Room.
 */
import { useEffect, useState, type ReactNode } from "react";
import { AgentAvatar } from "@/components/command/agent-avatar";
import { CaseChatPanel } from "@/components/command/case-chat-panel";
import { RoomStage } from "@/components/command/room-stage";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { buildRoomModel, roomDateLabel, type RoomBeat } from "@/lib/pilot-mission/room-story";
import type { SupervisedMission } from "@/lib/pilot-mission/types";
import "@/styles/studio-system.css";
import "@/styles/room.css";

type Panel = "plan" | "work" | "decide" | "delivery" | "ask";

export type CaseRoomPanels = {
  plan: ReactNode;
  work: ReactNode;
  decide: ReactNode;
  delivery: ReactNode;
};

const PANEL_TITLE: Record<Panel, string> = {
  plan: "Review the plan",
  work: "Next step",
  decide: "Your decision",
  delivery: "Begin delivery",
  ask: "Ask Aria",
};

function Aria({ children }: { children: ReactNode }) {
  return (
    <li className="room-msg">
      <AgentAvatar name="Aria" role="Product Manager" size={40} />
      <div className="room-msg-body">
        <p className="room-who">
          Aria <span>Product Manager</span>
        </p>
        {children}
      </div>
    </li>
  );
}

function You({ children }: { children: ReactNode }) {
  return (
    <li className="room-msg room-msg-you">
      <div className="room-you">{children}</div>
    </li>
  );
}

function Facts({ facts }: { facts: Array<{ label: string; value: string }> }) {
  if (!facts.length) return null;
  return (
    <dl className="room-facts">
      {facts.map((f) => (
        <div key={f.label}>
          <dt>{f.label}</dt>
          <dd>{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function TeamIntro({ beat }: { beat: Extract<RoomBeat, { kind: "team" }> }) {
  const [focus, setFocus] = useState<string | null>(null);
  const selected = beat.members.find((m) => m.name === focus) ?? null;
  return (
    <>
      <p>{beat.message}</p>
      {beat.members.length ? (
        <>
          <ul className="room-team">
            {beat.members.map((m, i) => (
              <li key={m.name} style={{ animationDelay: `${i * 140}ms` }}>
                <button
                  type="button"
                  aria-pressed={focus === m.name}
                  onClick={() => setFocus(focus === m.name ? null : m.name)}
                >
                  <AgentAvatar name={m.name} role={m.role} size={56} />
                  <b>{m.name}</b>
                  <span>{m.role}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="room-team-focus" aria-live="polite">
            {selected ? (
              <>
                <b>{selected.name}</b> — {selected.responsibility}{" "}
                <span className="room-mono">{selected.status}</span>
              </>
            ) : (
              "Tap anyone to see what they do on this case."
            )}
          </p>
        </>
      ) : null}
    </>
  );
}

function Beat({ beat }: { beat: RoomBeat }) {
  switch (beat.kind) {
    case "idea":
      return (
        <You>
          <p>{beat.question}</p>
          {beat.context.length ? (
            <p className="room-you-meta">
              {beat.context.map((c) => `${c.label}: ${c.value}`).join(" · ")}
            </p>
          ) : null}
        </You>
      );
    case "plan":
      return (
        <Aria>
          <p>
            {beat.approved
              ? `You approved the investigation plan${beat.approvedAt ? ` on ${roomDateLabel(beat.approvedAt)}` : ""}.`
              : "Here’s how I’d investigate it. Nothing runs until you approve the plan."}
          </p>
          {!beat.approved ? (
            <div className="room-card">
              <Facts facts={beat.facts} />
              {beat.steps.length ? (
                <ol className="room-steps">
                  {beat.steps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
              ) : null}
            </div>
          ) : null}
        </Aria>
      );
    case "investigation":
      return null; // rendered with the stage, below
    case "briefing":
      return (
        <Aria>
          <p>
            <b>{beat.headline}.</b> {beat.summary}
          </p>
          <div className="room-card">
            <div className="room-verdict">
              <span className="room-mono">Aria’s recommendation</span>
              <strong>{beat.verdict}</strong>
            </div>
            <Facts facts={beat.facts} />
            {beat.options.length ? (
              <div className="room-options">
                <span className="room-mono">Directions on the table</span>
                <ul>
                  {beat.options.map((o) => (
                    <li key={o.id}>
                      <b>{o.title}</b> {o.detail}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <details className="room-more">
              <summary>See the full briefing and how it was made</summary>
              <Facts facts={beat.detail} />
              <p className="room-howmade">{beat.howMade}</p>
            </details>
          </div>
        </Aria>
      );
    case "decision":
      return (
        <You>
          <p>
            {beat.choice}
            {beat.option ? ` — ${beat.option}` : ""}
          </p>
          {beat.note ? <p className="room-you-meta">{beat.note}</p> : null}
        </You>
      );
    case "team":
      return (
        <Aria>
          <TeamIntro beat={beat} />
        </Aria>
      );
    case "delivery":
      return (
        <Aria>
          <p>
            Delivery started on {roomDateLabel(beat.approvedAt)}. The build plan is running in the
            delivery engine. I’ll bring each stage here as it completes and stop for your approval
            at every gate.
          </p>
        </Aria>
      );
    case "package":
      return (
        <Aria>
          <p>
            {beat.ready
              ? "Your decision pack is ready. Everything in it says how it was made."
              : "I’m preparing the decision pack from the record."}
          </p>
        </Aria>
      );
    default:
      return null;
  }
}

export function CaseRoom({
  mission,
  panels,
}: {
  mission: SupervisedMission;
  panels: CaseRoomPanels;
}) {
  const model = buildRoomModel(mission);
  const [panel, setPanel] = useState<Panel | null>(null);
  const investigation = model.beats.find(
    (b): b is Extract<RoomBeat, { kind: "investigation" }> => b.kind === "investigation",
  );

  // Close the sheet once the step it was opened for is done (the record moved on).
  const [openedFor, setOpenedFor] = useState<string | null>(null);
  useEffect(() => {
    if (
      panel &&
      panel !== "ask" &&
      openedFor &&
      openedFor !== `${model.next.id}:${mission.version}`
    ) {
      if (panel !== "delivery" || mission.delivery) setPanel(null);
    }
  }, [model.next.id, mission.version, mission.delivery, openedFor, panel]);
  const open = (p: Panel) => {
    setOpenedFor(`${model.next.id}:${mission.version}`);
    setPanel(p);
  };

  const ariaLine = investigation?.live
    ? "The team is on it. Give me a few minutes — you can leave; I’ll have a briefing when you’re back."
    : investigation
      ? `The team recorded ${investigation.findings} finding${investigation.findings === 1 ? "" : "s"} and ${investigation.gaps} open question${investigation.gaps === 1 ? "" : "s"}${investigation.provider ? ` with ${investigation.provider} web research` : ""}.`
      : "";

  const beforeStage = model.beats.filter((b) => b.kind === "idea" || b.kind === "plan");
  const afterStage = model.beats.filter(
    (b) => b.kind !== "idea" && b.kind !== "plan" && b.kind !== "investigation",
  );

  return (
    <div className="sx room" data-studio-screen="room">
      <header className="room-head">
        <h1>{model.title}</h1>
        <p className="room-status" data-working={model.status.working ? "true" : "false"}>
          {model.status.line}
        </p>
      </header>

      <ol className="room-thread">
        {beforeStage.map((beat, i) => (
          <Beat key={`${beat.kind}-${i}`} beat={beat} />
        ))}
        {investigation ? (
          <Aria>
            <p>{ariaLine}</p>
            <RoomStage
              idea={model.stage.idea}
              findings={model.stage.findings}
              agents={model.stage.agents}
              live={investigation.live}
              ariaLine={
                investigation.live
                  ? "Working on it. I’ll come back with a briefing."
                  : "That’s everything the team recorded."
              }
            />
          </Aria>
        ) : null}
        {afterStage.map((beat, i) => (
          <Beat key={`${beat.kind}-${i}`} beat={beat} />
        ))}
      </ol>

      <div className="room-dock" role="region" aria-label="What happens next">
        <div className="room-dock-in">
          {model.next.waitingOnYou ? (
            <span className="room-waiting">Aria needs you</span>
          ) : (
            <span className="room-working">{model.next.label}</span>
          )}
          <div className="room-dock-actions">
            <button type="button" className="room-pill" onClick={() => open("ask")}>
              Ask Aria
            </button>
            {model.deliveryAvailable ? (
              <button
                type="button"
                className="room-pill room-pill-primary"
                onClick={() => open("delivery")}
              >
                Begin delivery
              </button>
            ) : null}
            {model.next.panel !== "none" && model.next.waitingOnYou ? (
              <button
                type="button"
                className={`room-pill${model.deliveryAvailable ? "" : " room-pill-primary"}`}
                onClick={() => open(model.next.panel as Panel)}
              >
                {model.next.label}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <Sheet open={panel !== null} onOpenChange={(o) => !o && setPanel(null)}>
        <SheetContent
          side="right"
          className="sx psi-workspace room-sheet w-full sm:max-w-xl overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle>{panel ? PANEL_TITLE[panel] : ""}</SheetTitle>
            <SheetDescription>
              {panel === "ask"
                ? "Answers come from this case’s record."
                : panel === "delivery"
                  ? "Starts the build for your chosen direction. Nothing runs without this approval."
                  : model.next.detail}
            </SheetDescription>
          </SheetHeader>
          <div className="room-sheet-body">
            {panel === "ask" ? (
              <CaseChatPanel
                mission={mission}
                title="Ask Aria"
                helperText="Ask about the evidence, the options, the risks or what happens next."
                suggestedPrompts={[
                  "What did the team find?",
                  "What are the biggest risks?",
                  "What happens next?",
                ]}
              />
            ) : null}
            {panel === "plan" ? panels.plan : null}
            {panel === "work" ? panels.work : null}
            {panel === "decide" ? panels.decide : null}
            {panel === "delivery" ? panels.delivery : null}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
