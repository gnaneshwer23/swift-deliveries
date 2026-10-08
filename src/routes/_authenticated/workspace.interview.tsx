import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { WorkspaceCard, WorkspaceShell } from "@/components/workspace/workspace-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { interviewLabQuery } from "@/lib/career-queries";
import {
  addInterviewQuestion,
  closeInterviewSession,
  createInterviewSession,
  saveInterviewAnswer,
} from "@/lib/career.functions";
import {
  CLAIM_STATUS_HINTS,
  CLAIM_STATUS_LABELS,
  recurringStrengths,
  summarisePracticeHistory,
  type ClaimStatus,
} from "@/lib/interview-practice";

type Lab = Awaited<ReturnType<typeof import("@/lib/career.functions").getInterviewLab>>;
type Session = Lab["sessions"][number];
type Question = Session["questions"][number];

export const Route = createFileRoute("/_authenticated/workspace/interview")({
  head: () => ({
    meta: [
      { title: "Interview Lab — DeliverX Workspace" },
      {
        name: "description",
        content:
          "Practise interview answers against questions drawn from your own recorded work, with a record check on every claim you make.",
      },
      { property: "og:title", content: "Interview Lab — DeliverX Workspace" },
      { property: "og:description", content: "Questions from your evidence record. Answers stay yours." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(interviewLabQuery),
  component: InterviewLabPage,
});

function InterviewLabPage() {
  const { data } = useSuspenseQuery(interviewLabQuery);
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["interview-lab"] });

  const [roleTarget, setRoleTarget] = useState("");
  const [focus, setFocus] = useState("");

  const start = useMutation({
    mutationFn: () =>
      createInterviewSession({
        data: { roleTarget, focusCapabilityKey: focus || null },
      }),
    onSuccess: (r) => {
      setRoleTarget("");
      setFocus("");
      toast.success(`${r.questionCount} questions prepared from your record.`);
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const close = useMutation({
    mutationFn: (sessionId: string) => closeInterviewSession({ data: { sessionId } }),
    onSuccess: (r) => {
      toast.success(
        r.feedbackCount
          ? `Session closed. Practice feedback is ready across ${r.feedbackCount} dimensions.`
          : "Session closed. Your answers stay saved.",
      );
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <WorkspaceShell
      title="Interview Lab"
      subtitle="The AI interviews you on your own record. Every claim you make gets a record check. Practice never becomes evidence."
    >
      <div className="grid gap-5">
        <WorkspaceCard
          title="Start a practice session"
          description="Name the role you are preparing for. Questions are drawn from your strongest and weakest recorded work."
        >
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <label className="grid gap-1 text-xs">
              Target role
              <Input
                value={roleTarget}
                onChange={(e) => setRoleTarget(e.target.value)}
                placeholder="Product Manager, B2B SaaS"
              />
            </label>
            <label className="grid gap-1 text-xs">
              Focus capability (optional)
              <select
                className="h-9 rounded-md border bg-transparent px-2 text-xs"
                style={{ borderColor: "var(--x-border)" }}
                value={focus}
                onChange={(e) => setFocus(e.target.value)}
              >
                <option value="">Any judged capability</option>
                {data.capabilities.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.key} — level {c.level}
                  </option>
                ))}
              </select>
            </label>
            <Button
              onClick={() => start.mutate()}
              disabled={roleTarget.trim().length < 2 || start.isPending}
            >
              {start.isPending ? "Preparing…" : "Prepare questions"}
            </Button>
          </div>
          <p className="mt-3 text-xs" style={{ color: "var(--x-slate-light)" }}>
            Questions are AI-written drafts grounded in your record. Every answer is written by you and freezes at submit.
          </p>
        </WorkspaceCard>

        <PracticeHistory sessions={data.sessions} />

        {data.sessions.length ? (
          data.sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onClose={() => close.mutate(session.id)}
              closing={close.isPending}
              onChanged={invalidate}
            />
          ))
        ) : (
          <WorkspaceCard
            title="No practice sessions yet"
            description="Interview Lab needs recorded work. Complete an Experience task or submit a workspace artefact, then start a session."
          />
        )}
      </div>
    </WorkspaceShell>
  );
}

function PracticeHistory({ sessions }: { sessions: Session[] }) {
  const closed = sessions.filter((s) => s.status === "closed");
  const history = summarisePracticeHistory(
    closed.map((s) => ({
      id: s.id,
      roleTarget: s.roleTarget,
      closedAt: s.closedAt,
      feedback: s.feedback.map((f) => ({ dimension: f.dimension, score: f.score })),
    })),
  );
  if (!history.length) return null;
  const strengths = recurringStrengths(history);

  return (
    <WorkspaceCard
      title="Practice history"
      description={`Your rubric scores across ${closed.length} closed session${closed.length === 1 ? "" : "s"}. Practice-level only — this never touches your capability profile.`}
    >
      <div className="grid gap-3">
        {history.map((d) => (
          <div key={d.dimension}>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold capitalize">{d.dimension.replace(/_/g, " ")}</span>
              <span style={{ color: "var(--x-slate-light)" }}>
                avg {d.average.toFixed(1)} of 5 · {d.sessions} session{d.sessions === 1 ? "" : "s"} ·{" "}
                {d.trend === "improving" ? "↑ improving" : d.trend === "declining" ? "↓ declining" : "steady"}
              </span>
            </div>
            <div className="mt-1 h-1.5 rounded-full" style={{ background: "var(--x-surface)" }}>
              <div
                className="h-1.5 rounded-full"
                style={{ width: `${(d.average / 5) * 100}%`, background: "var(--x-amber, #b97a1a)" }}
              />
            </div>
          </div>
        ))}
        {strengths.length ? (
          <p className="text-xs" style={{ color: "var(--x-slate)" }}>
            Recurring strengths:{" "}
            <span className="font-semibold">
              {strengths.map((s) => s.dimension.replace(/_/g, " ")).join(", ")}
            </span>{" "}
            — these hold up session after session. Lead with them.
          </p>
        ) : (
          <p className="text-xs" style={{ color: "var(--x-slate-light)" }}>
            No recurring strengths yet — a dimension counts once it averages 4+ across at least two closed sessions.
          </p>
        )}
      </div>
    </WorkspaceCard>
  );
}

function SessionCard({
  session,
  onClose,
  closing,
  onChanged,
}: {
  session: Session;
  onClose: () => void;
  closing: boolean;
  onChanged: () => void;
}) {
  const open = session.status === "open";
  const answered = session.questions.filter((q) => q.answer);
  const current = open ? session.questions.find((q) => !q.answer) : undefined;

  return (
    <WorkspaceCard
      title={`${session.roleTarget} · ${open ? "In progress" : "Closed"}`}
      description={`Started ${new Date(session.createdAt).toLocaleDateString("en-GB")}${
        session.focusCapabilityKey ? ` · focus ${session.focusCapabilityKey}` : ""
      } · ${answered.length} of ${session.questions.length} answered`}
      action={
        open ? (
          <Button variant="outline" size="sm" onClick={onClose} disabled={closing}>
            {closing ? "Scoring…" : "End session & get feedback"}
          </Button>
        ) : undefined
      }
    >
      <div className="grid gap-4">
        {open && current ? (
          <AnswerBox key={current.id} question={current} onSaved={onChanged} />
        ) : null}

        {answered.length ? (
          <div className="grid gap-3">
            {answered.map((question) => (
              <AnsweredBlock key={question.id} question={question} />
            ))}
          </div>
        ) : null}

        {open ? <AddQuestion sessionId={session.id} onAdded={onChanged} /> : null}

        {!open && session.feedback.length ? (
          <div className="rounded-lg border p-4" style={{ borderColor: "var(--x-border)" }}>
            <p className="text-[10px] uppercase tracking-[0.12em]" style={{ color: "var(--x-slate-light)" }}>
              Practice feedback · scored against pm-core@2026.1 · AI-observed
            </p>
            <div className="mt-3 grid gap-3">
              {session.feedback.map((f) => (
                <div key={f.dimension}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold capitalize">{f.dimension.replace(/_/g, " ")}</span>
                    <span style={{ color: "var(--x-slate-light)" }}>{f.score} of 5</span>
                  </div>
                  <p className="mt-1 text-xs" style={{ color: "var(--x-slate)" }}>
                    {f.rationale}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px]" style={{ color: "var(--x-slate-light)" }}>
              This is practice feedback observed by AI. It is never evidence and never affects your capability profile.
            </p>
          </div>
        ) : null}
      </div>
    </WorkspaceCard>
  );
}

function AnswerBox({ question, onSaved }: { question: Question; onSaved: () => void }) {
  const [body, setBody] = useState("");
  const [rating, setRating] = useState<number | null>(null);

  const save = useMutation({
    mutationFn: () =>
      saveInterviewAnswer({ data: { questionId: question.id, body, selfRating: rating } }),
    onSuccess: (r) => {
      toast.success(
        r.followUpAdded
          ? "Answer frozen. The interviewer has a follow-up for you."
          : `Answer frozen. ${r.claimCount} claim${r.claimCount === 1 ? "" : "s"} checked against your record.`,
      );
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="rounded-lg border p-4" style={{ borderColor: "var(--x-border)" }}>
      <QuestionMeta question={question} />
      <p className="mt-2 text-[13px] font-semibold">{question.prompt}</p>
      {question.sourceEvidence ? (
        <p className="mt-2 rounded-md bg-[var(--x-surface)] p-2 text-[11px]" style={{ color: "var(--x-slate)" }}>
          From your record: {question.sourceEvidence.summary}
        </p>
      ) : null}
      <Textarea
        className="mt-3 min-h-28 text-xs"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Answer in your own words: context, the decision you owned, what you produced, what happened."
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs">
          How well did that land?
          <select
            className="h-8 rounded-md border bg-transparent px-2 text-xs"
            style={{ borderColor: "var(--x-border)" }}
            value={rating ?? ""}
            onChange={(e) => setRating(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Not rated</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n} of 5
              </option>
            ))}
          </select>
        </label>
        <Button size="sm" onClick={() => save.mutate()} disabled={body.trim().length < 20 || save.isPending}>
          {save.isPending ? "Checking against your record…" : "Submit answer"}
        </Button>
      </div>
      <p className="mt-2 text-[11px]" style={{ color: "var(--x-slate-light)" }}>
        Submitting freezes your answer — it cannot be edited afterwards. Your self-rating is practice only.
      </p>
    </div>
  );
}

function AnsweredBlock({ question }: { question: Question }) {
  const answer = question.answer!;
  return (
    <div className="rounded-lg border p-4" style={{ borderColor: "var(--x-border)" }}>
      <QuestionMeta question={question} />
      <p className="mt-2 text-[13px] font-semibold">{question.prompt}</p>
      <p className="mt-2 whitespace-pre-wrap text-xs" style={{ color: "var(--x-slate)" }}>
        {answer.body}
      </p>
      {answer.claims.length ? (
        <div className="mt-3 grid gap-2">
          <p className="text-[10px] uppercase tracking-[0.12em]" style={{ color: "var(--x-slate-light)" }}>
            Record check
          </p>
          {answer.claims.map((claim) => (
            <ClaimRow key={claim.id} claim={claim} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ClaimRow({ claim }: { claim: NonNullable<Question["answer"]>["claims"][number] }) {
  const status = claim.supportStatus as ClaimStatus;
  const label = CLAIM_STATUS_LABELS[status] ?? claim.supportStatus;
  const hint = CLAIM_STATUS_HINTS[status];
  const tone =
    status === "supported"
      ? "var(--x-green, #2f7d4f)"
      : status === "contradicted"
        ? "var(--x-red, #b4433a)"
        : "var(--x-amber, #b97a1a)";
  return (
    <div className="rounded-md border p-2 text-xs" style={{ borderColor: "var(--x-border)" }}>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
          style={{ color: tone, border: `1px solid ${tone}` }}
        >
          {label}
        </span>
        <span className="text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--x-slate-light)" }}>
          {claim.claimType}
        </span>
      </div>
      <p className="mt-1">“{claim.claimText}”</p>
      {hint ? (
        <p className="mt-1 text-[11px]" style={{ color: "var(--x-slate-light)" }}>
          {hint}
        </p>
      ) : null}
      {claim.recordExcerpt ? (
        <p className="mt-1 rounded bg-[var(--x-surface)] p-1.5 text-[11px]" style={{ color: "var(--x-slate)" }}>
          Record: {claim.recordExcerpt}
        </p>
      ) : null}
    </div>
  );
}

function QuestionMeta({ question }: { question: Question }) {
  return (
    <div
      className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.12em]"
      style={{ color: "var(--x-slate-light)" }}
    >
      <span>
        {question.origin === "ai_followup"
          ? `Follow-up · depth ${question.depth}`
          : question.origin === "ai_draft"
            ? "AI draft question"
            : "Your question"}
      </span>
      <span>·</span>
      <span>{question.questionType}</span>
      {question.capabilityKey ? (
        <>
          <span>·</span>
          <span>{question.capabilityKey}</span>
        </>
      ) : null}
    </div>
  );
}

function AddQuestion({ sessionId, onAdded }: { sessionId: string; onAdded: () => void }) {
  const [prompt, setPrompt] = useState("");
  const add = useMutation({
    mutationFn: () => addInterviewQuestion({ data: { sessionId, prompt } }),
    onSuccess: () => {
      setPrompt("");
      toast.success("Question added.");
      onAdded();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
      <label className="grid gap-1 text-xs">
        Add your own question
        <Input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="A question you expect to be asked" />
      </label>
      <Button variant="outline" onClick={() => add.mutate()} disabled={prompt.trim().length < 10 || add.isPending}>
        Add question
      </Button>
    </div>
  );
}
