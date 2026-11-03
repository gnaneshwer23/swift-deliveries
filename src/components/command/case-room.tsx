/**
 * The Room — the case as one story told by Aria, with one next step at a time.
 *
 * Reads only the saved record (`buildRoomModel`). Each decision opens the existing, tested
 * control set for that step in a side sheet, so approvals keep their version binding and
 * consent rules. The full record stays one link away, below the Room.
 */
import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AgentAvatar } from "@/components/command/agent-avatar";
import { CaseChatPanel } from "@/components/command/case-chat-panel";
import { useExplainMode } from "@/hooks/use-explain-mode";
import { BuildCard, GateReview } from "@/components/command/delivery-build";
import { downloadSavedDocuments } from "@/lib/download-file";
import { RoomDock, type RoomDockAction } from "@/components/command/room-dock";
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
import {
  buildRoomModel,
  roomDateLabel,
  roomInvestigationLine,
  type RoomBeat,
} from "@/lib/pilot-mission/room-story";
import type { SupervisedMission } from "@/lib/pilot-mission/types";
import "@/styles/studio-system.css";
import "@/styles/room.css";

type Panel = "plan" | "work" | "decide" | "delivery" | "gate" | "ask" | "workroom" | "meetings";

/** The linked delivery build, read from the delivery engine by the page. */
export type CaseRoomBuild = {
  room: DeliveryRoom | null;
  /** The same build as a board, work plans, order and team capacity. */
  workroom: WorkroomModel | null;
  error: string | null;
  deciding: boolean;
  /** The open Room stopped asking for the next step after several that saved nothing. */
  stalled?: boolean;
  stallNote?: string | null;
  onContinue?: () => void;
  onDecideGate: (taskId: string, decision: "approve" | "reject", note: string) => void;
};

export type CaseRoomPanels = {
  plan: ReactNode;
  work: ReactNode;
  decide: ReactNode;
  delivery: ReactNode;
  /** Meeting notes → proposed tasks; the owner accepts or dismisses each. */
  meetings: ReactNode;
};

/** "Explain as we go": why each step matters, for learners (and anyone who switches it on). */
const PANEL_WHY: Partial<Record<Panel, string>> = {
  plan: "A plan sets the question, the team and the usage before any work starts. Approving it is your go-ahead; nothing runs without it.",
  work: "Each step needs one thing from you. The team prepares it, and you check it before the project moves on.",
  decide:
    "Options come with trade-offs and evidence gaps. Agents recommend; the choice is always yours.",
  delivery:
    "Delivery builds your chosen direction stage by stage (charter, requirements, design, prototype, checks) and stops at your reviews.",
  gate: "A review is a human checkpoint. Agents can stop here but can never pass it; only you can.",
  workroom:
    "This is how the team plans: who owns each task, what it must include, what it builds on and how it is checked.",
  meetings:
    "Only notes from meetings you actually held count as evidence. You decide which items join the project.",
};

/** The lesson behind each panel's "why this matters" note. */
const PANEL_LESSON: Partial<Record<Panel, string>> = {
  plan: "approve-a-plan",
  decide: "compare-options",
  delivery: "reviews-and-gates",
  gate: "reviews-and-gates",
  workroom: "reviews-and-gates",
  meetings: "evidence-vs-assumptions",
};

const PANEL_TITLE: Record<Panel, string> = {
  plan: "Review the plan",
  work: "Next step",
  decide: "Your decision",
  delivery: "Begin delivery",
  gate: "Your review",
  workroom: "Workroom",
  meetings: "Meeting notes",
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
  missionId,
  onOpenWorkroom,
}: {
  beat: RoomBeat;
  build?: CaseRoomBuild | undefined;
  missionId: string;
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
      if (!beat.ready) {
        return (
          <Aria>
            <p>
              <b>{beat.headline}.</b> {beat.howMade}
            </p>
            <div className="room-card">
              <div className="room-verdict">
                <span className="room-mono">{beat.kicker}</span>
                <strong>{beat.nextLabel}</strong>
              </div>
              <p className="room-wait-copy">{beat.summary}</p>
            </div>
          </Aria>
        );
      }
      return (
        <Aria>
          <p>
            <b>{beat.headline}.</b> {beat.summary}
          </p>
          <div className="room-card">
            <div className="room-verdict">
              <span className="room-mono">{beat.kicker}</span>
              <strong>{beat.verdict}</strong>
            </div>
            <p className="room-next-line">
              <span className="room-mono">Next step</span>
              {beat.nextLabel}
            </p>
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
            {build?.stalled ? (
              <p>
                The build paused before the next document was saved.
                {build.stallNote ? ` ${build.stallNote}` : ""} Nothing was marked finished.
              </p>
            ) : null}
            {build?.room ? <BuildCard room={build.room} /> : null}
            {build?.room && build.room.stages.some((st) => st.output?.content.trim()) ? (
              <button
                type="button"
                className="room-pill room-pill-primary"
                onClick={() => downloadSavedDocuments(build.room!, missionId)}
              >
                Download saved documents
              </button>
            ) : build?.room ? (
              <p className="room-output-note">
                No charter, PRD or other stage document is saved yet. Each file appears here when
                its stage finishes, labelled simulated draft or model.
              </p>
            ) : null}
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
  downloads,
}: {
  mission: SupervisedMission;
  panels: CaseRoomPanels;
  build?: CaseRoomBuild;
  /** Decision pack and archive controls, when the case has something to save. */
  downloads?: ReactNode;
}) {
  const model = buildRoomModel(mission);
  const gate = build?.room?.gate ?? null;
  const buildState = build?.room?.state ?? null;
  const [panel, setPanel] = useState<Panel | null>(null);
  const explain = useExplainMode();
  const meetingsToReview = (mission.meetings ?? []).reduce(
    (n, m) => n + m.proposals.filter((p) => p.status === "proposed").length,
    0,
  );
  const investigation = model.beats.find(
    (b): b is Extract<RoomBeat, { kind: "investigation" }> => b.kind === "investigation",
  );

  // Close the sheet once the step it was opened for is done (the record moved on).
  const [openedFor, setOpenedFor] = useState<string | null>(null);
  useEffect(() => {
    if (
      panel &&
      panel !== "ask" &&
      // Reviewing meeting items changes the record on every click; keep that sheet open.
      panel !== "meetings" &&
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

  const dockWaiting = Boolean(gate) || (model.next.waitingOnYou && buildState !== "done");
  const dockStatusLabel = dockWaiting
    ? "Aria needs you"
    : buildState === "done" ||
        model.next.id === "completed" ||
        model.next.id === "follow_up_approved"
      ? "Completed"
      : buildState === "running"
        ? "The team is building"
        : model.next.label;
  const dockActions: RoomDockAction[] = [
    { id: "ask", label: "Ask Aria", onClick: () => open("ask") },
    {
      id: "meetings",
      label: "Meeting notes",
      ...(meetingsToReview > 0 ? { count: meetingsToReview } : {}),
      onClick: () => open("meetings"),
    },
  ];
  if (gate) {
    dockActions.push({
      id: "gate",
      label: `Review: ${gate.title.charAt(0).toLowerCase()}${gate.title.slice(1)}`,
      primary: true,
      onClick: () => open("gate"),
    });
  }
  if (model.deliveryAvailable) {
    dockActions.push({
      id: "delivery",
      label: "Begin delivery",
      primary: true,
      onClick: () => open("delivery"),
    });
  }
  if (build?.stalled && build.onContinue) {
    dockActions.push({
      id: "continue",
      label: "Continue the build",
      primary: true,
      onClick: build.onContinue,
    });
  }
  if (build?.room && build.room.stages.some((stage) => stage.output?.content.trim())) {
    const room = build.room;
    dockActions.push({
      id: "saved",
      label: "Download saved documents",
      primary: true,
      onClick: () => downloadSavedDocuments(room, mission.id),
    });
  }
  const nextPanel = model.next.panel;
  if (nextPanel !== "none" && model.next.waitingOnYou) {
    dockActions.push({
      id: "next",
      label: model.next.label,
      primary: !(model.deliveryAvailable || gate),
      onClick: () => open(nextPanel),
    });
  }
  const peekId =
    dockActions.find((action) => action.id === "gate")?.id ??
    dockActions.find((action) => action.id === "next")?.id ??
    dockActions.find((action) => action.id === "delivery")?.id ??
    dockActions.find((action) => action.id === "continue")?.id ??
    dockActions.find((action) => action.primary)?.id;

  const ariaLine = investigation?.live
    ? "The team is on it. Give me a few minutes — you can leave; I’ll come back when the record updates."
    : investigation
      ? roomInvestigationLine(investigation, model.next)
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
              : buildState === "failed"
                ? "A stage failed, so later stages will not run. Documents saved before that can be downloaded."
                : buildState === "done" &&
                    model.next.id !== "completed" &&
                    model.next.id !== "follow_up_approved"
                  ? `The build is complete. Next: ${model.next.label}. Documents already saved can be downloaded.`
                  : buildState === "done" ||
                      model.next.id === "completed" ||
                      model.next.id === "follow_up_approved"
                    ? "Completed. Saved documents are ready to download."
                    : model.status.line}
        </p>
      </header>

      <ol className="room-thread">
        {beforeStage.map((beat, i) => (
          <Beat key={`${beat.kind}-${i}`} beat={beat} missionId={mission.id} />
        ))}
        {investigation ? (
          <Aria>
            <p>{ariaLine}</p>
            <RoomStage
              idea={model.stage.idea}
              findings={model.stage.findings}
              agents={model.stage.agents}
              live={investigation.live}
              missionId={mission.id}
              ariaLine={
                investigation.live
                  ? "Working on it. I’ll come back when something is saved."
                  : model.next.waitingOnYou
                    ? `Next: ${model.next.label}.`
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
            missionId={mission.id}
            onOpenWorkroom={() => open("workroom")}
          />
        ))}
      </ol>

      {toast ? (
        <p className="room-toast" role="status">
          <b>Aria is back.</b> {toast}
        </p>
      ) : null}

      <RoomDock
        missionId={mission.id}
        waiting={dockWaiting}
        statusLabel={dockStatusLabel}
        actions={dockActions}
        {...(peekId ? { peekId } : {})}
        {...(downloads ? { downloads } : {})}
      />

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
                      : panel === "meetings"
                        ? "Your notes, saved as written. You decide what joins the project."
                        : panel === "plan"
                          ? "Nothing runs until you approve."
                          : panel === "decide"
                            ? "Nothing proceeds until you save."
                            : "One thing Aria needs from you."}
            </SheetDescription>
          </SheetHeader>
          <div className="room-sheet-body">
            {explain.on && panel && PANEL_WHY[panel] ? (
              <p className="room-explain">
                <b>Why this matters</b> {PANEL_WHY[panel]}
                {PANEL_LESSON[panel] ? (
                  <>
                    {" "}
                    <Link
                      to="/learn/$lessonId"
                      params={{ lessonId: PANEL_LESSON[panel]! }}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Learn more
                    </Link>
                  </>
                ) : null}
              </p>
            ) : null}
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
            {panel === "meetings" ? panels.meetings : null}
            {panel === "workroom" && build?.workroom ? (
              <Workroom
                model={build.workroom}
                {...(gate ? { onReviewGate: () => setPanel("gate") } : {})}
              />
            ) : null}
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
