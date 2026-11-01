/**
 * Meeting notes → proposed tasks. The owner pastes notes from a meeting they held; the
 * rule-based reader proposes items; the owner accepts or dismisses each one. Accepted items
 * form the project's backlog — agents don't start them until they are added to a plan.
 */
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { AgentAvatar } from "@/components/command/agent-avatar";
import {
  addSupervisedMeetingNotes,
  decideSupervisedMeetingProposal,
  removeSupervisedMeetingNotes,
} from "@/lib/pilot-mission.functions";
import {
  acceptedFromMeetings,
  MEETING_KIND_LABEL,
  MEETING_NOTES_MAX_CHARS,
  ownerLabel,
  type MeetingNote,
  type MeetingProposal,
} from "@/lib/pilot-mission/meeting-notes";
import type { SupervisedMission } from "@/lib/pilot-mission/types";

const lineId = (meetingId: string, line: number) => `${meetingId}-line-${line}`;

type Props = {
  mission: SupervisedMission;
  onDone: () => Promise<void>;
};

function Owner({ p }: { p: MeetingProposal }) {
  return p.owner.kind === "you" ? (
    <span className="mtg-owner">
      <span className="room-build-you" style={{ width: 22, height: 22 }} aria-hidden="true">
        You
      </span>
      You
    </span>
  ) : (
    <span className="mtg-owner">
      <AgentAvatar name={p.owner.name} role={p.owner.name} size={22} />
      {p.owner.name}
    </span>
  );
}

function AddNotes({ mission, onDone }: Props) {
  const [title, setTitle] = useState("");
  const [heldOn, setHeldOn] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const save = useMutation({
    mutationFn: () =>
      addSupervisedMeetingNotes({
        data: {
          id: mission.id,
          expectedVersion: mission.version,
          title,
          heldOn: heldOn || null,
          notes,
        },
      }),
    onSuccess: async () => {
      setTitle("");
      setHeldOn("");
      setNotes("");
      setError(null);
      await onDone();
    },
    onError: async (e) => {
      setError(e instanceof Error ? e.message : "The notes could not be saved.");
      await onDone();
    },
  });
  return (
    <form
      className="mtg-add"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <div className="mtg-add-row">
        <label>
          Meeting
          <input
            value={title}
            maxLength={120}
            placeholder="e.g. Call with two bakery owners"
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label>
          Held on
          <input type="date" value={heldOn} onChange={(e) => setHeldOn(e.target.value)} />
        </label>
      </div>
      <label>
        Your notes
        <textarea
          rows={7}
          maxLength={MEETING_NOTES_MAX_CHARS}
          value={notes}
          placeholder={
            "- Action: draft interview questions for five more owners\n- Decision: start with bakeries\n- Who signs off on supplier changes?"
          }
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>
      <p className="plan-hint">
        Paste notes from a meeting you held. They are saved exactly as written and read by a
        rule-based notes reader, so nothing is sent to an AI model. Lines starting with “Action:”,
        “Decision:” or ending in “?” are picked up best.
      </p>
      {error ? (
        <p className="plan-error" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        className="room-pill room-pill-primary"
        disabled={save.isPending || notes.trim().length < 10 || mission.stage === "cancelled"}
      >
        {save.isPending ? "Reading…" : "Find tasks in these notes"}
      </button>
    </form>
  );
}

function Meeting({ mission, meeting, onDone }: Props & { meeting: MeetingNote }) {
  const [error, setError] = useState<string | null>(null);
  const decide = useMutation({
    mutationFn: (input: { proposalId: string; decision: MeetingProposal["status"] }) =>
      decideSupervisedMeetingProposal({
        data: {
          id: mission.id,
          expectedVersion: mission.version,
          meetingId: meeting.id,
          ...input,
        },
      }),
    onSuccess: async () => {
      setError(null);
      await onDone();
    },
    onError: async (e) => {
      setError(e instanceof Error ? e.message : "That change could not be saved.");
      await onDone();
    },
  });
  const remove = useMutation({
    mutationFn: () =>
      removeSupervisedMeetingNotes({
        data: { id: mission.id, expectedVersion: mission.version, meetingId: meeting.id },
      }),
    onSuccess: onDone,
    onError: async (e) => {
      setError(e instanceof Error ? e.message : "The notes could not be removed.");
      await onDone();
    },
  });
  const busy = decide.isPending || remove.isPending;
  const [notesOpen, setNotesOpen] = useState(false);
  const [highlight, setHighlight] = useState<number | null>(null);
  const showLine = (line: number) => {
    setNotesOpen(true);
    setHighlight(line);
    requestAnimationFrame(() =>
      document.getElementById(lineId(meeting.id, line))?.scrollIntoView({ block: "center" }),
    );
  };
  const waiting = meeting.proposals.filter((p) => p.status === "proposed").length;

  return (
    <section className="mtg-meeting" aria-label={meeting.title}>
      <header>
        <div>
          <b>{meeting.title}</b>
          <span>
            {meeting.heldOn ? `Held ${meeting.heldOn} · ` : ""}
            {meeting.proposals.length} found{waiting ? ` · ${waiting} to review` : ""}
          </span>
        </div>
        <button
          type="button"
          className="room-pill"
          disabled={busy}
          onClick={() => {
            if (window.confirm("Remove these notes and everything found in them?")) remove.mutate();
          }}
        >
          Remove notes
        </button>
      </header>
      {meeting.proposals.length ? (
        <ul className="mtg-list">
          {meeting.proposals.map((p) => (
            <li key={p.id} data-status={p.status}>
              <div className="mtg-item">
                <span className="mtg-kind" data-kind={p.kind}>
                  {MEETING_KIND_LABEL[p.kind]}
                </span>
                <p>{p.text}</p>
                <span className="mtg-meta">
                  <Owner p={p} />
                  <button
                    type="button"
                    className="mtg-line-link"
                    aria-label={`Show line ${p.line} of your notes`}
                    onClick={() => showLine(p.line)}
                  >
                    line {p.line}
                  </button>
                </span>
              </div>
              <div className="mtg-actions">
                {p.status === "proposed" ? (
                  <>
                    <button
                      type="button"
                      className="room-pill room-pill-primary"
                      disabled={busy}
                      onClick={() => decide.mutate({ proposalId: p.id, decision: "accepted" })}
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      className="room-pill"
                      disabled={busy}
                      onClick={() => decide.mutate({ proposalId: p.id, decision: "dismissed" })}
                    >
                      Dismiss
                    </button>
                  </>
                ) : (
                  <>
                    <span className="mtg-status">
                      {p.status === "accepted" ? "Accepted" : "Dismissed"}
                    </span>
                    <button
                      type="button"
                      className="mtg-undo"
                      disabled={busy}
                      onClick={() => decide.mutate({ proposalId: p.id, decision: "proposed" })}
                    >
                      Undo
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="wr-empty">
          Nothing to propose in these notes. Try lines like “Action: …”, “Decision: …” or a
          question.
        </p>
      )}
      {error ? (
        <p className="plan-error" role="alert">
          {error}
        </p>
      ) : null}
      <details
        className="mtg-notes"
        open={notesOpen}
        onToggle={(e) => setNotesOpen((e.currentTarget as HTMLDetailsElement).open)}
      >
        <summary>Your notes as saved</summary>
        <ol className="mtg-lines">
          {meeting.notes.split(/\r?\n/).map((text, i) => (
            <li
              key={i}
              id={lineId(meeting.id, i + 1)}
              data-hl={highlight === i + 1 ? "true" : undefined}
            >
              {text}
            </li>
          ))}
        </ol>
      </details>
    </section>
  );
}

export function MeetingNotesPanel({ mission, onDone }: Props) {
  const meetings = mission.meetings ?? [];
  const backlog = acceptedFromMeetings(meetings);
  return (
    <div className="plan mtg">
      {backlog.length ? (
        <section className="mtg-backlog" aria-label="Backlog from your meetings">
          <span className="room-mono">Backlog from your meetings · {backlog.length}</span>
          <ul>
            {backlog.map((p) => (
              <li key={p.id}>
                <span className="mtg-kind" data-kind={p.kind}>
                  {MEETING_KIND_LABEL[p.kind]}
                </span>
                {p.text}
                <span className="mtg-meta">
                  <Owner p={p} />
                </span>
              </li>
            ))}
          </ul>
          <p className="plan-hint">
            Accepted items stay on this project and in its download. The team doesn’t start them
            until you add them to a plan.
          </p>
        </section>
      ) : null}
      {[...meetings].reverse().map((m) => (
        <Meeting key={m.id} mission={mission} meeting={m} onDone={onDone} />
      ))}
      <section aria-label="Add meeting notes">
        <span className="room-mono">
          {meetings.length ? "Add another meeting" : "Add a meeting"}
        </span>
        <AddNotes mission={mission} onDone={onDone} />
      </section>
    </div>
  );
}
