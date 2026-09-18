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

export const Route = createFileRoute("/_authenticated/workspace/interview")({
  head: () => ({
    meta: [
      { title: "Interview Lab — DeliverX Workspace" },
      {
        name: "description",
        content:
          "Practise interview answers against questions drawn from your own recorded work, with your own words and your own rating.",
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
      toast.success(`${r.questionCount} question drafts prepared from your record.`);
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const close = useMutation({
    mutationFn: (sessionId: string) => closeInterviewSession({ data: { sessionId } }),
    onSuccess: () => {
      toast.success("Session closed. Your answers stay saved.");
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <WorkspaceShell
      title="Interview Lab"
      subtitle="Questions are drafted from your recorded work only. Practising here never records evidence."
    >
      <div className="grid gap-5">
        <WorkspaceCard
          title="Start a practice session"
          description="Name the role you are preparing for. Questions are drawn from your judged capabilities and recorded evidence."
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
            Question drafts are AI-written and clearly labelled. Every answer is written by you.
          </p>
        </WorkspaceCard>

        {data.sessions.length ? (
          data.sessions.map((session) => (
            <WorkspaceCard
              key={session.id}
              title={`${session.roleTarget} · ${session.status === "open" ? "In progress" : "Closed"}`}
              description={`Started ${new Date(session.createdAt).toLocaleDateString("en-GB")}${
                session.focusCapabilityKey ? ` · focus ${session.focusCapabilityKey}` : ""
              }`}
              action={
                session.status === "open" ? (
                  <Button variant="outline" size="sm" onClick={() => close.mutate(session.id)}>
                    Close session
                  </Button>
                ) : undefined
              }
            >
              <div className="grid gap-4">
                {session.questions.map((question) => (
                  <QuestionBlock
                    key={question.id}
                    question={question}
                    readOnly={session.status !== "open"}
                    onSaved={invalidate}
                  />
                ))}
                {session.status === "open" ? (
                  <AddQuestion sessionId={session.id} onAdded={invalidate} />
                ) : null}
              </div>
            </WorkspaceCard>
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

function QuestionBlock({
  question,
  readOnly,
  onSaved,
}: {
  question: {
    id: string;
    prompt: string;
    origin: string;
    capabilityKey: string | null;
    answer: { id: string; body: string; selfRating: number | null } | null;
  };
  readOnly: boolean;
  onSaved: () => void;
}) {
  const [body, setBody] = useState(question.answer?.body ?? "");
  const [rating, setRating] = useState<number | null>(question.answer?.selfRating ?? null);

  const save = useMutation({
    mutationFn: () =>
      saveInterviewAnswer({ data: { questionId: question.id, body, selfRating: rating } }),
    onSuccess: () => {
      toast.success("Answer saved. It stays private to you.");
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="rounded-lg border p-4" style={{ borderColor: "var(--x-border)" }}>
      <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.12em]" style={{ color: "var(--x-slate-light)" }}>
        <span>{question.origin === "ai_draft" ? "AI draft question" : "Your question"}</span>
        {question.capabilityKey ? (
          <>
            <span>·</span>
            <span>{question.capabilityKey}</span>
          </>
        ) : null}
      </div>
      <p className="mt-2 text-[13px] font-semibold">{question.prompt}</p>
      <Textarea
        className="mt-3 min-h-28 text-xs"
        value={body}
        readOnly={readOnly}
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
            disabled={readOnly}
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
        {readOnly ? null : (
          <Button size="sm" onClick={() => save.mutate()} disabled={body.trim().length < 20 || save.isPending}>
            {save.isPending ? "Saving…" : "Save answer"}
          </Button>
        )}
      </div>
      <p className="mt-2 text-[11px]" style={{ color: "var(--x-slate-light)" }}>
        Your self-rating is practice only. It is never evidence and never affects your capability profile.
      </p>
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
