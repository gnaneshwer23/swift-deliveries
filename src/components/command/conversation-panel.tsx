import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { MessageSquare, Pencil, Trash2 } from "lucide-react";
import {
  deleteConversation,
  getConversation,
  recordVoiceMeasurement,
  sayToAssistant,
  startConversation,
  type ConversationState,
} from "@/lib/conversation.functions";
import type { MissionTarget, UnderstoodCard } from "@/lib/conversation/interpret";
import {
  DEFAULT_RETENTION_DAYS,
  RETENTION_DAYS,
  type ConversationTurn,
  type RetentionDays,
} from "@/lib/conversation/types";
import {
  cancelMission,
  createMission,
  pauseMission,
  resumeMission,
} from "@/lib/workforce.functions";
import { startSupervisedMission } from "@/lib/pilot-mission.functions";
import { commandCentreBootstrapQuery } from "@/lib/workforce-queries";
import { speak } from "@/lib/conversation/speech";
import { VoiceMeasurements } from "@/components/command/voice-measurements";
import { VoiceControls } from "@/components/command/voice-controls";
import { INTENT_LABELS, MISSION_INTENTS, type MissionIntent } from "@/lib/workforce/types";

const KEY = ["command", "conversation"];

const day = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

/**
 * Talk to DeliverX by typing. The assistant replies with what it understood;
 * every action it offers needs a click here, and it never approves anything.
 * Only the latest reply's actions are live, so an old card cannot be acted on
 * after the conversation has moved on.
 */
export function ConversationPanel({
  currentMissionId,
}: {
  /** The mission on screen, so "pause it" means this one. */
  currentMissionId?: string;
}) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: KEY, queryFn: () => getConversation() });
  const [retention, setRetention] = useState<RetentionDays>(DEFAULT_RETENTION_DAYS);
  const [text, setText] = useState("");
  /** The line being corrected, if any. */
  const [correcting, setCorrecting] = useState<string | null>(null);
  const [speakReplies, setSpeakReplies] = useState(true);
  /** A spoken turn is in flight: typing waits, so lines arrive in the order they were said. */
  const [voiceBusy, setVoiceBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const state = query.data;
  const conversation = state?.conversation ?? null;
  const turns = state?.turns ?? [];
  const lastReply = [...turns].reverse().find((t) => t.speaker === "assistant") ?? null;
  const fail = (fallback: string) => (e: unknown) =>
    setError(e instanceof Error ? e.message : fallback);

  const start = useMutation({
    mutationFn: () => startConversation({ data: { retentionDays: retention } }),
    onMutate: () => setError(null),
    onSuccess: (next) => queryClient.setQueryData(KEY, next),
    onError: fail("Could not start a conversation."),
  });

  const say = useMutation({
    mutationFn: (line: {
      text: string;
      input: "typed" | "edited" | "speech";
      /** For speech: time from Send to transcript, and when the line was sent on. */
      transcriptMs?: number;
      sentAt?: number;
      correctsTurnId?: string | null;
    }) =>
      sayToAssistant({
        data: {
          conversationId: conversation!.id,
          text: line.text,
          input: line.input,
          currentMissionId: currentMissionId ?? null,
          correctsTurnId: line.correctsTurnId ?? null,
        },
      }),
    onMutate: () => setError(null),
    onSuccess: ({ said, reply }, line) => {
      queryClient.setQueryData<ConversationState>(KEY, (prev) =>
        prev ? { ...prev, turns: [...prev.turns, said, reply] } : prev,
      );
      if (line.input === "speech") {
        // A spoken request gets a spoken reply: the same words as the written one.
        if (speakReplies) speak(reply.text);
        if (line.transcriptMs !== undefined && line.sentAt !== undefined)
          void recordVoiceMeasurement({
            data: {
              kind: "turn",
              turnId: said.id,
              transcriptMs: Math.round(line.transcriptMs),
              replyMs: Math.round(performance.now() - line.sentAt),
            },
          }).catch(() => undefined);
      } else {
        setText("");
        setCorrecting(null);
      }
      // Refetched for the new retention date and the server's window of lines.
      void queryClient.invalidateQueries({ queryKey: KEY });
    },
    onError: fail("Could not send that."),
  });

  const remove = useMutation({
    mutationFn: () => deleteConversation({ data: { conversationId: conversation!.id } }),
    onMutate: () => setError(null),
    onSuccess: () =>
      queryClient.setQueryData<ConversationState>(KEY, (prev) =>
        prev ? { ...prev, conversation: null, turns: [] } : prev,
      ),
    onError: fail("Could not delete the conversation."),
  });

  return (
    <section className="cc-panel" aria-labelledby="conversation-title">
      <h2 id="conversation-title" className="cc-panel-title flex items-center gap-2">
        <MessageSquare className="size-4" aria-hidden="true" /> Talk to DeliverX
      </h2>
      <p className="text-sm text-slate-600 mb-3">
        Describe a product objective for the supervised decision loop, ask how a mission is going,
        or ask to pause or cancel one. I reply with what I understood. Nothing happens until you
        click, and approvals are only given on the plan or gate itself. Voice will reuse this same
        path later.
      </p>

      {query.isError && !state ? (
        <p className="cc-error" role="alert">
          The conversation could not be loaded.
        </p>
      ) : state && !state.available ? (
        <p className="text-sm text-slate-600">
          Conversations become available once their database update is applied.
        </p>
      ) : !conversation ? (
        query.isPending ? null : (
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-sm">
              <span className="block font-medium mb-1">Keep the transcript for</span>
              <select
                className="cc-input"
                value={retention}
                onChange={(e) => setRetention(Number(e.target.value) as RetentionDays)}
              >
                {RETENTION_DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d === 1 ? "1 day" : `${d} days`} after the last message
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="cc-btn cc-btn-primary"
              disabled={start.isPending}
              onClick={() => start.mutate()}
            >
              {start.isPending ? "Starting…" : "Start a conversation"}
            </button>
          </div>
        )
      ) : (
        <>
          {state?.earlierTurns ? (
            <p className="text-xs text-slate-500 mb-2">
              {state.earlierTurns} earlier {state.earlierTurns === 1 ? "line is" : "lines are"} kept
              until the transcript is deleted, but not shown here.
            </p>
          ) : null}
          {turns.length ? (
            <ol className="space-y-2 mb-3" aria-label="Transcript">
              {turns.map((t) => (
                <TurnRow
                  key={t.id}
                  turn={t}
                  live={t.id === lastReply?.id}
                  currentMissionId={currentMissionId}
                  conversationId={conversation.id}
                  onCorrect={() => {
                    setText(t.text);
                    setCorrecting(t.id);
                  }}
                />
              ))}
            </ol>
          ) : null}

          <VoiceControls
            disabled={say.isPending}
            speakReplies={speakReplies}
            onSpeakRepliesChange={setSpeakReplies}
            onBusyChange={setVoiceBusy}
            onTranscript={(spoken, transcriptMs) =>
              say.mutate({
                text: spoken.slice(0, 4000),
                input: "speech",
                transcriptMs,
                sentAt: performance.now(),
              })
            }
          />
          {/* Shown whatever the voice settings, so past measurements stay readable. */}
          <VoiceMeasurements />

          <form
            className="space-y-2 mt-3"
            onSubmit={(ev) => {
              ev.preventDefault();
              if (text.trim())
                say.mutate(
                  correcting
                    ? { text, input: "edited", correctsTurnId: correcting }
                    : { text, input: "typed" },
                );
            }}
          >
            <label className="block text-sm font-medium" htmlFor="conversation-input">
              {correcting ? "Correct what you said" : "Message"}
            </label>
            <textarea
              id="conversation-input"
              className="cc-input cc-textarea"
              rows={3}
              maxLength={4000}
              value={text}
              disabled={say.isPending}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. Find out why parents give up before booking a first lesson"
            />
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="submit"
                className="cc-btn cc-btn-primary"
                disabled={say.isPending || voiceBusy || !text.trim()}
              >
                {say.isPending ? "Sending…" : correcting ? "Send correction" : "Send"}
              </button>
              {correcting ? (
                <button
                  type="button"
                  className="cc-btn"
                  onClick={() => {
                    setCorrecting(null);
                    setText("");
                  }}
                >
                  Cancel correction
                </button>
              ) : null}
            </div>
          </form>

          <p className="text-xs text-slate-500 mt-3 flex flex-wrap items-center gap-2">
            Text only; no audio is kept. This transcript is deleted on{" "}
            {day(conversation.retainUntil)} ({conversation.retentionDays}{" "}
            {conversation.retentionDays === 1 ? "day" : "days"} after the last message).
            <button
              type="button"
              className="cc-btn"
              disabled={remove.isPending}
              onClick={() => {
                if (window.confirm("Delete this conversation and its transcript now?"))
                  remove.mutate();
              }}
            >
              <Trash2 className="size-3" aria-hidden="true" /> Delete now
            </button>
          </p>
        </>
      )}

      {error ? (
        <p className="cc-error mt-2" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}

function TurnRow({
  turn,
  live,
  currentMissionId,
  conversationId,
  onCorrect,
}: {
  turn: ConversationTurn;
  live: boolean;
  currentMissionId: string | undefined;
  conversationId: string;
  onCorrect: () => void;
}) {
  if (turn.speaker === "founder")
    return (
      <li className="text-sm">
        <span className="font-medium">You</span>
        {turn.input === "edited" ? <span className="text-slate-500"> (corrected)</span> : null}
        {turn.input === "speech" ? <span className="text-slate-500"> (spoken)</span> : null}:{" "}
        {turn.text}{" "}
        <button type="button" className="cc-btn" onClick={onCorrect}>
          <Pencil className="size-3" aria-hidden="true" /> Correct
        </button>
      </li>
    );
  return (
    <li className="text-sm rounded border p-2" style={{ borderColor: "var(--x-border)" }}>
      <span className="font-medium">DeliverX</span>: {turn.text}
      {live ? (
        <CardActions
          card={turn.card}
          currentMissionId={currentMissionId}
          conversationId={conversationId}
        />
      ) : null}
    </li>
  );
}

function CardActions({
  card,
  currentMissionId,
  conversationId,
}: {
  card: UnderstoodCard;
  currentMissionId: string | undefined;
  conversationId: string;
}) {
  switch (card.kind) {
    case "draft_mission":
      return <DraftMissionCard card={card} conversationId={conversationId} />;
    case "pause":
    case "cancel":
    case "resume":
      return <ControlCard kind={card.kind} target={card.target} />;
    case "status":
    case "approval_refused": {
      // Each mission the request could mean, as a link: nothing here acts on it.
      const options = (
        "mission" in card.target ? [card.target.mission] : card.target.candidates
      ).filter((m) => m.id !== currentMissionId);
      return options.length ? (
        <p className="mt-2 flex flex-wrap gap-2">
          {options.map((m) => (
            <Link
              key={m.id}
              to="/command/missions/$missionId"
              params={{ missionId: m.id }}
              className="cc-btn"
            >
              Open “{m.title}”
            </Link>
          ))}
        </p>
      ) : null;
    }
    default:
      return null;
  }
}

/** The understood brief, editable, drafted only on a click once every check is ticked. */
function DraftMissionCard({
  card,
  conversationId,
}: {
  card: Extract<UnderstoodCard, { kind: "draft_mission" }>;
  conversationId: string;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const boot = useQuery(commandCentreBootstrapQuery).data;
  const projects = boot?.projects ?? [];
  // Build missions need a database update; offer them only where it is applied.
  const buildAvailable = boot?.features.productMission ?? false;
  const [intent, setIntent] = useState<MissionIntent>(card.intent);
  const [requestText, setRequestText] = useState(card.requestText);
  const [projectId, setProjectId] = useState(
    card.product.match === "named" || card.product.match === "only" ? card.product.projectId : "",
  );
  const [checked, setChecked] = useState<boolean[]>(card.confirm.map(() => false));
  const [error, setError] = useState<string | null>(null);
  const choices =
    card.product.match === "ambiguous"
      ? card.product.candidates
      : projects.length
        ? projects
        : card.product.match === "named" || card.product.match === "only"
          ? [{ id: card.product.projectId, name: card.product.name }]
          : [];

  const [path, setPath] = useState<"supervised" | "advanced">(
    intent === "investigate" || intent === "improve" ? "supervised" : "advanced",
  );

  const draft = useMutation({
    mutationFn: async () => {
      if (path === "supervised") {
        return {
          kind: "supervised" as const,
          mission: await startSupervisedMission({
            data: {
              question: requestText.trim().slice(0, 2000),
              audience:
                card.product.match === "named" || card.product.match === "only"
                  ? card.product.name
                  : "Product owner",
              outcome: "A decision pack and an experiment brief.",
              constraints: `From Talk-to-DeliverX (${INTENT_LABELS[intent]}). Conversation ${conversationId}.`,
              researchMode: "provided",
            },
          }),
        };
      }
      // Advanced workforce planner — still requires a click; never auto-approves.
      const bundle = await createMission({
        data: {
          ...(card.product.match === "new" ? { newProjectName: "First project" } : { projectId }),
          intent,
          requestText: requestText.trim(),
          conversationId,
        },
      });
      return { kind: "advanced" as const, bundle };
    },
    onMutate: () => setError(null),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["command"] });
      await queryClient.invalidateQueries({ queryKey: ["supervised"] });
      if (result.kind === "supervised") {
        void navigate({
          to: "/command/supervised/$missionId",
          params: { missionId: result.mission.mission.id },
        });
        return;
      }
      void navigate({
        to: "/command/missions/$missionId",
        params: { missionId: result.bundle.mission.id },
      });
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Could not draft the mission."),
  });

  const buildBlocked = path === "advanced" && intent === "build" && !buildAvailable;
  const ready =
    requestText.trim().length >= (path === "supervised" ? 8 : 3) &&
    (path === "supervised" || card.product.match === "new" || Boolean(projectId)) &&
    checked.every(Boolean) &&
    !buildBlocked;

  return (
    <div className="mt-2 space-y-2">
      <fieldset>
        <legend className="font-medium">Path</legend>
        <label className="flex items-start gap-2">
          <input
            type="radio"
            name="talk-path"
            checked={path === "supervised"}
            onChange={() => setPath("supervised")}
          />
          <span>
            Supervised decision loop (default) — small specialist team, decision pack, human gates
          </span>
        </label>
        <label className="flex items-start gap-2">
          <input
            type="radio"
            name="talk-path"
            checked={path === "advanced"}
            onChange={() => setPath("advanced")}
          />
          <span>Advanced workforce planner — discovery, prototype or build missions</span>
        </label>
      </fieldset>
      {path === "advanced" ? (
        <label className="block">
          <span className="block font-medium">Mission type</span>
          <select
            className="cc-input"
            value={intent}
            onChange={(e) => setIntent(e.target.value as MissionIntent)}
          >
            {MISSION_INTENTS.map((i) => (
              <option key={i} value={i} disabled={i === "build" && !buildAvailable}>
                {INTENT_LABELS[i]}
                {i === "build" && !buildAvailable ? " (not enabled in this workspace yet)" : ""}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {buildBlocked ? (
        <p className="cc-error">
          Product builds are not enabled in this workspace yet. Choose another mission type.
        </p>
      ) : null}
      {path === "advanced" ? (
        card.product.match === "new" ? (
          <p>Product: a new one, “First project”, is created with the mission.</p>
        ) : (
          <label className="block">
            <span className="block font-medium">Product</span>
            <select
              className="cc-input"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            >
              <option value="">Choose a product…</option>
              {choices.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        )
      ) : null}
      <label className="block">
        <span className="block font-medium">
          {path === "supervised" ? "Product question" : "Brief"}
        </span>
        <textarea
          className="cc-input cc-textarea"
          rows={3}
          maxLength={path === "supervised" ? 2000 : 4000}
          value={requestText}
          onChange={(e) => {
            setRequestText(e.target.value);
            // A changed brief must be confirmed again: the ticks were for the earlier text.
            setChecked((prev) => prev.map(() => false));
          }}
        />
      </label>
      {card.confirm.length ? (
        <fieldset>
          <legend className="font-medium">Confirm in writing before drafting</legend>
          {card.confirm.map((c, i) => (
            <label key={c} className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={checked[i] ?? false}
                onChange={(e) =>
                  setChecked((prev) => prev.map((v, j) => (j === i ? e.target.checked : v)))
                }
              />
              <span>{c} is right (correct the brief above if not)</span>
            </label>
          ))}
        </fieldset>
      ) : null}
      {error ? (
        <p className="cc-error" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        className="cc-btn cc-btn-primary"
        disabled={!ready || draft.isPending}
        onClick={() => draft.mutate()}
      >
        {draft.isPending
          ? "Drafting…"
          : path === "supervised"
            ? "Save supervised brief →"
            : "Draft mission plan →"}
      </button>
      <p className="text-xs text-slate-500">
        {path === "supervised"
          ? "Saving creates a supervised mission. Specialist work waits for your plan approval."
          : "Drafting a plan does not record usage. Execution waits for your approval of the plan."}
      </p>
    </div>
  );
}

const CONTROL_LABEL = { pause: "Pause", cancel: "Cancel", resume: "Resume" } as const;
const CONTROL_DONE = { pause: "Paused", cancel: "Cancelled", resume: "Resumed" } as const;

/** A pause, cancel or resume request: runs only when this button is clicked. */
function ControlCard({
  kind,
  target,
}: {
  kind: "pause" | "cancel" | "resume";
  target: MissionTarget;
}) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const act = useMutation({
    mutationFn: (missionId: string) => {
      const fn =
        kind === "pause" ? pauseMission : kind === "cancel" ? cancelMission : resumeMission;
      return fn({ data: { missionId } });
    },
    onMutate: () => setError(null),
    onSuccess: async (bundle) => {
      setDone(`${CONTROL_DONE[kind]} “${bundle.mission.title}”.`);
      await queryClient.invalidateQueries({ queryKey: ["command"] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : "That did not work."),
  });
  // A mission that cannot take the request gets no button; the reply says why.
  if (target.match === "ineligible") return null;
  const options = "mission" in target ? [target.mission] : target.candidates;
  if (done) return <p className="mt-2">{done}</p>;
  if (!options.length)
    return <p className="mt-2">No mission can be {CONTROL_DONE[kind].toLowerCase()} right now.</p>;
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {options.map((m) => (
        <button
          key={m.id}
          type="button"
          className="cc-btn cc-btn-secondary"
          disabled={act.isPending}
          onClick={() => {
            if (kind === "cancel" && !window.confirm(`Cancel “${m.title}”? This cannot be undone.`))
              return;
            act.mutate(m.id);
          }}
        >
          {CONTROL_LABEL[kind]} “{m.title}”
        </button>
      ))}
      {error ? (
        <p className="cc-error w-full" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
