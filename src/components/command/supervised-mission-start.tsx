import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { myProfileQuery } from "@/lib/profile-queries";
import { getSupervisedMissionHome, startSupervisedMission } from "@/lib/pilot-mission.functions";

export function SupervisedMissionStart() {
  const profile = useQuery(myProfileQuery);
  const home = useQuery({
    queryKey: ["supervised", "home"],
    queryFn: () => getSupervisedMissionHome(),
  });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [question, setQuestion] = useState("");
  const [audience, setAudience] = useState("");
  const [outcome, setOutcome] = useState("A decision pack and an experiment brief.");
  const [constraints, setConstraints] = useState("");
  const [error, setError] = useState<string | null>(null);

  const savedQuestion = profile.data?.firstIdea;
  useEffect(() => {
    if (!savedQuestion) return;
    setQuestion((current) => current || savedQuestion.slice(0, 2000));
  }, [savedQuestion]);

  const start = useMutation({
    mutationFn: () =>
      startSupervisedMission({
        data: {
          question: question.trim(),
          audience: audience.trim(),
          outcome: outcome.trim(),
          constraints: constraints.trim(),
        },
      }),
    onSuccess: async (result) => {
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ["supervised"] });
      void navigate({
        to: "/command/supervised/$missionId",
        params: { missionId: result.mission.id },
      });
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : "The brief could not be saved."),
  });

  return (
    <section id="supervised-brief" className="cc-panel" aria-label="Supervised mission">
      <p className="cc-kicker">Start a mission</p>
      <h2 className="cc-panel-title">What product question are you exploring?</h2>
      <p className="cc-muted">
        Save a brief, add evidence, compare options, record your decision, then export a decision
        and experiment brief. One comparison runs only when a model provider is already configured.
      </p>
      {home.data ? (
        <p className="cc-muted text-sm">
          {home.data.providerLabel}
          {home.data.usage
            ? ` · Workspace usage ${home.data.usage.consumed} / ${home.data.usage.ceiling}`
            : ""}
        </p>
      ) : null}
      {home.data && !home.data.ready ? <p className="cc-error">{home.data.reason}</p> : null}
      <div className="mt-4 grid gap-3">
        <label className="cc-label" htmlFor="supervised-question">
          Product question
        </label>
        <textarea
          id="supervised-question"
          className="cc-input cc-textarea"
          rows={3}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
        />
        <label className="cc-label" htmlFor="supervised-audience">
          Audience
        </label>
        <input
          id="supervised-audience"
          className="cc-input"
          value={audience}
          onChange={(event) => setAudience(event.target.value)}
        />
        <label className="cc-label" htmlFor="supervised-outcome">
          Intended outcome
        </label>
        <input
          id="supervised-outcome"
          className="cc-input"
          value={outcome}
          onChange={(event) => setOutcome(event.target.value)}
        />
        <label className="cc-label" htmlFor="supervised-constraints">
          Constraints
        </label>
        <input
          id="supervised-constraints"
          className="cc-input"
          value={constraints}
          onChange={(event) => setConstraints(event.target.value)}
        />
        {error ? <p className="cc-error">{error}</p> : null}
        <div>
          <button
            type="button"
            className="cc-btn cc-btn-primary"
            disabled={start.isPending || home.data?.ready === false}
            onClick={() => start.mutate()}
          >
            {start.isPending ? "Saving brief…" : "Save brief"}
          </button>
        </div>
      </div>
    </section>
  );
}
