import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { myProfileQuery } from "@/lib/profile-queries";
import { getSupervisedMissionHome, startSupervisedMission } from "@/lib/pilot-mission.functions";
import { RESEARCH_MODE_LABELS, type ResearchMode } from "@/lib/pilot-mission/research-mode";

import { useSession } from "@/hooks/use-session";
import { loadPilotBrief } from "@/lib/pilot/storage";
import type { ProductBrief } from "@/lib/marketing/product-resources";
import {
  parseMissionIntake,
  preparedMissionIntake,
  restoreMissionIntake,
} from "@/lib/mission-intake-draft";

export function SupervisedMissionStart() {
  const { user } = useSession();
  return user ? <MissionStartForm key={user.id} userId={user.id} /> : null;
}

function MissionStartForm({ userId }: { userId: string }) {
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
  const [researchMode, setResearchMode] = useState<ResearchMode>("provided");
  const [error, setError] = useState<string | null>(null);

  const [draftReady, setDraftReady] = useState(false);
  const [prepared, setPrepared] = useState<ProductBrief | null>(null);
  const [storageWarning, setStorageWarning] = useState(false);
  const hydratedUser = useRef<string | null>(null);
  const draftKey = `dx-mission-intake:${userId}`;
  useEffect(() => {
    if (profile.isLoading || hydratedUser.current === userId) return;
    let local = null;
    try {
      local = parseMissionIntake(sessionStorage.getItem(`dx-mission-intake:${userId}`));
    } catch {
      setStorageWarning(true);
    }
    const brief = loadPilotBrief();
    setPrepared(brief);
    const restored = restoreMissionIntake(local, profile.data?.firstIdea, brief);
    setQuestion(restored.question);
    setAudience(restored.audience);
    setOutcome(restored.outcome);
    setConstraints(restored.constraints);
    hydratedUser.current = userId;
    setDraftReady(true);
  }, [userId, profile.isLoading, profile.data]);
  useEffect(() => {
    if (!draftReady || !draftKey) return;
    try {
      sessionStorage.setItem(
        draftKey,
        JSON.stringify({ question, audience, outcome, constraints }),
      );
    } catch {
      setStorageWarning(true);
    }
  }, [draftReady, draftKey, question, audience, outcome, constraints]);

  const start = useMutation({
    mutationFn: () =>
      startSupervisedMission({
        data: {
          question: question.trim(),
          audience: audience.trim(),
          outcome: outcome.trim(),
          constraints: constraints.trim(),
          researchMode,
        },
      }),
    onSuccess: async (result) => {
      setError(null);
      if (draftKey)
        try {
          sessionStorage.removeItem(draftKey);
        } catch {
          /* Optional draft. */
        }
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
        Supervised decision loop with a small Available Wave 1 specialist team. Approve the plan,
        add evidence, compare options, decide, export a decision pack (PDF + Markdown), then review
        outcomes. Follow-ups never start without your approval.
      </p>
      {home.data ? (
        <p className="cc-muted text-sm">
          {home.data.providerLabel}
          {home.data.usage
            ? ` · Workspace usage ${home.data.usage.consumed} / ${home.data.usage.ceiling}`
            : ""}
        </p>
      ) : null}
      {home.isError && (
        <p className="cc-error" role="alert">
          Workspace availability could not be checked.{" "}
          <button type="button" onClick={() => void home.refetch()}>
            Try again
          </button>
        </p>
      )}
      {home.data && !home.data.ready ? <p className="cc-error">{home.data.reason}</p> : null}
      {prepared && (
        <div className="intake-prepared-note">
          <p>
            A prepared brief is available in this browser. Review the fields below before saving.
            Evidence is added after the mission brief is saved.
          </p>
          <button
            type="button"
            className="cc-btn cc-btn-ghost"
            disabled={!draftReady || start.isPending}
            onClick={() => {
              const next = preparedMissionIntake(prepared);
              setQuestion(next.question);
              setAudience(next.audience);
              setOutcome(next.outcome);
              setConstraints(next.constraints);
            }}
          >
            Use prepared brief
          </button>
          <small>Replaces the displayed intake fields; it does not start work.</small>
        </div>
      )}
      {storageWarning && (
        <p className="cc-muted" role="status">
          This browser cannot keep an unsaved intake. Save the brief before leaving.
        </p>
      )}
      <fieldset disabled={!draftReady || start.isPending} className="mt-4 grid gap-3">
        <label className="cc-label" htmlFor="supervised-question">
          Product question <span className="cc-muted text-xs">(8–2,000 characters)</span>
        </label>
        <textarea
          id="supervised-question"
          className="cc-input cc-textarea"
          maxLength={2000}
          rows={3}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
        />
        <label className="cc-label" htmlFor="supervised-audience">
          Audience <span className="cc-muted text-xs">(2–400 characters)</span>
        </label>
        <input
          id="supervised-audience"
          className="cc-input"
          maxLength={400}
          value={audience}
          onChange={(event) => setAudience(event.target.value)}
        />
        {audience.length > 400 && (
          <p className="cc-error" role="status">
            Shorten the audience to 400 characters before saving. The full prepared brief remains in
            this browser.
          </p>
        )}
        <label className="cc-label" htmlFor="supervised-outcome">
          Intended outcome <span className="cc-muted text-xs">(8–2,000 characters)</span>
        </label>
        <input
          id="supervised-outcome"
          className="cc-input"
          maxLength={2000}
          value={outcome}
          onChange={(event) => setOutcome(event.target.value)}
        />
        <label className="cc-label" htmlFor="supervised-constraints">
          Constraints
        </label>
        <input
          id="supervised-constraints"
          className="cc-input"
          maxLength={2000}
          value={constraints}
          onChange={(event) => setConstraints(event.target.value)}
        />
        <label className="cc-label" htmlFor="supervised-research-mode">
          Research mode
        </label>
        <select
          id="supervised-research-mode"
          className="cc-input"
          value={researchMode}
          onChange={(event) => setResearchMode(event.target.value as ResearchMode)}
        >
          {(Object.keys(RESEARCH_MODE_LABELS) as ResearchMode[]).map((mode) => (
            <option key={mode} value={mode}>
              {RESEARCH_MODE_LABELS[mode]}
            </option>
          ))}
        </select>
        <p className="cc-muted text-xs">
          Tools are shown again before comparison. Without a search provider, web mode is blocked
          and combined continues on provided evidence with external gaps marked.
        </p>
        {error ? (
          <p className="cc-error" role="alert">
            {error}
          </p>
        ) : null}
        <div>
          <button
            type="button"
            className="cc-btn cc-btn-primary"
            disabled={
              !draftReady ||
              start.isPending ||
              question.trim().length < 8 ||
              audience.trim().length < 2 ||
              audience.length > 400 ||
              outcome.trim().length < 8 ||
              home.isPending ||
              home.isError ||
              home.data?.ready !== true
            }
            onClick={() => start.mutate()}
          >
            {start.isPending ? "Saving brief…" : "Save brief"}
          </button>
        </div>
      </fieldset>
    </section>
  );
}
