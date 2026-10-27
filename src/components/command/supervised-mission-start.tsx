import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { myProfileQuery } from "@/lib/profile-queries";
import { getSupervisedMissionHome, startSupervisedMission } from "@/lib/pilot-mission.functions";
import { RESEARCH_MODE_LABELS, type ResearchMode } from "@/lib/pilot-mission/research-mode";
import {
  DEFAULT_MISSION_OUTCOME,
  RESEARCH_FIRST_CONSTRAINT,
  RESEARCH_REFINE_AUDIENCE,
} from "@/lib/pilot-mission/pm-brief";

import { useSession } from "@/hooks/use-session";
import { clearPilotBrief, loadPilotBrief } from "@/lib/pilot/storage";
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
  const [audience, setAudience] = useState(RESEARCH_REFINE_AUDIENCE);
  const [outcome, setOutcome] = useState(DEFAULT_MISSION_OUTCOME);
  const [constraints, setConstraints] = useState(RESEARCH_FIRST_CONSTRAINT);
  const [researchMode, setResearchMode] = useState<ResearchMode>("combined");
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
    setAudience(restored.audience || RESEARCH_REFINE_AUDIENCE);
    setOutcome(restored.outcome || DEFAULT_MISSION_OUTCOME);
    setConstraints(restored.constraints || RESEARCH_FIRST_CONSTRAINT);
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
      clearPilotBrief();
      await queryClient.invalidateQueries({ queryKey: ["supervised"] });
      void navigate({
        to: "/command/supervised/$missionId",
        params: { missionId: result.mission.id },
      });
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : "The case could not be started."),
  });

  return (
    <section id="supervised-brief" className="cc-panel" aria-label="Supervised mission">
      <p className="cc-kicker">Start a mission</p>
      <h2 className="cc-panel-title">One business case. Specialists take it from here.</h2>
      <p className="cc-muted">
        Give a one-liner. A PM agent restates the problem, briefs plan, rough cost, time and team,
        then researches before asking you anything else. You approve gates — you are not interviewed
        for every field.
      </p>
      {home.data ? (
        <div className="ps-research-readiness" data-ready={home.data.researchProvider?.configured}>
          <p className="cc-muted text-sm mb-0">
            {home.data.providerLabel}
            {home.data.usage
              ? ` · Workspace usage ${home.data.usage.consumed} / ${home.data.usage.ceiling}`
              : ""}
          </p>
          {home.data.researchProvider ? (
            <p
              className="ps-research-readiness-chip"
              data-ready={home.data.researchProvider.configured}
              role="status"
              title={home.data.researchProvider.detail}
            >
              {home.data.researchProvider.label}
            </p>
          ) : null}
        </div>
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
          <p>A prepared brief is available in this browser. Use it as the one-liner, or edit below.</p>
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
        </div>
      )}
      {storageWarning && (
        <p className="cc-muted" role="status">
          This browser cannot keep an unsaved draft. Start the case before leaving.
        </p>
      )}
      <fieldset disabled={!draftReady || start.isPending} className="mt-4 grid gap-3">
        <label className="cc-label" htmlFor="supervised-question">
          Business case <span className="cc-muted text-xs">(one statement, 8–2,000 characters)</span>
        </label>
        <textarea
          id="supervised-question"
          className="cc-input cc-textarea"
          maxLength={2000}
          rows={3}
          placeholder="e.g. Should we charge for onboarding analytics before launch, or keep it free to learn faster?"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
        />

        <details className="ps-intake-advanced">
          <summary>Optional details (defaults are research-first)</summary>
          <div className="mt-3 grid gap-3">
            <label className="cc-label" htmlFor="supervised-audience">
              Audience override
            </label>
            <input
              id="supervised-audience"
              className="cc-input"
              maxLength={400}
              value={audience}
              onChange={(event) => setAudience(event.target.value)}
            />
            <label className="cc-label" htmlFor="supervised-outcome">
              Intended outcome
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
              Default is Combined: specialists research with available tools.
              {home.data?.researchProvider?.configured
                ? ` ${home.data.researchProvider.detail}`
                : " Without a search provider key, web results are not invented — gaps are marked on the record."}
            </p>
          </div>
        </details>

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
              (audience.length > 0 && audience.length > 400) ||
              home.isPending ||
              home.isError ||
              home.data?.ready !== true
            }
            onClick={() => start.mutate()}
          >
            {start.isPending ? "Briefing the PM…" : "Brief the PM"}
          </button>
        </div>
      </fieldset>
    </section>
  );
}
