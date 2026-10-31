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
  missionIntakeStorageKey,
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

export const EXAMPLE_PRODUCT_IDEA = "Build an app that helps small restaurants reduce food waste.";

type MissionStartTone = "hero" | "secondary" | "submission";

type ContextChipId = "audience" | "platform" | "budget" | "timeline" | "constraints";

const CONTEXT_CHIPS: Array<{ id: ContextChipId; label: string }> = [
  { id: "audience", label: "Target users" },
  { id: "platform", label: "Platform" },
  { id: "budget", label: "Budget" },
  { id: "timeline", label: "Timeline" },
  { id: "constraints", label: "Constraints" },
];

export function SupervisedMissionStart({
  tone = "hero",
  seedQuestion,
  onContinueToClarifying,
}: {
  /** hero = foyer brief; secondary = quieter; submission = Screen 3 idea form */
  tone?: MissionStartTone;
  /** Optional omni intent pill — fills the one-liner; start still requires an explicit click. */
  seedQuestion?: string | null;
  /** Screen 3 → Screen 4. When set, submission validates then continues instead of creating a mission. */
  onContinueToClarifying?: () => void;
}) {
  const { user } = useSession();
  return user ? (
    <MissionStartForm
      key={user.id}
      userId={user.id}
      tone={tone}
      {...(seedQuestion !== undefined ? { seedQuestion } : {})}
      {...(onContinueToClarifying ? { onContinueToClarifying } : {})}
    />
  ) : null;
}

function MissionStartForm({
  userId,
  tone,
  seedQuestion,
  onContinueToClarifying,
}: {
  userId: string;
  tone: MissionStartTone;
  seedQuestion?: string | null;
  onContinueToClarifying?: () => void;
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
  const [openContext, setOpenContext] = useState<Set<ContextChipId>>(() => new Set());
  const [moreContextOpen, setMoreContextOpen] = useState(false);
  const [attemptedEmpty, setAttemptedEmpty] = useState(false);
  const hydratedUser = useRef<string | null>(null);
  const questionRef = useRef<HTMLTextAreaElement | null>(null);
  const draftKey = missionIntakeStorageKey(userId);
  const isSubmission = tone === "submission";
  useEffect(() => {
    if (profile.isLoading || hydratedUser.current === userId) return;
    let local = null;
    try {
      local = parseMissionIntake(sessionStorage.getItem(draftKey));
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
    if (restored.researchMode) setResearchMode(restored.researchMode);
    hydratedUser.current = userId;
    setDraftReady(true);
  }, [userId, profile.isLoading, profile.data, draftKey]);
  useEffect(() => {
    const seed = seedQuestion?.trim();
    if (!seed || !draftReady) return;
    setQuestion(seed);
  }, [seedQuestion, draftReady]);
  useEffect(() => {
    if (!draftReady || !draftKey) return;
    try {
      const previous = parseMissionIntake(sessionStorage.getItem(draftKey));
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
          researchMode,
          clarifyWho: previous?.clarifyWho ?? "",
          clarifyDayOne: previous?.clarifyDayOne ?? "",
          clarifyProductType: previous?.clarifyProductType ?? "",
          clarifySuccess: previous?.clarifySuccess ?? "",
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
    researchMode,
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
      setAttemptedEmpty(false);
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
  const ideaTooShort = question.trim().length > 0 && question.trim().length < 8;
  const ideaBlank = question.trim().length === 0;
  const startBlocked =
    !draftReady ||
    start.isPending ||
    (audience.length > 0 && audience.length > 400) ||
    home.isPending ||
    home.isError ||
    home.data?.ready !== true ||
    home.data?.canStartInvestigation === false;

  function toggleContextChip(id: ContextChipId) {
    setOpenContext((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function requestStart() {
    if (ideaBlank) {
      setAttemptedEmpty(true);
      setError("Enter a product idea to start.");
      questionRef.current?.focus();
      return;
    }
    if (ideaTooShort) {
      setAttemptedEmpty(true);
      setError("Add a bit more detail — one or two lines is enough.");
      questionRef.current?.focus();
      return;
    }
    setAttemptedEmpty(false);
    setError(null);
    if (isSubmission && onContinueToClarifying) {
      try {
        const previous = parseMissionIntake(sessionStorage.getItem(draftKey));
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
            researchMode,
            clarifyWho: previous?.clarifyWho ?? "",
            clarifyDayOne: previous?.clarifyDayOne ?? "",
            clarifyProductType: previous?.clarifyProductType ?? "",
            clarifySuccess: previous?.clarifySuccess ?? "",
          }),
        );
      } catch {
        setStorageWarning(true);
      }
      onContinueToClarifying();
      return;
    }
    if (startBlocked) return;
    start.mutate();
  }
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

  const statusBlock = (
    <>
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
      {storageWarning && (
        <p className="cc-muted" role="status">
          This browser cannot keep an unsaved draft. Start the case before leaving.
        </p>
      )}
    </>
  );

  if (isSubmission) {
    const validationId = "supervised-idea-validation";
    const showValidation = attemptedEmpty && (ideaBlank || ideaTooShort);
    return (
      <section
        id="supervised-brief"
        className="ps-foyer-brief sd-submission-form"
        aria-label="Idea submission"
      >
        <header className="sd-submission-heading">
          <h1 id="sd-submission-title">What do you want to build?</h1>
          <p className="sd-lede">
            One or two lines is enough. Aria and the team take it from there.
          </p>
        </header>

        {statusBlock}

        {prepared ? (
          <div className="intake-prepared-note">
            <p>A prepared brief is available in this browser.</p>
            <button
              type="button"
              className="sd-btn sd-btn-ghost"
              disabled={!draftReady || start.isPending}
              onClick={() => {
                const next = preparedMissionIntake(prepared);
                setQuestion(next.question);
                setAudience(next.audience);
                setOutcome(next.outcome);
                setConstraints(next.constraints);
                setAttemptedEmpty(false);
                setError(null);
              }}
            >
              Use prepared brief
            </button>
          </div>
        ) : null}

        <form
          className="sd-submission-fields"
          onSubmit={(event) => {
            event.preventDefault();
            requestStart();
          }}
          noValidate
        >
          <fieldset disabled={!draftReady || start.isPending}>
            <label className="sd-submission-label" htmlFor="supervised-question">
              Product idea
            </label>
            <textarea
              ref={questionRef}
              id="supervised-question"
              className={`cc-input cc-textarea ps-brief-textarea sd-submission-textarea${
                showValidation ? " is-invalid" : ""
              }`}
              maxLength={2000}
              rows={4}
              placeholder={EXAMPLE_PRODUCT_IDEA}
              value={question}
              aria-invalid={showValidation || undefined}
              aria-describedby={showValidation ? validationId : undefined}
              onChange={(event) => {
                setQuestion(event.target.value);
                if (attemptedEmpty) setAttemptedEmpty(false);
                if (error) setError(null);
              }}
              disabled={voiceBusy}
            />
            <p className="sd-example-row">
              No idea yet?{" "}
              <button
                type="button"
                className="sd-link-btn"
                disabled={!draftReady || start.isPending}
                onClick={() => {
                  setQuestion(EXAMPLE_PRODUCT_IDEA);
                  setAttemptedEmpty(false);
                  setError(null);
                  questionRef.current?.focus();
                }}
              >
                Try an example
              </button>
            </p>

            <details className="sd-add-details">
              <summary>Add details (optional)</summary>
              <div className="sd-context-chips" role="group" aria-label="Optional context">
                {CONTEXT_CHIPS.map((chip) => {
                  const active = openContext.has(chip.id);
                  const filled =
                    (chip.id === "audience" && audience.trim()) ||
                    (chip.id === "platform" && platform.trim()) ||
                    (chip.id === "budget" && budget.trim()) ||
                    (chip.id === "timeline" && timeline.trim()) ||
                    (chip.id === "constraints" && constraints.trim());
                  return (
                    <button
                      key={chip.id}
                      type="button"
                      className={`sd-context-chip${active ? " is-active" : ""}${
                        filled ? " is-filled" : ""
                      }`}
                      aria-pressed={active}
                      onClick={() => toggleContextChip(chip.id)}
                    >
                      {chip.label}
                    </button>
                  );
                })}
                <button
                  type="button"
                  className={`sd-context-chip sd-context-chip-more${
                    moreContextOpen ? " is-active" : ""
                  }`}
                  aria-pressed={moreContextOpen}
                  onClick={() => setMoreContextOpen((open) => !open)}
                >
                  + Add more context
                </button>
              </div>

              {openContext.has("audience") ? (
                <label className="sd-submission-label" htmlFor="supervised-audience">
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
              ) : null}
              {openContext.has("platform") ? (
                <label className="sd-submission-label" htmlFor="supervised-platform">
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
              ) : null}
              {openContext.has("budget") ? (
                <label className="sd-submission-label" htmlFor="supervised-budget">
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
              ) : null}
              {openContext.has("timeline") ? (
                <label className="sd-submission-label" htmlFor="supervised-timeline">
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
              ) : null}
              {openContext.has("constraints") ? (
                <label className="sd-submission-label" htmlFor="supervised-constraints">
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
              ) : null}

              {moreContextOpen ? (
                <div className="sd-more-context">
                  <label className="sd-submission-label" htmlFor="supervised-assets">
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
                  <label className="sd-submission-label" htmlFor="supervised-research-mode">
                    Research mode
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
                  </label>
                  <label className="sd-submission-label" htmlFor="supervised-intake-evidence">
                    Evidence notes (text only)
                    <textarea
                      id="supervised-intake-evidence"
                      className="cc-input cc-textarea"
                      rows={3}
                      maxLength={2000}
                      placeholder="Optional quotes, call notes, or survey excerpts."
                      value={intakeEvidenceNote}
                      onChange={(event) => setIntakeEvidenceNote(event.target.value)}
                    />
                  </label>
                  <details className="ps-intake-advanced">
                    <summary>Or use voice</summary>
                    <div className="ps-brief-voice-inline" aria-label="Voice idea input">
                      <VoiceControls
                        disabled={!draftReady || start.isPending}
                        speakReplies={speakReplies}
                        onSpeakRepliesChange={setSpeakReplies}
                        onBusyChange={setVoiceBusy}
                        onTranscript={(text) => {
                          const line = text.trim();
                          if (!line) return;
                          setQuestion((current) =>
                            current.trim() ? `${current.trim()} ${line}` : line,
                          );
                        }}
                      />
                    </div>
                  </details>
                </div>
              ) : null}
            </details>

            {similar.length > 0 ? (
              <div
                className="ps-similar-ideas"
                role="region"
                aria-label="Similar cases in this workspace"
              >
                <p className="cc-muted text-xs mb-2">
                  Similar cases already in this workspace (suggestion only):
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
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {showValidation || error ? (
              <p id={validationId} className="cc-error" role="alert">
                {error ??
                  (ideaBlank
                    ? "Enter a product idea to start."
                    : "Add a bit more detail — one or two lines is enough.")}
              </p>
            ) : null}

            <div className="sd-submission-actions">
              <button
                type="submit"
                className="sd-btn sd-btn-primary sd-btn-block"
                disabled={!draftReady || (!ideaBlank && home.data?.canStartInvestigation === false)}
              >
                Start
              </button>
              <p className="sd-note">Nothing runs until you approve the plan.</p>
            </div>
          </fieldset>
        </form>
      </section>
    );
  }

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
      {statusBlock}
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
          rows={3}
          placeholder={`e.g. ${EXAMPLE_PRODUCT_IDEA}`}
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
            disabled={startBlocked || question.trim().length < 8}
            onClick={() => requestStart()}
          >
            {start.isPending ? "Preparing scope review…" : "Continue to scope review"}
          </button>
        </div>
      </fieldset>
    </section>
  );
}
