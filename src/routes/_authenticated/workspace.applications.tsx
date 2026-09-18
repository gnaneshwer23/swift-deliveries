import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { WorkspaceCard, WorkspaceShell } from "@/components/workspace/workspace-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { applicationBoardQuery } from "@/lib/career-queries";
import { createApplication, deleteApplication, updateApplication } from "@/lib/career.functions";

export const Route = createFileRoute("/_authenticated/workspace/applications")({
  head: () => ({
    meta: [
      { title: "Applications — DeliverX Workspace" },
      {
        name: "description",
        content: "Track the roles you are applying for, the next step on each, and which shared portfolio link you sent.",
      },
      { property: "og:title", content: "Applications — DeliverX Workspace" },
      { property: "og:description", content: "One board for every role you are pursuing." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(applicationBoardQuery),
  component: ApplicationsPage,
});

const STAGES = ["saved", "applied", "interviewing", "offer", "closed"] as const;
const STAGE_LABEL: Record<string, string> = {
  saved: "Saved",
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offer",
  closed: "Closed",
};

function ApplicationsPage() {
  const { data } = useSuspenseQuery(applicationBoardQuery);
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["application-board"] });

  const [company, setCompany] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [source, setSource] = useState("direct");
  const [shareId, setShareId] = useState("");

  const create = useMutation({
    mutationFn: () =>
      createApplication({
        data: { company, roleTitle, source, notes: "", portfolioShareId: shareId || null },
      }),
    onSuccess: () => {
      setCompany("");
      setRoleTitle("");
      setShareId("");
      toast.success("Application added.");
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: (input: { id: string; stage?: (typeof STAGES)[number]; nextStep?: string; notes?: string }) =>
      updateApplication({ data: input }),
    onSuccess: () => void invalidate(),
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteApplication({ data: { id } }),
    onSuccess: () => {
      toast.success("Application removed.");
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const liveShares = data.shares.filter((s) => !s.revokedAt && new Date(s.expiresAt).getTime() > Date.now());

  const counts = STAGES.map((stage) => ({
    stage,
    count: data.applications.filter((a) => a.stage === stage).length,
  }));

  return (
    <WorkspaceShell title="Applications" subtitle="Your own record of the roles you are pursuing. Nothing is shared with employers automatically.">
      <div className="grid gap-5">
        <WorkspaceCard title="Where things stand">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {counts.map((c) => (
              <div key={c.stage} className="rounded-lg border p-3" style={{ borderColor: "var(--x-border)" }}>
                <div className="text-[10px] uppercase tracking-[0.12em]" style={{ color: "var(--x-slate-light)" }}>
                  {STAGE_LABEL[c.stage]}
                </div>
                <div className="mt-1 text-xl font-semibold">{c.count}</div>
              </div>
            ))}
          </div>
        </WorkspaceCard>

        <WorkspaceCard title="Add an application" description="Attach one of your live portfolio links so you know exactly what an employer saw.">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-xs">
              Company
              <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company name" />
            </label>
            <label className="grid gap-1 text-xs">
              Role
              <Input value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} placeholder="Product Manager" />
            </label>
            <label className="grid gap-1 text-xs">
              How you found it
              <Input value={source} onChange={(e) => setSource(e.target.value)} placeholder="direct, referral, job board" />
            </label>
            <label className="grid gap-1 text-xs">
              Portfolio link sent (optional)
              <select
                className="h-9 rounded-md border bg-transparent px-2 text-xs"
                style={{ borderColor: "var(--x-border)" }}
                value={shareId}
                onChange={(e) => setShareId(e.target.value)}
              >
                <option value="">None</option>
                {liveShares.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <Button
            className="mt-3"
            onClick={() => create.mutate()}
            disabled={company.trim().length < 2 || roleTitle.trim().length < 2 || create.isPending}
          >
            Add application
          </Button>
        </WorkspaceCard>

        <WorkspaceCard title={`Applications (${data.applications.length})`}>
          {data.applications.length ? (
            <ul className="grid gap-3">
              {data.applications.map((a) => (
                <li key={a.id} className="rounded-lg border p-4" style={{ borderColor: "var(--x-border)" }}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold">
                        {a.roleTitle} · {a.company}
                      </p>
                      <p className="mt-1 text-[11px]" style={{ color: "var(--x-slate-light)" }}>
                        Source {a.source}
                        {a.appliedAt ? ` · applied ${new Date(a.appliedAt).toLocaleDateString("en-GB")}` : ""}
                        {a.portfolioShareId ? " · portfolio link attached" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        className="h-8 rounded-md border bg-transparent px-2 text-xs"
                        style={{ borderColor: "var(--x-border)" }}
                        value={a.stage}
                        onChange={(e) =>
                          update.mutate({ id: a.id, stage: e.target.value as (typeof STAGES)[number] })
                        }
                      >
                        {STAGES.map((s) => (
                          <option key={s} value={s}>
                            {STAGE_LABEL[s]}
                          </option>
                        ))}
                      </select>
                      <Button variant="outline" size="sm" onClick={() => remove.mutate(a.id)}>
                        Remove
                      </Button>
                    </div>
                  </div>
                  <NextStepEditor
                    application={a}
                    onSave={(nextStep, notes) => update.mutate({ id: a.id, nextStep, notes })}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs" style={{ color: "var(--x-slate-light)" }}>
              No applications tracked yet.
            </p>
          )}
        </WorkspaceCard>
      </div>
    </WorkspaceShell>
  );
}

function NextStepEditor({
  application,
  onSave,
}: {
  application: { nextStep: string; notes: string };
  onSave: (nextStep: string, notes: string) => void;
}) {
  const [nextStep, setNextStep] = useState(application.nextStep);
  const [notes, setNotes] = useState(application.notes);
  const dirty = nextStep !== application.nextStep || notes !== application.notes;
  return (
    <div className="mt-3 grid gap-2">
      <label className="grid gap-1 text-xs">
        Next step
        <Input value={nextStep} onChange={(e) => setNextStep(e.target.value)} placeholder="Send follow-up, prepare case study" />
      </label>
      <label className="grid gap-1 text-xs">
        Notes
        <Textarea className="min-h-20 text-xs" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>
      <Button variant="outline" size="sm" className="justify-self-start" disabled={!dirty} onClick={() => onSave(nextStep, notes)}>
        Save changes
      </Button>
    </div>
  );
}
