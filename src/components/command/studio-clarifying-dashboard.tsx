import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useSession } from "@/hooks/use-session";
import { clearPilotBrief } from "@/lib/pilot/storage";
import { startSupervisedMission } from "@/lib/pilot-mission.functions";
import {
  buildStartBriefFromIntake,
  CLARIFYING_PRODUCT_TYPES,
  missionIntakeStorageKey,
  parseMissionIntake,
  type ClarifyingProductType,
  type MissionIntakeDraft,
} from "@/lib/mission-intake-draft";

function loadDraft(userId: string): MissionIntakeDraft | null {
  try {
    return parseMissionIntake(sessionStorage.getItem(missionIntakeStorageKey(userId)));
  } catch {
    return null;
  }
}

function saveDraft(userId: string, draft: MissionIntakeDraft) {
  try {
    sessionStorage.setItem(missionIntakeStorageKey(userId), JSON.stringify(draft));
  } catch {
    /* Draft is optional. */
  }
}

/**
 * Screen 4 — Optional clarifying questions before Aria starts the case.
 */
export function StudioClarifyingDashboard({ onBackToIdea }: { onBackToIdea: () => void }) {
  const { user } = useSession();
  const userId = user?.id ?? "";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<MissionIntakeDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const loaded = loadDraft(userId);
    setDraft(loaded);
    setHydrated(true);
    if (!loaded?.question.trim()) {
      onBackToIdea();
    }
  }, [userId, onBackToIdea]);

  useEffect(() => {
    if (!userId || !draft || !hydrated) return;
    saveDraft(userId, draft);
  }, [userId, draft, hydrated]);

  const start = useMutation({
    mutationFn: (input: { skippedClarifying: boolean; draft: MissionIntakeDraft }) => {
      if (!input.draft.question.trim()) {
        throw new Error("Your idea is missing. Go back and describe it first.");
      }
      const payload = buildStartBriefFromIntake(input.draft, {
        skippedClarifying: input.skippedClarifying,
      });
      return startSupervisedMission({ data: payload });
    },
    onSuccess: async (result) => {
      setError(null);
      if (userId) {
        try {
          sessionStorage.removeItem(missionIntakeStorageKey(userId));
          // The new project exists: the Studio home opens on the dashboard next time.
          sessionStorage.removeItem("dx-studio-entry-screen");
        } catch {
          /* Optional. */
        }
      }
      clearPilotBrief();
      await queryClient.invalidateQueries({ queryKey: ["supervised"] });
      void navigate({
        to: "/command/supervised/$missionId",
        params: { missionId: result.mission.id },
      });
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : "The investigation could not be started."),
  });

  const ideaPreview = useMemo(() => draft?.question.trim() ?? "", [draft]);

  function updateClarifying<K extends keyof MissionIntakeDraft>(
    key: K,
    value: MissionIntakeDraft[K],
  ) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  }

  if (!hydrated || !draft) {
    return (
      <div className="sd-shell" role="status">
        <p className="sd-empty">Opening clarifying questions…</p>
      </div>
    );
  }

  const busy = start.isPending;
  const productType = draft.clarifyProductType ?? "";

  return (
    <div className="sd-shell sd-shell-submission" data-studio-screen="clarifying">
      <div className="sd-topbar">
        <button type="button" className="sd-back" disabled={busy} onClick={onBackToIdea}>
          ← Edit idea
        </button>
        <p className="sd-brand">New project · step 2 of 2</p>
      </div>

      <section className="sd-card sd-submission-card" aria-labelledby="sd-clarify-title">
        <header className="sd-submission-heading">
          <p className="sd-aria-chip">
            <span className="sd-aria-dot" aria-hidden="true" />
            Aria — AI Product Manager
          </p>
          <h1 id="sd-clarify-title">A few optional questions</h1>
          <p className="sd-lede sd-aria-message">
            I can begin with what you’ve shared. To make the first investigation more useful, answer
            whichever of these you can.
          </p>
        </header>

        {ideaPreview ? (
          <p className="sd-idea-chip" role="status">
            <span>Your idea</span>
            <strong>{ideaPreview}</strong>
          </p>
        ) : null}

        <fieldset className="sd-clarify-fields" disabled={busy}>
          <label className="sd-submission-label" htmlFor="clarify-who">
            Who will use this first?
            <input
              id="clarify-who"
              className="cc-input"
              maxLength={400}
              value={draft.clarifyWho ?? ""}
              onChange={(event) => updateClarifying("clarifyWho", event.target.value)}
              placeholder="Optional"
              autoComplete="off"
            />
          </label>

          <label className="sd-submission-label" htmlFor="clarify-day-one">
            What should they be able to do on day one?
            <input
              id="clarify-day-one"
              className="cc-input"
              maxLength={500}
              value={draft.clarifyDayOne ?? ""}
              onChange={(event) => updateClarifying("clarifyDayOne", event.target.value)}
              placeholder="Optional"
              autoComplete="off"
            />
          </label>

          <fieldset className="sd-product-type">
            <legend>Is this a consumer app, business product, or internal tool?</legend>
            <div className="sd-context-chips" role="radiogroup" aria-label="Product type">
              {CLARIFYING_PRODUCT_TYPES.map((option) => {
                const selected = productType === option;
                return (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className={`sd-context-chip${selected ? " is-active" : ""}`}
                    onClick={() =>
                      updateClarifying(
                        "clarifyProductType",
                        (selected ? "" : option) as ClarifyingProductType,
                      )
                    }
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <label className="sd-submission-label" htmlFor="clarify-success">
            What does success look like after the first version?
            <input
              id="clarify-success"
              className="cc-input"
              maxLength={500}
              value={draft.clarifySuccess ?? ""}
              onChange={(event) => updateClarifying("clarifySuccess", event.target.value)}
              placeholder="Optional"
              autoComplete="off"
            />
          </label>
        </fieldset>

        {error ? (
          <p className="cc-error" role="alert">
            {error}
          </p>
        ) : null}

        <p className="sd-live-status" role="status" aria-live="polite">
          {busy ? "Opening your case for scope review with Aria…" : ""}
        </p>

        <div className="sd-clarify-actions">
          <button
            type="button"
            className="sd-btn sd-btn-ghost"
            disabled={busy}
            onClick={() => {
              const skipped: MissionIntakeDraft = {
                ...draft,
                clarifyWho: "",
                clarifyDayOne: "",
                clarifyProductType: "",
                clarifySuccess: "",
              };
              setDraft(skipped);
              start.mutate({ skippedClarifying: true, draft: skipped });
            }}
          >
            Skip for now
          </button>
          <button
            type="button"
            className="sd-btn sd-btn-primary"
            disabled={busy}
            onClick={() => start.mutate({ skippedClarifying: false, draft })}
          >
            {busy ? "Starting investigation…" : "Start investigation"}
          </button>
        </div>
        <p className="sd-note">Optional — Aria will state assumptions clearly.</p>
        <p className="sd-note">
          Research does not run until you approve the investigation plan on the next screen.
        </p>
      </section>
    </div>
  );
}
