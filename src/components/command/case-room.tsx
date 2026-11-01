/**
 * The Room — the case as one story told by Aria, with one next step at a time.
 *
 * Reads only the saved record (`buildRoomModel`). Each decision opens the existing, tested
 * control set for that step in a side sheet, so approvals keep their version binding and
 * consent rules. The full record stays one link away, below the Room.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AgentAvatar } from "@/components/command/agent-avatar";
import { CaseChatPanel } from "@/components/command/case-chat-panel";
import { BuildCard, GateReview } from "@/components/command/delivery-build";
import { RoomStage } from "@/components/command/room-stage";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { DeliveryRoom } from "@/lib/pilot-mission/delivery-room";
import type { Workroom as WorkroomModel } from "@/lib/pilot-mission/workroom";
import { Workroom } from "@/components/command/workroom";
import { buildRoomModel, roomDateLabel, type RoomBeat } from "@/lib/pilot-mission/room-story";
import type { SupervisedMission } from "@/lib/pilot-mission/types";
import "@/styles/studio-system.css";
import "@/styles/room.css";

type Panel = "plan" | "work" | "decide" | "delivery" | "gate" | "ask" | "workroom";

/** The linked delivery build, read from the delivery engine by the page. */
export type CaseRoomBuild = {
  room: DeliveryRoom | null;
  /** The same build as a board, work plans, order and team capacity. */
  workroom: WorkroomModel | null;
  error: string | null;
  deciding: boolean;
  onDecideGate: (taskId: string, decision: "approve" | "reject", note: string) => void;
};

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
  gate: "Your review",
  workroom: "Workroom",
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

function Beat({
  beat,
  build,
  onOpenWorkroom,
}: {
  beat: RoomBeat;
  build?: CaseRoomBuild | undefined;
  onOpenWorkroom?: () => void;
}) {
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
            <div className="room-estimate">
              <span className="room-mono">If you build it</span>
              <dl className="room-facts">
                <div>
                  <dt>Time to a first version</dt>
                  <dd>{beat.estimate.firstVersion.range}</dd>
                </div>
                <div>
                  <dt>AI build work</dt>
                  <dd>{beat.estimate.aiWork.line}</dd>
                </div>
              </dl>
              <ul className="room-tech">
                {beat.estimate.technology.map((t) => (
                  <li key={t.part}>
                    <span className="room-mono">{t.part}</span>
                    <b>{t.choice}</b>
                    <span>{t.why}</span>
                  </li>
                ))}
              </ul>
              <p className="room-howmade">Estimate, not a quote. {beat.estimate.method}</p>
            </div>
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
    case "team": {
      // Once the build exists, the team is whoever owns its tasks.
      const team = build?.room?.team ?? [];
      const shown: typeof beat = team.length
        ? {
            kind: "team",
            message: `Here’s the team building it — ${team.length} specialist${team.length === 1 ? "" : "s"}. Each one’s status comes from their saved work.`,
            members: team.map((m) => ({
              name: m.name,
              role: m.role,
              responsibility: m.role,
              status: m.state === "working" ? "Working" : m.state === "done" ? "Done" : "Up next",
            })),
          }
        : beat;
      return (
        <Aria>
          <TeamIntro beat={shown} />
        </Aria>
      );
    }
    case "delivery":
      return (
        <>
          <Aria>
            <p>
              Delivery started on {roomDateLabel(beat.approvedAt)}.{" "}
              {build?.room
                ? DELIVERY_LINE[build.room.state]
                : build?.error
                  ? `I can’t read the build right now: ${build.error}`
                  : "Loading the build…"}
            </p>
            {build?.room ? <BuildCard room={build.room} /> : null}
            {build?.workroom && onOpenWorkroom ? (
              <button
                type="button"
                className="room-pill room-open-workroom"
                onClick={onOpenWorkroom}
              >
                Open the Workroom — see how each agent plans its work
              </button>
            ) : null}
          </Aria>
          {build?.room?.updates.slice(-3).map((u) => (
            <li key={u.id} className="room-msg room-update">
              <AgentAvatar name={u.who === "You" ? "Aria" : u.who} role={u.role} size={32} />
              <p>{u.text}</p>
            </li>
          ))}
          {build?.room?.gate ? (
            <Aria>
              <p>
                The work before this gate is done. Next:{" "}
                <b>{build.room.gate.title.toLowerCase()}</b>. The following stage waits for your
                decision — only you can pass this gate.
              </p>
            </Aria>
          ) : null}
        </>
      );
    case "package":
      return (
        <Aria>
          <p>
            {beat.ready
              ? "Your decision pack is ready. Everything in it says how it was made."
              : "I’m preparing the decision pack from the record."}
            {build?.room
              ? ` The project download also holds the build so far: ${build.room.stages.filter((st) => st.output).length} saved stage outputs, each saying who made it and how, plus the team record.`
              : ""}
          </p>
        </Aria>
      );
    default:
      return null;
  }
}

const DELIVERY_LINE: Record<DeliveryRoom["state"], string> = {
  running: "The team is building. I’ll bring each stage here as it completes.",
  waiting_on_you: "The team has stopped at a gate and needs your decision.",
  paused: "The build is paused.",
  done: "Every stage is complete. The outputs are below and in the package.",
  failed: "A stage failed or was sent back, so the stages after it will not run.",
  cancelled: "The build was cancelled.",
};

export function CaseRoom({
  mission,
  panels,
  build,
}: {
  mission: SupervisedMission;
  panels: CaseRoomPanels;
  build?: CaseRoomBuild;
}) {
  const model = buildRoomModel(mission);
  const gate = build?.room?.gate ?? null;
  const buildState = build?.room?.state ?? null;
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
  // The gate sheet closes once the gate has been decided.
  useEffect(() => {
    if (panel === "gate" && !gate) setPanel(null);
  }, [panel, gate]);

  // "Aria is back": announce each newly completed stage while the Room is open.
  const updateCount = build?.room?.updates.length ?? 0;
  const seen = useRef<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    if (!build?.room) return;
    if (seen.current !== null && updateCount > seen.current) {
      setToast(build.room.updates[updateCount - 1]?.text ?? null);
      const t = setTimeout(() => setToast(null), 7000);
      seen.current = updateCount;
      return () => clearTimeout(t);
    }
    seen.current = updateCount;
    return undefined;
  }, [updateCount, build?.room]);

  // A waiting gate shows in the tab title, so it is visible from other tabs.
  useEffect(() => {
    if (typeof document === "undefined" || !gate) return;
    const before = document.title;
    document.title = `(1) Aria needs you · ${before}`;
    return () => {
      document.title = before;
    };
  }, [gate]);

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
        <p
          className="room-status"
          data-working={
            buildState
              ? buildState === "running"
                ? "true"
                : "false"
              : model.status.working
                ? "true"
                : "false"
          }
        >
          {gate
            ? `Aria needs you: ${gate.title.toLowerCase()}.`
            : buildState === "running"
              ? "The team is building. Aria will come back after each stage."
              : buildState === "done"
                ? "The build is complete."
                : model.status.line}
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
          <Beat
            key={`${beat.kind}-${i}`}
            beat={beat}
            build={build}
            onOpenWorkroom={() => open("workroom")}
          />
        ))}
      </ol>

      {toast ? (
        <p className="room-toast" role="status">
          <b>Aria is back.</b> {toast}
        </p>
      ) : null}

      <div className="room-dock" role="region" aria-label="What happens next">
        <div className="room-dock-in">
          {gate || model.next.waitingOnYou ? (
            <span className="room-waiting">Aria needs you</span>
          ) : (
            <span className="room-working">
              {buildState === "running" ? "The team is building" : model.next.label}
            </span>
          )}
          <div className="room-dock-actions">
            <button type="button" className="room-pill" onClick={() => open("ask")}>
              Ask Aria
            </button>
            {gate ? (
              <button
                type="button"
                className="room-pill room-pill-primary"
                onClick={() => open("gate")}
              >
                Review: {gate.title.charAt(0).toLowerCase() + gate.title.slice(1)}
              </button>
            ) : null}
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
                className={`room-pill${model.deliveryAvailable || gate ? "" : " room-pill-primary"}`}
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
          className={`sx psi-workspace room-sheet w-full overflow-y-auto ${
            panel === "workroom" ? "sm:max-w-6xl" : "sm:max-w-xl"
          }`}
        >
          <SheetHeader>
            <SheetTitle>
              {panel === "work" ? model.next.label : panel ? PANEL_TITLE[panel] : ""}
            </SheetTitle>
            <SheetDescription>
              {panel === "ask"
                ? "Answers come from this case’s record."
                : panel === "delivery"
                  ? "Starts the build for your chosen direction. Nothing runs without this approval."
                  : panel === "gate"
                    ? "A human gate: agents can stop here but never pass it."
                    : panel === "workroom"
                      ? "How the team plans and does the work — read from the build’s records."
                      : panel === "plan"
                        ? "Nothing runs until you approve."
                        : panel === "decide"
                          ? "Nothing proceeds until you save."
                          : "One thing Aria needs from you."}
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
            {panel === "workroom" && build?.workroom ? <Workroom model={build.workroom} /> : null}
            {panel === "gate" && gate && build ? (
              <GateReview
                gate={gate}
                pending={build.deciding}
                onDecide={(decision, note) => build.onDecideGate(gate.taskId, decision, note)}
              />
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
