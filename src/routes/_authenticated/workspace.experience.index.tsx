import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { CheckCircle2, Lock, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { WorkspaceCard, WorkspaceShell } from "@/components/workspace/workspace-shell";
import { Button } from "@/components/ui/button";
import { experienceWorkspaceQuery } from "@/lib/experience-queries";
import { joinExperienceScenario } from "@/lib/experience.functions";

export const Route = createFileRoute("/_authenticated/workspace/experience/")({
  head: () => ({
    meta: [
      { title: "Experience Simulations — DeliverX" },
      {
        name: "description",
        content: "Do realistic product work inside a simulated company. Every submission is locked and enters your evidence record.",
      },
      { property: "og:title", content: "Experience Simulations — DeliverX" },
      { property: "og:description", content: "Realistic simulated PM work that produces provenance-backed evidence." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(experienceWorkspaceQuery),
  component: ExperienceIndex,
});

function ExperienceIndex() {
  const { data } = useSuspenseQuery(experienceWorkspaceQuery);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const join = useMutation({
    mutationFn: (scenarioId: string) => joinExperienceScenario({ data: { scenarioId } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["experience"] });
      toast.success("You're in. Start with the first task.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <WorkspaceShell
      title="Experience"
      subtitle="Realistic work inside a simulated company. Submissions are locked and become evidence."
    >
      <div className="space-y-5">
        {data.scenarios.length === 0 ? (
          <WorkspaceCard
            title="No scenarios available yet"
            description="Scenarios are enabled deliberately. Nothing is generated for you in the background."
          />
        ) : null}

        {data.scenarios.map((scenario) => {
          const nextTask = scenario.tasks.find((t) => !t.submittedAt);
          return (
            <WorkspaceCard
              key={scenario.id}
              title={`${scenario.companyName} — ${scenario.name}`}
              description={scenario.summary}
              action={
                scenario.enrolled ? (
                  nextTask ? (
                    <Button
                      size="sm"
                      onClick={() =>
                        void navigate({
                          to: "/workspace/experience/$taskKey",
                          params: { taskKey: nextTask.key },
                        })
                      }
                    >
                      Continue
                    </Button>
                  ) : (
                    <span className="text-[11px] font-semibold" style={{ color: "var(--x-teal)" }}>
                      Scenario complete
                    </span>
                  )
                ) : (
                  <Button size="sm" disabled={join.isPending} onClick={() => join.mutate(scenario.id)}>
                    {join.isPending ? "Joining…" : "Join scenario"}
                  </Button>
                )
              }
            >
              <div className="mb-5 flex flex-wrap gap-x-6 gap-y-2 text-[11px]" style={{ color: "var(--x-slate-light)" }}>
                <span>
                  Role · <strong className="font-semibold">{scenario.roleTitle}</strong>
                </span>
                <span>{scenario.companyStage}</span>
                <span className="font-mono">{scenario.frameworkLabel}</span>
                <span>
                  {scenario.submittedCount} of {scenario.tasks.length} tasks submitted
                </span>
              </div>

              <ol className="space-y-2">
                {scenario.tasks.map((task) => {
                  const state = task.submittedAt ? "done" : task.unlocked ? "open" : "locked";
                  const row = (
                    <div
                      className="flex items-center gap-3 rounded-lg border px-4 py-3"
                      style={{
                        borderColor: "var(--x-border)",
                        background: state === "locked" ? "transparent" : "var(--x-paper)",
                        opacity: state === "locked" ? 0.55 : 1,
                      }}
                    >
                      {state === "done" ? (
                        <CheckCircle2 className="size-4 shrink-0" style={{ color: "var(--x-teal)" }} />
                      ) : state === "open" ? (
                        <PlayCircle className="size-4 shrink-0" style={{ color: "var(--x-amber)" }} />
                      ) : (
                        <Lock className="size-4 shrink-0" style={{ color: "var(--x-slate-light)" }} />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-semibold">{task.title}</div>
                        <div className="text-[11px]" style={{ color: "var(--x-slate-light)" }}>
                          Week {task.week} · {task.capabilityKey} ·{" "}
                          {state === "done"
                            ? `submitted ${new Date(task.submittedAt as string).toLocaleDateString()}`
                            : state === "open"
                              ? `${task.minWords}+ words`
                              : "unlocks when the previous task is submitted"}
                        </div>
                      </div>
                    </div>
                  );
                  return (
                    <li key={task.id}>
                      {state === "locked" ? (
                        row
                      ) : (
                        <Link
                          to="/workspace/experience/$taskKey"
                          params={{ taskKey: task.key }}
                          className="block no-underline"
                        >
                          {row}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ol>
            </WorkspaceCard>
          );
        })}

        <p className="text-[11px]" style={{ color: "var(--x-slate-light)" }}>
          Simulated work creates observed evidence only. Capability levels come from a separate scoring run, and
          Verified needs external attestation.
        </p>
      </div>
    </WorkspaceShell>
  );
}
