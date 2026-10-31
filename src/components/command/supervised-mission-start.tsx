import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { myProfileQuery } from "@/lib/profile-queries";
import { getSupervisedMissionHome, startSupervisedMission } from "@/lib/pilot-mission.functions";
import { RESEARCH_MODE_LABELS, type ResearchMode } from "@/lib/pilot-mission/research-mode";
import {
  DEFAULT_MISSION_OUTCOME,
  RESEARCH_FIRST_CONSTRAINT,
  RESEARCH_REFINE_AUDIENCE,
} from "@/lib/pilot-mission/pm-brief";
import { buildInvestigationCommitment } from "@/lib/pilot-mission/investigation-commitment";
import type { InvestigationAllowanceLoad } from "@/lib/pilot/paid-availability";
import { findSimilarIdeas } from "@/lib/pilot-mission/similar-ideas";

import { useSession } from "@/hooks/use-session";
import { clearPilotBrief, loadPilotBrief } from "@/lib/pilot/storage";
import type { ProductBrief } from "@/lib/marketing/product-resources";
import {
  parseMissionIntake,
  preparedMissionIntake,
  restoreMissionIntake,
} from "@/lib/mission-intake-draft";
import { VoiceControls } from "@/components/command/voice-controls";

function investigationAllowanceLoadFromHome(home: {
  investigationAllowance: {
    remaining: number;
    missionAllowance: number;
    missionsConsumed: number;
  } | null;
  investigationAllowanceLoad?: "active" | "demo" | "failed";
  investigationAllowanceLoadReason?: string | null;
}): InvestigationAllowanceLoad {
  if (home.investigationAllowanceLoad === "demo") return { status: "demo" };
  if (home.investigationAllowanceLoad === "failed") {
    return {
      status: "failed",
      reason:
        home.investigationAllowanceLoadReason ??
        "Investigation allowance could not be read from storage.",
    };
  }
  if (home.investigationAllowance) {
    return { status: "active", snapshot: home.investigationAllowance };
  }
  return { status: "demo" };
}

function allowanceStatusSuffix(home: {
  investigationAllowance: { remaining: number } | null;
  investigationAllowanceLoad?: "active" | "demo" | "failed";
  usage: { ceiling: number; consumed: number } | null;
}): string {
  if (home.investigationAllowanceLoad === "failed") return "";
  if (home.investigationAllowance) {
    const n = home.investigationAllowance.remaining;
    return ` · ${n} Investigation${n === 1 ? "" : "s"} left on plan`;
  }
  if (home.usage) {
    const left = Math.max(0, home.usage.ceiling - home.usage.consumed);
    return ` · Demo ceiling: ${left} of ${home.usage.ceiling} units`;
  }
  return " · No pilot plan (demo mode)";
}

export function SupervisedMissionStart({
  tone = "hero",
  seedQuestion,
}: {
  /** hero = first-viewport brief; secondary = quieter form below a Continue stage */
  tone?: "hero" | "secondary";
  /** Optional omni intent pill — fills the one-liner; start still requires an explicit click. */
  seedQuestion?: string | null;
}) {
  const { user } = useSession();
  return user ? (
    <MissionStartForm
      key={user.id}
      userId={user.id}
      tone={tone}
      {...(seedQuestion !== undefined ? { seedQuestion } : {})}
    />
  ) : null;
}

function MissionStartForm({
  userId,
  tone,
  seedQuestion,
}: {
  userId: string;
  tone: "hero" | "secondary";
  seedQuestion?: string | null;
}) {
  const profile = useQuery(myProfileQuery);
  const home = useQuery({
    queryKey: ["supervised", "home"],
    queryFn: () => getSupervisedMissionHome(),
  });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [question, setQuestion] = useState("");
  const [audience, setAudience] = useState("");
  const [budget, setBudget] = useState("");
  const [timeline, setTimeline] = useState("");
  const [platform, setPlatform] = useState("");
  const [existingAssets, setExistingAssets] = useState("");
  const [outcome, setOutcome] = useState(DEFAULT_MISSION_OUTCOME);
  const [constraints, setConstraints] = useState("");
  const [intakeEvidenceNote, setIntakeEvidenceNote] = useState("");
  const [researchMode, setResearchMode] = useState<ResearchMode>("combined");
  const [error, setError] = useState<string | null>(null);
  const [speakReplies, setSpeakReplies] = useState(false);
  const [voiceBusy, setVoiceBusy] = useState(false);

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
    setAudience(restored.audience || "");
    setBudget(restored.budget ?? "");
    setTimeline(restored.timeline ?? "");
    setPlatform(restored.platform ?? "");
    setExistingAssets(restored.existingAssets ?? "");
    setOutcome(restored.outcome || DEFAULT_MISSION_OUTCOME);
    setConstraints(restored.constraints || "");
    setIntakeEvidenceNote(restored.intakeEvidenceNote ?? "");
    hydratedUser.current = userId;
    setDraftReady(true);
  }, [userId, profile.isLoading, profile.data]);
  useEffect(() => {
    const seed = seedQuestion?.trim();
    if (!seed || !draftReady) return;
    setQuestion(seed);
  }, [seedQuestion, draftReady]);
  useEffect(() => {
    if (!draftReady || !draftKey) return;
    try {
      sessionStorage.setItem(
        draftKey,
        JSON.stringify({
          question,
          audience,
          outcome,
          constraints,
          intakeEvidenceNote,
          budget,
          timeline,
          platform,
          existingAssets,
        }),
      );
    } catch {
      setStorageWarning(true);
    }
  }, [
    draftReady,
    draftKey,
    question,
    audience,
    outcome,
    constraints,
    intakeEvidenceNote,
    budget,
    timeline,
    platform,
    existingAssets,
  ]);

  const start = useMutation({
    mutationFn: () =>
      startSupervisedMission({
        data: {
          question: question.trim(),
          audience: audience.trim() || RESEARCH_REFINE_AUDIENCE,
          outcome: outcome.trim() || DEFAULT_MISSION_OUTCOME,
          constraints: [
            constraints.trim() || RESEARCH_FIRST_CONSTRAINT,
            [
              budget.trim() && `Budget: ${budget.trim()}`,
              timeline.trim() && `Timeline: ${timeline.trim()}`,
              platform.trim() && `Platform: ${platform.trim()}`,
              existingAssets.trim() && `Existing assets: ${existingAssets.trim()}`,
            ]
              .filter(Boolean)
              .join("\n"),
          ]
            .filter(Boolean)
            .join("\n\n"),
          researchMode,
          intakeEvidenceNote: intakeEvidenceNote.trim() || null,
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

  const isHero = tone === "hero";
  const similar = useMemo(() => {
    const prior =
      home.data?.ready === true
        ? home.data.missions.map((m) => ({ id: m.id, question: m.question }))
        : [];
    return findSimilarIdeas(question, prior, 3);
  }, [home.data, question]);

  const commitment = useMemo(() => {
    if (!home.data?.ready) return null;
    return buildInvestigationCommitment({
      question,
      researchMode,
      researchProviderConfigured: Boolean(home.data.researchProvider?.configured),
      researchProviderLabel:
        home.data.researchProvider?.label ?? home.data.providerLabel ?? "Not configured",
      allowanceLoad: investigationAllowanceLoadFromHome(home.data),
      workspaceUsage: home.data.usage,
      canStart: home.data.canStartInvestigation === true,
      blockedReason: home.data.startInvestigationBlockedReason,
    });
  }, [home.data, question, researchMode]);

  return (
    <section
      id="supervised-brief"
      className={isHero ? "ps-foyer-brief" : "ps-foyer-brief ps-foyer-brief-secondary"}
      aria-label="Supervised mission"
    >
      {isHero ? (
        <>
          <label className="ps-brief-prompt" htmlFor="supervised-question">
            Your idea
          </label>
        </>
      ) : (
        <>
          <p className="ps-foyer-act">New case</p>
          <h3 className="ps-brief-heading">One statement is enough</h3>
        </>
      )}
      {home.data && isHero ? (
        <details className="ps-intake-advanced">
          <summary>Plan allowance &amp; research providers</summary>
          <p className="ps-brief-status mt-2" role="status">
            {home.data.researchProvider?.configured
              ? home.data.researchProvider.label
              : home.data.providerLabel}
            {home.data.ready ? allowanceStatusSuffix(home.data) : ""}
          </p>
        </details>
      ) : home.data ? (
        <p className="ps-brief-status" role="status">
          {home.data.researchProvider?.configured
            ? home.data.researchProvider.label
            : home.data.providerLabel}
          {home.data.ready ? allowanceStatusSuffix(home.data) : ""}
        </p>
      ) : null}
      {home.data?.ready && home.data.investigationAllowanceLoad === "failed" ? (
        <p className="cc-error" role="alert">
          {home.data.investigationAllowanceLoadReason}
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
      {home.data?.ready && home.data.startInvestigationBlockedReason ? (
        <p className="cc-error" role="alert">
          {home.data.startInvestigationBlockedReason}
        </p>
      ) : null}
      {prepared && (
        <div className="intake-prepared-note">
          <p>
            A prepared brief is available in this browser. Use it as the one-liner, or edit below.
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
        </div>
      )}
      {storageWarning && (
        <p className="cc-muted" role="status">
          This browser cannot keep an unsaved draft. Start the case before leaving.
        </p>
      )}
      <fieldset disabled={!draftReady || start.isPending} className="ps-brief-fields">
        {!isHero ? (
          <label className="cc-label" htmlFor="supervised-question">
            Business case
          </label>
        ) : null}
        <textarea
          id="supervised-question"
          className="cc-input cc-textarea ps-brief-textarea"
          maxLength={2000}
          rows={isHero ? 3 : 3}
          placeholder="e.g. Build an app that helps small restaurants reduce food waste."
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          disabled={voiceBusy}
        />

        <p className="ps-idea-later-note">
          One sentence is enough. You can add or change details later.
        </p>

        <details className="ps-intake-advanced ps-idea-context">
          <summary>
            <span>Add context</span>
            <span className="ps-idea-optional">Optional</span>
          </summary>
          <p className="ps-idea-context-help">
            Share anything you already know. Skip the rest; we’ll ask only useful follow-up
            questions.
          </p>
          <div className="ps-idea-grid">
            <label htmlFor="supervised-audience">
              Target users
              <input
                id="supervised-audience"
                className="cc-input"
                maxLength={400}
                value={audience}
                onChange={(event) => setAudience(event.target.value)}
                placeholder="e.g. Small restaurant owners"
              />
            </label>
            <label htmlFor="supervised-budget">
              Budget
              <input
                id="supervised-budget"
                className="cc-input"
                maxLength={120}
                value={budget}
                onChange={(event) => setBudget(event.target.value)}
                placeholder="e.g. £10k–£50k"
              />
            </label>
            <label htmlFor="supervised-timeline">
              Timeline
              <input
                id="supervised-timeline"
                className="cc-input"
                maxLength={120}
                value={timeline}
                onChange={(event) => setTimeline(event.target.value)}
                placeholder="e.g. 3–6 months"
              />
            </label>
            <label htmlFor="supervised-platform">
              Platform
              <select
                id="supervised-platform"
                className="cc-input"
                value={platform}
                onChange={(event) => setPlatform(event.target.value)}
              >
                <option value="">Choose if known</option>
                <option value="Web">Web</option>
                <option value="Mobile app">Mobile app</option>
                <option value="Internal tool">Internal tool</option>
                <option value="Web and mobile">Web and mobile</option>
                <option value="Not sure yet">Not sure yet</option>
              </select>
            </label>
            <label htmlFor="supervised-assets">
              Existing assets
              <input
                id="supervised-assets"
                className="cc-input"
                maxLength={500}
                value={existingAssets}
                onChange={(event) => setExistingAssets(event.target.value)}
                placeholder="e.g. Research, designs, code"
              />
            </label>
            <label htmlFor="supervised-constraints">
              Constraints
              <input
                id="supervised-constraints"
                className="cc-input"
                maxLength={2000}
                value={constraints}
                onChange={(event) => setConstraints(event.target.value)}
                placeholder="e.g. Must integrate with our POS"
              />
            </label>
          </div>
        </details>

        <details className="ps-intake-advanced ps-idea-more">
          <summary>Research setup and evidence (optional)</summary>
          <div className="mt-3 grid gap-3">
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
            <label className="cc-label" htmlFor="supervised-intake-evidence">
              Evidence notes (text only)
            </label>
            <textarea
              id="supervised-intake-evidence"
              className="cc-input cc-textarea"
              rows={3}
              maxLength={2000}
              placeholder="Optional quotes, call notes, or survey excerpts."
              value={intakeEvidenceNote}
              onChange={(event) => setIntakeEvidenceNote(event.target.value)}
            />
          </div>
        </details>

        <details className="ps-intake-advanced ps-idea-more">
          <summary>Or use voice</summary>
          <div className="ps-brief-voice-inline" aria-label="Voice idea input">
            <p className="cc-muted text-xs mb-2">
              Voice transcript fills the idea above. Review it before continuing.
            </p>
            <VoiceControls
              disabled={!draftReady || start.isPending}
              speakReplies={speakReplies}
              onSpeakRepliesChange={setSpeakReplies}
              onBusyChange={setVoiceBusy}
              onTranscript={(text) => {
                const line = text.trim();
                if (!line) return;
                setQuestion((current) => (current.trim() ? `${current.trim()} ${line}` : line));
              }}
            />
          </div>
        </details>

        {commitment ? (
          <details className="ps-commitment">
            <summary>Before you start — commitment</summary>
            <p className="text-sm mt-2">{commitment.interpretation}</p>
            <h4 className="text-xs font-medium mt-3 mb-1">Scope</h4>
            <ul className="cc-muted text-xs">
              {commitment.scope.map((line) => (
                <li key={line.slice(0, 40)}>{line}</li>
              ))}
            </ul>
            <h4 className="text-xs font-medium mt-2 mb-1">Sources</h4>
            <ul className="cc-muted text-xs">
              {commitment.sources.map((line) => (
                <li key={line.slice(0, 40)}>{line}</li>
              ))}
            </ul>
            <h4 className="text-xs font-medium mt-2 mb-1">Limits</h4>
            <ul className="cc-muted text-xs">
              {commitment.limits.map((line) => (
                <li key={line.slice(0, 40)}>{line}</li>
              ))}
            </ul>
            <p className="text-sm mt-2" role="status">
              {commitment.allowanceLine}
            </p>
            <p className="cc-muted text-xs mt-1 mb-0">{commitment.attachmentsNote}</p>
          </details>
        ) : null}
        {similar.length > 0 ? (
          <div
            className="ps-similar-ideas"
            role="region"
            aria-label="Similar cases in this workspace"
          >
            <p className="cc-muted text-xs mb-2">
              Similar cases already in this workspace (suggestion only — nothing is merged):
            </p>
            <ul className="ps-similar-ideas-list">
              {similar.map((item) => (
                <li key={item.missionId}>
                  <Link
                    to="/command/supervised/$missionId"
                    params={{ missionId: item.missionId }}
                    className="ps-similar-ideas-link"
                  >
                    {item.question}
                  </Link>
                  <p className="cc-muted text-xs mb-0">{item.basis.join(" · ")}</p>
                </li>
              ))}
            </ul>
            <p className="cc-muted text-xs mt-2 mb-0">
              Open an existing case to continue it, or start a separate Investigation below.
            </p>
          </div>
        ) : null}
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
              home.data?.ready !== true ||
              home.data?.canStartInvestigation === false
            }
            onClick={() => start.mutate()}
          >
            {start.isPending ? "Preparing scope review…" : "Continue to scope review"}
          </button>
        </div>
      </fieldset>
    </section>
  );
}
