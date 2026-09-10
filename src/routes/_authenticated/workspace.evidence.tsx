import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { FileCheck2, Lock } from "lucide-react";
import { WorkspaceShell, WorkspaceCard } from "@/components/workspace/workspace-shell";
import { evidenceOverviewQuery } from "@/lib/evidence-queries";
import { recordSelfReport, recordWorkEvidence } from "@/lib/evidence.functions";

export const Route = createFileRoute("/_authenticated/workspace/evidence")({
  loader: ({ context }) => context.queryClient.ensureQueryData(evidenceOverviewQuery),
  component: EvidencePage,
});

const STRENGTH_LABEL: Record<string, string> = {
  self_reported: "Self-reported",
  observed: "Observed",
  assessed: "Assessed",
  externally_verified: "Externally verified",
};

const SOURCE_LABEL: Record<string, string> = {
  self_report: "You said so",
  ai_draft: "AI draft",
  experience_sim: "Simulated work",
  workspace_contribution: "Workspace contribution",
  assessment: "Assessment",
  external_verification: "External confirmation",
};

function EvidencePage() {
  const { data } = useSuspenseQuery(evidenceOverviewQuery);
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["evidence"] });

  const [capabilityKey, setCapabilityKey] = useState(data.capabilities[0]?.key ?? "");
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState("document");
  const [source, setSource] = useState("workspace_contribution");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");

  const [claimCapability, setClaimCapability] = useState(data.capabilities[0]?.key ?? "");
  const [claimSummary, setClaimSummary] = useState("");

  const work = useMutation({
    mutationFn: (input: WorkEvidenceInput) => recordWorkEvidence({ data: input }),
    onSuccess: () => {
      toast.success("Recorded. The version behind it can never be edited.");
      setTitle("");
      setSummary("");
      setBody("");
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const selfReport = useMutation({
    mutationFn: (input: Parameters<typeof recordSelfReport>[0]["data"]) =>
      recordSelfReport({ data: input }),
    onSuccess: () => {
      toast.success("Saved and labelled as self-reported.");
      setClaimSummary("");
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <WorkspaceShell
      title="Evidence"
      subtitle="A permanent record of what you actually did, and where it came from. Nothing here can be edited or deleted once written."
    >
      <WorkspaceCard
        title="Record real work"
        description="Save the work itself, then the proof that points at it. This is the only kind of entry that can build capability."
      >
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            work.mutate({
              title,
              kind: kind as "document",
              body,
              capabilityKey,
              source: source as "workspace_contribution",
              summary,
            });
          }}
        >
          <Field label="What did you produce?">
            <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} required />
          </Field>
          <Field label="Type of work">
            <select className={inputCls} value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="document">Document</option>
              <option value="decision">Decision</option>
              <option value="meeting">Meeting</option>
              <option value="analysis">Analysis</option>
              <option value="reflection">Reflection</option>
            </select>
          </Field>
          <Field label="Where it happened">
            <select className={inputCls} value={source} onChange={(e) => setSource(e.target.value)}>
              <option value="workspace_contribution">In your workspace</option>
              <option value="experience_sim">In a simulated company</option>
              <option value="assessment">In an assessment</option>
            </select>
          </Field>
          <Field label="Which capability it shows">
            <select
              className={inputCls}
              value={capabilityKey}
              onChange={(e) => setCapabilityKey(e.target.value)}
            >
              {data.capabilities.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="One-line proof summary" span>
            <input className={inputCls} value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={400} required />
          </Field>
          <Field label="The work itself" span>
            <textarea
              className={`${inputCls} min-h-32`}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={8000}
              required
            />
          </Field>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={work.isPending}
              className="rounded-full bg-[var(--mkt-green)] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
            >
              {work.isPending ? "Saving…" : "Record evidence"}
            </button>
          </div>
        </form>
      </WorkspaceCard>

      <WorkspaceCard
        title="Add something you're claiming"
        description="Saved as self-reported. It will never count as proof and can never become Verified on its own."
      >
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            selfReport.mutate({ capabilityKey: claimCapability, summary: claimSummary });
          }}
        >
          <Field label="Capability">
            <select
              className={inputCls}
              value={claimCapability}
              onChange={(e) => setClaimCapability(e.target.value)}
            >
              {data.capabilities.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="What you're claiming">
            <input
              className={inputCls}
              value={claimSummary}
              onChange={(e) => setClaimSummary(e.target.value)}
              maxLength={400}
              required
            />
          </Field>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={selfReport.isPending}
              className="rounded-full border border-[var(--mkt-border)] px-5 py-2.5 text-sm font-medium text-[var(--mkt-text1)] disabled:opacity-60"
            >
              {selfReport.isPending ? "Saving…" : "Add self-reported claim"}
            </button>
          </div>
        </form>
      </WorkspaceCard>

      <WorkspaceCard
        title="Your ledger"
        description={`${data.ledger.length} entries. Private to you.`}
      >
        {data.ledger.length === 0 ? (
          <p className="text-sm text-[var(--mkt-text2)]">
            Nothing recorded yet. Add your first piece of work above.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--mkt-border)]">
            {data.ledger.map((e) => (
              <li key={e.id} className="flex flex-wrap items-start gap-3 py-3">
                <FileCheck2 className="mt-0.5 size-4 shrink-0 text-[var(--mkt-green)]" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{e.summary}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--mkt-text2)]">
                    <span className="rounded-full border border-[var(--mkt-border)] px-2 py-0.5">
                      {STRENGTH_LABEL[e.strength] ?? e.strength}
                    </span>
                    <span>{SOURCE_LABEL[e.source] ?? e.source}</span>
                    {e.artefactTitle ? (
                      <span>
                        · {e.artefactTitle} v{e.artefactVersion}
                      </span>
                    ) : null}
                    <span>· {new Date(e.occurredAt).toLocaleDateString()}</span>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-5 flex items-center gap-2 text-xs text-[var(--mkt-text2)]">
          <Lock className="size-3.5" /> Private by default. Only you can see this.
        </p>
      </WorkspaceCard>
    </WorkspaceShell>
  );
}

const inputCls =
  "w-full rounded-xl border border-[var(--mkt-border)] bg-[var(--mkt-s2)] px-3 py-2.5 text-sm text-[var(--mkt-text1)] outline-none focus:border-[var(--mkt-green)]";

function Field({
  label,
  children,
  span,
}: {
  label: string;
  children: React.ReactNode;
  span?: boolean;
}) {
  return (
    <label className={`block text-sm ${span ? "sm:col-span-2" : ""}`}>
      <span className="mb-1.5 block font-medium text-[var(--mkt-text2)]">{label}</span>
      {children}
    </label>
  );
}
