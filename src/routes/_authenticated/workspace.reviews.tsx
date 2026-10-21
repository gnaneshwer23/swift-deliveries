import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { WorkspaceCard, WorkspaceShell } from "@/components/workspace/workspace-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { performanceReviewQuery } from "@/lib/career-queries";
import {
  createPerformanceReview,
  decidePerformanceReview,
  submitPerformanceReview,
  updatePerformanceReview,
} from "@/lib/career.functions";

export const Route = createFileRoute("/_authenticated/workspace/reviews")({
  head: () => ({
    meta: [
      { title: "Performance review — DeliverX Workspace" },
      {
        name: "description",
        content: "Write a self-assessment for a period of work, send it for human review, and keep the written outcome on record.",
      },
      { property: "og:title", content: "Performance review — DeliverX Workspace" },
      { property: "og:description", content: "Self-assessment plus a written human decision." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(performanceReviewQuery),
  component: ReviewsPage,
});

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft — not sent",
  submitted: "Awaiting human review",
  reviewed: "Reviewed",
};

function ReviewsPage() {
  const { data } = useSuspenseQuery(performanceReviewQuery);
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["performance-reviews"] });

  const [periodLabel, setPeriodLabel] = useState("");
  const [selfSummary, setSelfSummary] = useState("");

  const create = useMutation({
    mutationFn: () => createPerformanceReview({ data: { periodLabel, selfSummary } }),
    onSuccess: () => {
      setPeriodLabel("");
      setSelfSummary("");
      toast.success("Draft saved. Nothing is sent until you submit it.");
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submit = useMutation({
    mutationFn: (id: string) => submitPerformanceReview({ data: { id } }),
    onSuccess: () => {
      toast.success("Sent for human review.");
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <WorkspaceShell
      title="Performance review"
      subtitle="A written self-assessment and a written human decision. Reviews never light a Verified signal on their own."
    >
      <div className="grid gap-5">
        <WorkspaceCard
          title="Start a review"
          description="Describe the period in your own words: what you owned, what you decided, what changed."
        >
          <div className="grid gap-3">
            <label className="grid gap-1 text-xs">
              Period
              <Input value={periodLabel} onChange={(e) => setPeriodLabel(e.target.value)} placeholder="Sprint 4, or Q3 2026" />
            </label>
            <label className="grid gap-1 text-xs">
              Self-assessment
              <Textarea
                className="min-h-32 text-xs"
                value={selfSummary}
                onChange={(e) => setSelfSummary(e.target.value)}
                placeholder="What you owned, the decisions you made, the artefacts you produced, and what you would change."
              />
            </label>
            <Button
              className="justify-self-start"
              onClick={() => create.mutate()}
              disabled={periodLabel.trim().length < 2 || selfSummary.trim().length < 40 || create.isPending}
            >
              Save draft
            </Button>
          </div>
        </WorkspaceCard>

        <WorkspaceCard title={`Your reviews (${data.mine.length})`}>
          {data.mine.length ? (
            <ul className="grid gap-3">
              {data.mine.map((r) => (
                <li key={r.id} className="rounded-lg border p-4" style={{ borderColor: "var(--x-border)" }}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[13px] font-semibold">{r.periodLabel}</p>
                    <span className="text-[10px] uppercase tracking-[0.12em]" style={{ color: "var(--x-slate-light)" }}>
                      {STATUS_LABEL[r.status] ?? r.status}
                    </span>
                  </div>
                  {r.status === "draft" ? (
                    <DraftEditor review={r} onSaved={invalidate} onSubmit={() => submit.mutate(r.id)} />
                  ) : (
                    <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed" style={{ color: "var(--x-slate-light)" }}>
                      {r.selfSummary}
                    </p>
                  )}
                  {r.reviewerSummary ? (
                    <div className="mt-3 rounded-md border p-3" style={{ borderColor: "var(--x-border)" }}>
                      <div className="text-[10px] uppercase tracking-[0.12em]" style={{ color: "var(--x-slate-light)" }}>
                        Reviewer decision: {r.reviewerDecision}
                        {r.reviewedAt ? ` · ${new Date(r.reviewedAt).toLocaleDateString("en-GB")}` : ""}
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed">{r.reviewerSummary}</p>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs" style={{ color: "var(--x-slate-light)" }}>
              No reviews yet.
            </p>
          )}
        </WorkspaceCard>

        {data.isCoach ? (
          <WorkspaceCard
            title={`Reviews awaiting your decision (${data.queue.length})`}
            description="Write a decision in your own words. A confirmed review is a human judgement, not an external verification."
          >
            {data.queue.length ? (
              <ul className="grid gap-3">
                {data.queue.map((r) => (
                  <ReviewerBlock key={r.id} review={r} onDecided={invalidate} />
                ))}
              </ul>
            ) : (
              <p className="text-xs" style={{ color: "var(--x-slate-light)" }}>
                Nothing waiting on you.
              </p>
            )}
          </WorkspaceCard>
        ) : null}
      </div>
    </WorkspaceShell>
  );
}

function DraftEditor({
  review,
  onSaved,
  onSubmit,
}: {
  review: { id: string; selfSummary: string };
  onSaved: () => void;
  onSubmit: () => void;
}) {
  const [body, setBody] = useState(review.selfSummary);
  const save = useMutation({
    mutationFn: () => updatePerformanceReview({ data: { id: review.id, selfSummary: body } }),
    onSuccess: () => {
      toast.success("Draft updated.");
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="mt-3 grid gap-2">
      <Textarea className="min-h-28 text-xs" value={body} onChange={(e) => setBody(e.target.value)} />
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={body === review.selfSummary || body.trim().length < 40 || save.isPending}
          onClick={() => save.mutate()}
        >
          Save draft
        </Button>
        <Button size="sm" onClick={onSubmit}>
          Send for review
        </Button>
      </div>
    </div>
  );
}

function ReviewerBlock({
  review,
  onDecided,
}: {
  review: { id: string; periodLabel: string; selfSummary: string; submittedAt: string | null };
  onDecided: () => void;
}) {
  const [summary, setSummary] = useState("");
  const decide = useMutation({
    mutationFn: (decision: "confirmed" | "returned") =>
      decidePerformanceReview({ data: { id: review.id, decision, summary } }),
    onSuccess: () => {
      setSummary("");
      toast.success("Decision recorded.");
      onDecided();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <li className="rounded-lg border p-4" style={{ borderColor: "var(--x-border)" }}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] font-semibold">{review.periodLabel}</p>
        <span className="text-[10px] uppercase tracking-[0.12em]" style={{ color: "var(--x-slate-light)" }}>
          {review.submittedAt ? `Submitted ${new Date(review.submittedAt).toLocaleDateString("en-GB")}` : "Submitted"}
        </span>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed" style={{ color: "var(--x-slate-light)" }}>
        {review.selfSummary}
      </p>
      <Textarea
        className="mt-3 min-h-24 text-xs"
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        placeholder="Your written decision: what the evidence supports, and what is still missing."
      />
      <div className="mt-2 flex flex-wrap gap-2">
        <Button size="sm" disabled={summary.trim().length < 10 || decide.isPending} onClick={() => decide.mutate("confirmed")}>
          Confirm
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={summary.trim().length < 10 || decide.isPending}
          onClick={() => decide.mutate("returned")}
        >
          Return for more detail
        </Button>
      </div>
    </li>
  );
}
