import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, Lock } from "lucide-react";
import { toast } from "sonner";
import { WorkspaceCard, WorkspaceShell } from "@/components/workspace/workspace-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { experienceWorkspaceQuery } from "@/lib/experience-queries";
import { saveExperienceDraft, submitExperienceTask } from "@/lib/experience.functions";

export const Route = createFileRoute("/_authenticated/workspace/experience/$taskKey")({
  head: () => ({
    meta: [
      { title: "Experience Task — DeliverX" },
      {
        name: "description",
        content:
          "Write your response to a simulated product task. Submitting locks the work and records it as evidence.",
      },
      { property: "og:title", content: "Experience Task — DeliverX" },
      {
        property: "og:description",
        content: "Do the work in a simulated company. Submissions are locked and provenance-backed.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(experienceWorkspaceQuery),
  component: ExperienceTaskPage,
});

function ExperienceTaskPage() {
  const { taskKey } = Route.useParams();
  const { data } = useSuspenseQuery(experienceWorkspaceQuery);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const found = useMemo(() => {
    for (const scenario of data.scenarios) {
      const task = scenario.tasks.find((t) => t.key === taskKey);
      if (task) return { scenario, task };
    }
    return null;
  }, [data, taskKey]);

  const [body, setBody] = useState(found?.task.draft?.body ?? "");
  const [sections, setSections] = useState<number[]>(found?.task.draft?.sections ?? []);

  useEffect(() => {
    setBody(found?.task.draft?.body ?? "");
    setSections(found?.task.draft?.sections ?? []);
  }, [found?.task.id, found?.task.draft?.body, found?.task.draft?.sections]);

  const saveDraft = useMutation({
    mutationFn: () =>
      saveExperienceDraft({ data: { taskId: found!.task.id, body, sections } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["experience"] });
      toast.success("Draft saved. Drafts are private and never evidence.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const submit = useMutation({
    mutationFn: () => submitExperienceTask({ data: { taskId: found!.task.id, body, sections } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["experience"] });
      await queryClient.invalidateQueries({ queryKey: ["evidence"] });
      toast.success("Submitted and locked. An evidence entry now cites this work.");
      void navigate({ to: "/workspace/experience" });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!found) {
    return (
      <WorkspaceShell title="Task not found">
        <WorkspaceCard
          title="That task is not available"
          description="It may have been withdrawn, or the link is out of date."
          action={
            <Link to="/workspace/experience" className="no-underline">
              <Button size="sm" variant="outline">
                Back to Experience
              </Button>
            </Link>
          }
        />
      </WorkspaceShell>
    );
  }

  const { scenario, task } = found;
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  const locked = task.submittedAt !== null;
  const blocked = !task.unlocked && !locked;

  return (
    <WorkspaceShell title={task.title} subtitle={`${scenario.companyName} · Week ${task.week} · ${task.phaseLabel}`}>
      <div className="space-y-5">
        <Link
          to="/workspace/experience"
          className="inline-flex items-center gap-2 text-[11px] font-semibold no-underline"
          style={{ color: "var(--x-slate-light)" }}
        >
          <ArrowLeft className="size-3.5" /> All scenarios
        </Link>

        <WorkspaceCard title="The brief" description={task.brief}>
          <p className="text-xs leading-relaxed" style={{ color: "var(--x-slate-light)" }}>
            {task.context}
          </p>
          {task.stakeholders.length > 0 ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {task.stakeholders.map((s) => (
                <div
                  key={s.name}
                  className="flex items-start gap-3 rounded-lg border px-4 py-3"
                  style={{ borderColor: "var(--x-border)" }}
                >
                  <div
                    className="flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                    style={{ background: "var(--x-paper)", color: "var(--x-slate-light)" }}
                  >
                    {s.initials}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[12px] font-semibold">{s.name}</div>
                    <div className="text-[11px]" style={{ color: "var(--x-slate-light)" }}>
                      {s.role} · trust: {s.trust}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </WorkspaceCard>

        {task.guidance.length > 0 ? (
          <WorkspaceCard title="What is being looked for" description="Guidance only — no scores are written here.">
            <ul className="space-y-2">
              {task.guidance.map((g) => (
                <li key={g.dimension} className="text-xs leading-relaxed">
                  <strong className="font-semibold">{g.dimension}</strong>{" "}
                  <span style={{ color: "var(--x-slate-light)" }}>— {g.hint}</span>
                </li>
              ))}
            </ul>
          </WorkspaceCard>
        ) : null}

        <WorkspaceCard
          title={locked ? "Submitted work (locked)" : "Your response"}
          description={
            locked
              ? `Submitted ${new Date(task.submittedAt as string).toLocaleString()}. Submitted work cannot be edited.`
              : `Minimum ${task.minWords} words. You have ${words}.`
          }
          action={
            locked || blocked ? null : (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={saveDraft.isPending}
                  onClick={() => saveDraft.mutate()}
                >
                  {saveDraft.isPending ? "Saving…" : "Save draft"}
                </Button>
                <Button size="sm" disabled={submit.isPending} onClick={() => submit.mutate()}>
                  {submit.isPending ? "Submitting…" : "Submit and lock"}
                </Button>
              </div>
            )
          }
        >
          {blocked ? (
            <div className="flex items-center gap-3 text-xs" style={{ color: "var(--x-slate-light)" }}>
              <Lock className="size-4" />
              {scenario.enrolled
                ? "This task unlocks once the previous task is submitted."
                : "Join the scenario before starting this task."}
            </div>
          ) : locked ? (
            <div className="space-y-4">
              <p className="whitespace-pre-wrap text-xs leading-relaxed">{task.draft?.body ?? ""}</p>
              <p className="text-[11px]" style={{ color: "var(--x-slate-light)" }}>
                The locked version lives in your evidence record.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {task.sections.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--x-slate-light)" }}>
                    Sections to cover
                  </div>
                  {task.sections.map((label, index) => (
                    <label key={label} className="flex items-start gap-2 text-xs">
                      <input
                        type="checkbox"
                        className="mt-0.5"
                        checked={sections.includes(index)}
                        onChange={(e) =>
                          setSections((prev) =>
                            e.target.checked ? [...prev, index] : prev.filter((i) => i !== index),
                          )
                        }
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              ) : null}
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={18}
                placeholder="Write your response as you would for the team."
                className="text-xs"
              />
            </div>
          )}
        </WorkspaceCard>

        <p className="text-[11px]" style={{ color: "var(--x-slate-light)" }}>
          Submitting records observed evidence citing an immutable version of your work. Capability levels come from a
          separate scoring run, and Verified needs external attestation.
        </p>
      </div>
    </WorkspaceShell>
  );
}
