import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CheckCircle2, Clock3, FileUp, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { WorkspaceCard, WorkspaceShell } from "@/components/workspace/workspace-shell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { coachingWorkspaceQuery } from "@/lib/coaching-queries";
import { reviewCoachingSubmission, submitCoachingEvidence } from "@/lib/coaching.functions";

export const Route = createFileRoute("/_authenticated/workspace/coaching")({
  head: () => ({ meta: [{ title: "Coaching Evidence — DeliverX" }, { name: "description", content: "Submit structured coaching work and track human coach confirmation." }, { property: "og:title", content: "Coaching Evidence — DeliverX" }, { property: "og:description", content: "Structured coaching work with human confirmation and full provenance." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(coachingWorkspaceQuery),
  component: CoachingPage,
});

const inputCls = "w-full border border-[var(--mkt-border)] bg-[var(--mkt-s2)] px-3 py-2.5 text-sm text-[var(--mkt-text1)] outline-hidden focus:border-[var(--mkt-green)]";

async function sha256(value: string | ArrayBuffer) {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function CoachingPage() {
  const { data } = useSuspenseQuery(coachingWorkspaceQuery);
  const queryClient = useQueryClient();
  const enabled = useMemo(() => data.programmes.filter((programme) => programme.enabled), [data.programmes]);
  const exercises = enabled.flatMap((programme) => programme.exercises);
  const [exerciseId, setExerciseId] = useState(exercises[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [method, setMethod] = useState<"structured_response" | "file_upload" | "external_link">("structured_response");
  const [externalUrl, setExternalUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [confidence, setConfidence] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["coaching"] });

  const submit = useMutation({
    mutationFn: async () => {
      let storagePath: string | null = null;
      let hashSource: string | ArrayBuffer = body;
      if (method === "file_upload") {
        if (!file) throw new Error("Choose a file to submit.");
        if (!/[.](xlsx|docx|pdf)$/i.test(file.name)) throw new Error("Upload an .xlsx, .docx or .pdf file.");
        const { data: userData } = await supabase.auth.getUser();
        const user = userData.user;
        if (!user) throw new Error("Sign in again to upload this file.");
        const bytes = await file.arrayBuffer();
        hashSource = bytes;
        storagePath = `${user.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
        const { error } = await supabase.storage.from("coaching-artefacts").upload(storagePath, file, { upsert: false });
        if (error) throw new Error(error.message);
      } else if (method === "external_link") {
        hashSource = `${externalUrl}\n${body}`;
      }
      return submitCoachingEvidence({ data: {
        exerciseId, title, body, intakeMethod: method,
        externalUrl: method === "external_link" ? externalUrl : null,
        storagePath,
        contentHash: await sha256(hashSource),
        selfConfidence: confidence ? Number(confidence) : null,
      } });
    },
    onSuccess: () => { toast.success("Submitted for human coach review. No ledger evidence exists yet."); setTitle(""); setBody(""); setExternalUrl(""); setFile(null); setConfidence(""); void refresh(); },
    onError: (error: Error) => toast.error(error.message),
  });

  const review = useMutation({
    mutationFn: (input: { submissionId: string; decision: "confirmed" | "rejected"; coachNote: string }) => reviewCoachingSubmission({ data: input }),
    onSuccess: (_, input) => { toast.success(input.decision === "confirmed" ? "Confirmed and written to the ledger." : "Rejected with guidance; no ledger entry was created."); void refresh(); void queryClient.invalidateQueries({ queryKey: ["evidence"] }); },
    onError: (error: Error) => toast.error(error.message),
  });

  return <WorkspaceShell title="Coaching evidence" subtitle="Structured work becomes evidence only after a human coach confirms it. Coach confirmation is not external verification.">
    {enabled.length === 0 ? <WorkspaceCard title="Coaching is not enabled" description="Programme shells are ready, but every programme remains off until the founder approves its exercises." /> : <WorkspaceCard title="Submit an exercise" description="Your artefact is locked when submitted. AI does not approve it and nothing enters your ledger until a coach confirms it.">
      {exercises.length === 0 ? <p className="text-sm text-[var(--mkt-text2)]">Enabled programmes have no approved exercises yet.</p> : <form className="grid gap-4 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); submit.mutate(); }}>
        <Field label="Exercise"><select className={inputCls} value={exerciseId} onChange={(event) => setExerciseId(event.target.value)} required>{enabled.map((programme) => <optgroup key={programme.id} label={`${programme.name} · ${programme.framework}`}>{programme.exercises.map((exercise) => <option key={exercise.id} value={exercise.id}>{exercise.title} — {exercise.capabilityName}</option>)}</optgroup>)}</select></Field>
        <Field label="Submission title"><input className={inputCls} value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} required /></Field>
        <Field label="Intake method"><select className={inputCls} value={method} onChange={(event) => setMethod(event.target.value as typeof method)}><option value="structured_response">Structured response</option><option value="file_upload">Private file upload</option><option value="external_link">External HTTPS link</option></select></Field>
        <Field label="Optional self-confidence"><select className={inputCls} value={confidence} onChange={(event) => setConfidence(event.target.value)}><option value="">Not provided</option>{[1,2,3,4,5].map((value) => <option key={value} value={value}>{value} / 5 — self-reported only</option>)}</select></Field>
        {method === "external_link" ? <Field label="External HTTPS link" span><input type="url" className={inputCls} value={externalUrl} onChange={(event) => setExternalUrl(event.target.value)} placeholder="https://" required /></Field> : null}
        {method === "file_upload" ? <Field label="Artefact file (.xlsx, .docx, .pdf)" span><input type="file" accept=".xlsx,.docx,.pdf" className={inputCls} onChange={(event) => setFile(event.target.files?.[0] ?? null)} required /></Field> : null}
        <Field label={method === "structured_response" ? "Completed work" : "Context and decisions shown in this artefact"} span><textarea className={`${inputCls} min-h-44`} value={body} onChange={(event) => setBody(event.target.value)} maxLength={20000} required /></Field>
        <div className="sm:col-span-2"><Button type="submit" disabled={submit.isPending} className="rounded-none bg-[var(--mkt-text1)] text-[var(--mkt-on-dark)] hover:bg-[var(--mkt-green)]"><FileUp />{submit.isPending ? "Locking submission…" : "Submit for coach review"}</Button></div>
      </form>}
    </WorkspaceCard>}

    <WorkspaceCard title="Your coaching submissions" description={`${data.mySubmissions.length} attempts. Rejected work remains visible when you resubmit.`}>
      {data.mySubmissions.length === 0 ? <p className="text-sm text-[var(--mkt-text2)]">No coaching work submitted.</p> : <SubmissionList rows={data.mySubmissions} />}
    </WorkspaceCard>

    {data.isCoach ? <WorkspaceCard title="Coach review queue" description="Confirm only demonstrated work. Confirmation creates assessed evidence; rejection creates none.">
      {data.reviewQueue.length === 0 ? <p className="text-sm text-[var(--mkt-text2)]">No submissions are waiting for review.</p> : <div className="space-y-5">{data.reviewQueue.map((row) => <article key={row.id} className="border border-[var(--mkt-border)] p-4 sm:p-5"><SubmissionHeader row={row} /><p className="mt-4 whitespace-pre-wrap border-l-2 border-[var(--mkt-green)] pl-4 text-sm leading-relaxed">{row.body}</p>{row.externalUrl ? <a className="mt-3 inline-block text-sm underline" href={row.externalUrl} target="_blank" rel="noreferrer">Open external artefact</a> : null}<p className="mt-3 font-mono text-[0.625rem] text-[var(--mkt-text3)]">SHA-256 {row.contentHash}</p><label className="mt-5 block text-sm"><span className="mb-1.5 block font-medium text-[var(--mkt-text2)]">Coach note or rejection guidance</span><textarea className={`${inputCls} min-h-28`} value={notes[row.id] ?? ""} onChange={(event) => setNotes((current) => ({ ...current, [row.id]: event.target.value }))} /></label><div className="mt-3 flex flex-wrap gap-2"><Button type="button" className="rounded-none bg-[var(--mkt-green)] text-[var(--mkt-on-dark)]" disabled={review.isPending} onClick={() => review.mutate({ submissionId: row.id, decision: "confirmed", coachNote: notes[row.id] ?? "" })}><CheckCircle2 />Confirm evidence</Button><Button type="button" variant="outline" className="rounded-none" disabled={review.isPending} onClick={() => review.mutate({ submissionId: row.id, decision: "rejected", coachNote: notes[row.id] ?? "" })}><XCircle />Reject with guidance</Button></div></article>)}</div>}
    </WorkspaceCard> : null}

    <p className="flex items-start gap-2 text-xs text-[var(--mkt-text2)]"><ShieldCheck className="mt-0.5 size-4 shrink-0" />Coach-confirmed evidence is assessed, not externally verified. The separate attestation gate remains unchanged.</p>
  </WorkspaceShell>;
}

function SubmissionList({ rows }: { rows: import("@/lib/coaching.functions").CoachingSubmission[] }) { return <ul className="divide-y divide-[var(--mkt-border)]">{rows.map((row) => <li key={row.id} className="py-4"><SubmissionHeader row={row} />{row.review ? <p className="mt-3 border-l-2 border-[var(--mkt-border-l)] pl-3 text-sm text-[var(--mkt-text2)]">{row.review.coachNote}</p> : null}</li>)}</ul>; }
function SubmissionHeader({ row }: { row: import("@/lib/coaching.functions").CoachingSubmission }) { const Icon = row.state === "confirmed" ? CheckCircle2 : row.state === "rejected" ? XCircle : Clock3; return <div className="flex flex-wrap items-start gap-3"><Icon className="mt-0.5 size-4 shrink-0 text-[var(--mkt-green)]" /><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{row.artefactTitle}</p><p className="mt-1 text-xs text-[var(--mkt-text2)]">{row.ownerName} · {row.programmeName} · {row.exerciseTitle} · attempt {row.attempt}</p><span className="mt-2 inline-block border border-[var(--mkt-border)] px-2 py-0.5 font-mono text-[0.625rem] uppercase">{row.state}</span></div><time className="text-xs text-[var(--mkt-text3)]">{new Date(row.submittedAt).toLocaleDateString()}</time></div>; }
function Field({ label, children, span = false }: { label: string; children: React.ReactNode; span?: boolean }) { return <label className={`block text-sm ${span ? "sm:col-span-2" : ""}`}><span className="mb-1.5 block font-medium text-[var(--mkt-text2)]">{label}</span>{children}</label>; }