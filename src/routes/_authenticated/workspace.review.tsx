import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CheckCircle2, Clock3, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { WorkspaceCard, WorkspaceShell } from "@/components/workspace/workspace-shell";
import { Button } from "@/components/ui/button";
import { coachReviewQuery } from "@/lib/coaching-queries";
import { reviewCoachingSubmission } from "@/lib/coaching.functions";
import type { CoachQueueItem } from "@/lib/coaching.functions";

export const Route = createFileRoute("/_authenticated/workspace/review")({
  head: () => ({
    meta: [
      { title: "Coach Review — DeliverX" },
      {
        name: "description",
        content: "The coach queue: confirm demonstrated work or return it with guidance.",
      },
      { property: "og:title", content: "Coach Review — DeliverX" },
      {
        property: "og:description",
        content: "Review coaching submissions with full provenance and permanent decisions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(coachReviewQuery),
  component: ReviewPage,
});

const inputCls =
  "w-full border border-[var(--mkt-border)] bg-[var(--mkt-s2)] px-3 py-2.5 text-sm text-[var(--mkt-text1)] outline-hidden focus:border-[var(--mkt-green)]";

function ReviewPage() {
  const { data } = useSuspenseQuery(coachReviewQuery);
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"queue" | "history">("queue");
  const [programme, setProgramme] = useState("all");
  const [search, setSearch] = useState("");
  const [order, setOrder] = useState<"oldest" | "newest">("oldest");
  const [notes, setNotes] = useState<Record<string, string>>({});

  const review = useMutation({
    mutationFn: (input: {
      submissionId: string;
      decision: "confirmed" | "rejected";
      coachNote: string;
    }) => reviewCoachingSubmission({ data: input }),
    onSuccess: (_result, input) => {
      toast.success(
        input.decision === "confirmed"
          ? "Confirmed. One assessed evidence entry was written to their record."
          : "Returned with guidance. No evidence entry was created.",
      );
      void queryClient.invalidateQueries({ queryKey: ["coaching"] });
      void queryClient.invalidateQueries({ queryKey: ["evidence"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const queue = useMemo(() => {
    const term = search.trim().toLowerCase();
    const rows = data.queue.filter(
      (row) =>
        (programme === "all" || row.programmeName === programme) &&
        (term === "" ||
          row.ownerName.toLowerCase().includes(term) ||
          row.exerciseTitle.toLowerCase().includes(term)),
    );
    return order === "oldest" ? rows : [...rows].reverse();
  }, [data.queue, programme, search, order]);

  if (!data.isCoach) {
    return (
      <WorkspaceShell title="Coach review" subtitle="This area is for coaches and admins.">
        <WorkspaceCard
          title="Not a coach account"
          description="Your own coaching work lives on the Coaching page."
        >
          <Link to="/workspace/coaching" className="text-sm underline">
            Go to Coaching
          </Link>
        </WorkspaceCard>
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell
      title="Coach review"
      subtitle="Confirm only demonstrated work. Confirmation writes one assessed evidence entry; returning it writes none. Decisions are permanent."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Waiting on you" value={String(data.stats.waiting)} />
        <Stat label="Reviewed this week" value={String(data.stats.reviewedThisWeek)} />
        <Stat
          label="Average wait"
          value={data.stats.averageWaitHours === null ? "—" : `${data.stats.averageWaitHours}h`}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {(["queue", "history"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`border px-4 py-2 text-xs font-bold uppercase ${
              tab === value
                ? "border-[var(--mkt-text1)] bg-[var(--mkt-text1)] text-[var(--mkt-on-dark)]"
                : "border-[var(--mkt-border-l)] text-[var(--mkt-text2)]"
            }`}
          >
            {value === "queue" ? `Queue (${data.queue.length})` : `My decisions (${data.history.length})`}
          </button>
        ))}
      </div>

      {tab === "queue" ? (
        <WorkspaceCard
          title="Waiting for a decision"
          description="Everything here is locked work with a content fingerprint. You cannot review your own submissions."
        >
          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            <select
              className={inputCls}
              value={programme}
              onChange={(event) => setProgramme(event.target.value)}
              aria-label="Filter by programme"
            >
              <option value="all">All programmes</option>
              {data.programmes.map((row) => (
                <option key={row.id} value={row.name}>
                  {row.name}
                </option>
              ))}
            </select>
            <input
              className={inputCls}
              placeholder="Search person or exercise"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search submissions"
            />
            <select
              className={inputCls}
              value={order}
              onChange={(event) => setOrder(event.target.value as typeof order)}
              aria-label="Sort order"
            >
              <option value="oldest">Longest waiting first</option>
              <option value="newest">Newest first</option>
            </select>
          </div>

          {queue.length === 0 ? (
            <p className="text-sm text-[var(--mkt-text2)]">
              {data.queue.length === 0
                ? "Nothing is waiting for review."
                : "No submissions match those filters."}
            </p>
          ) : (
            <div className="space-y-5">
              {queue.map((row) => (
                <article key={row.id} className="border border-[var(--mkt-border)] p-4 sm:p-5">
                  <Header row={row} />
                  <p className="mt-4 whitespace-pre-wrap border-l-2 border-[var(--mkt-green)] pl-4 text-sm leading-relaxed">
                    {row.body}
                  </p>
                  {row.externalUrl ? (
                    <a
                      className="mt-3 inline-block text-sm underline"
                      href={row.externalUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open the link they submitted
                    </a>
                  ) : null}
                  {row.storagePath ? (
                    <p className="mt-3 text-xs text-[var(--mkt-text2)]">
                      Private file attached: {row.storagePath.split("/").slice(1).join("/")}
                    </p>
                  ) : null}
                  <p className="mt-3 font-mono text-[0.625rem] text-[var(--mkt-text3)]">
                    SHA-256 {row.contentHash}
                  </p>
                  <label className="mt-5 block text-sm">
                    <span className="mb-1.5 block font-medium text-[var(--mkt-text2)]">
                      Your note (required — the person sees this)
                    </span>
                    <textarea
                      className={`${inputCls} min-h-28`}
                      value={notes[row.id] ?? ""}
                      onChange={(event) =>
                        setNotes((current) => ({ ...current, [row.id]: event.target.value }))
                      }
                    />
                  </label>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      className="rounded-none bg-[var(--mkt-green)] text-[var(--mkt-on-dark)]"
                      disabled={review.isPending}
                      onClick={() =>
                        review.mutate({
                          submissionId: row.id,
                          decision: "confirmed",
                          coachNote: notes[row.id] ?? "",
                        })
                      }
                    >
                      <CheckCircle2 />
                      Confirm evidence
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-none"
                      disabled={review.isPending}
                      onClick={() =>
                        review.mutate({
                          submissionId: row.id,
                          decision: "rejected",
                          coachNote: notes[row.id] ?? "",
                        })
                      }
                    >
                      <XCircle />
                      Return with guidance
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </WorkspaceCard>
      ) : (
        <WorkspaceCard
          title="Your past decisions"
          description="Read-only. A decision cannot be edited or withdrawn once made."
        >
          {data.history.length === 0 ? (
            <p className="text-sm text-[var(--mkt-text2)]">You have not reviewed anything yet.</p>
          ) : (
            <ul className="divide-y divide-[var(--mkt-border)]">
              {data.history.map((row) => (
                <li key={row.id} className="py-4">
                  <Header row={row} />
                  <p className="mt-3 border-l-2 border-[var(--mkt-border-l)] pl-3 text-sm text-[var(--mkt-text2)]">
                    {row.coachNote}
                  </p>
                  <p className="mt-2 text-xs text-[var(--mkt-text3)]">
                    {row.decision === "confirmed" ? "Confirmed" : "Returned"} on{" "}
                    {new Date(row.decidedAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </WorkspaceCard>
      )}

      <p className="flex items-start gap-2 text-xs text-[var(--mkt-text2)]">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" />
        Coach-confirmed work is assessed evidence, not external verification. Verified still requires
        someone outside DeliverX to confirm it.
      </p>
    </WorkspaceShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[var(--mkt-border)] p-4">
      <p className="font-mono text-[0.625rem] font-bold uppercase text-[var(--mkt-text3)]">{label}</p>
      <p className="mt-2 font-serif text-3xl font-black">{value}</p>
    </div>
  );
}

function Header({ row }: { row: CoachQueueItem | { [K in keyof CoachQueueItem]?: unknown } }) {
  const item = row as CoachQueueItem;
  const Icon = item.state === "confirmed" ? CheckCircle2 : item.state === "rejected" ? XCircle : Clock3;
  return (
    <div className="flex flex-wrap items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-[var(--mkt-green)]" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{item.artefactTitle}</p>
        <p className="mt-1 text-xs text-[var(--mkt-text2)]">
          {item.ownerName} · {item.programmeName} · {item.exerciseTitle} · attempt {item.attempt}
        </p>
        <span className="mt-2 inline-block border border-[var(--mkt-border)] px-2 py-0.5 font-mono text-[0.625rem] uppercase">
          {item.state}
        </span>
      </div>
      <time className="text-xs text-[var(--mkt-text3)]">
        {typeof item.waitingHours === "number"
          ? `waiting ${item.waitingHours}h`
          : new Date(item.submittedAt).toLocaleDateString()}
      </time>
    </div>
  );
}
