import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Compass,
  GraduationCap,
  Lightbulb,
  Rocket,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { INTENT_LABELS } from "@/lib/workforce/types";
import { WORKFORCE_INTENTS } from "@/lib/marketing/workforce-summary";
import { intentForGoal } from "@/lib/onboarding-intent";
import { OnboardingStage } from "@/components/onboarding/onboarding-stage";
import { useQueryClient } from "@tanstack/react-query";
import { auth, type AppUser as User } from "@/lib/auth/client";
import { getMyProfileDraft, saveMyProfile, saveMyProfileDraft } from "@/lib/profile.functions";
import { myProfileQuery } from "@/lib/profile-queries";
import { BrandLogo } from "@/components/brand-logo";
import { DX_GOALS, DX_ROLES, DX_TEAM_SIZES, type DxProfile } from "@/lib/dx-profile";

export const Route = createFileRoute("/_authenticated/onboarding")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string | undefined } => ({
    redirect:
      typeof search["redirect"] === "string" ? safeProductRedirect(search["redirect"]) : undefined,
  }),
  head: () => ({
    meta: [{ title: "Set up your workspace — DeliverX" }, { name: "robots", content: "noindex" }],
  }),
  component: Onboarding,
});

import { claimStoredPilotRequest } from "@/lib/pilot/continuity";
import { getMyPilotContinuity } from "@/lib/pilot/enquiry.functions";
import { PILOT_PLAN_LABELS, type PilotPlan } from "@/lib/pilot/model";
import { loadPilotBrief, loadPilotClaim, loadPilotPlan } from "@/lib/pilot/storage";
import {
  contextComplete,
  directionComplete,
  EMPTY_SETUP,
  parseSetupDraft,
  restoreSetup,
  safeSetupStep,
  type SetupFields,
} from "@/lib/onboarding-draft";
import type { ProductBrief } from "@/lib/marketing/product-resources";
import { firstActionFor, safeProductRedirect } from "@/lib/product-journey";

const STEPS = ["Your context", "Product direction", "Review & enter"] as const;

const GOAL_META: Record<(typeof DX_GOALS)[number], { icon: LucideIcon; line: string }> = {
  "Validate a new idea": { icon: Lightbulb, line: "Check the evidence before you build." },
  "Build an MVP": { icon: Rocket, line: "Go from a question to a prototype you can review." },
  "Improve an existing product": {
    icon: TrendingUp,
    line: "Find what holds users back, then fix it.",
  },
  "Explore what's possible": { icon: Compass, line: "Compare directions before choosing one." },
  "Learn by building a product": {
    icon: GraduationCap,
    line: "Practise product craft on a real idea.",
  },
};

function Chips({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <div className="ob-chips" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o}
          type="button"
          aria-pressed={value === o}
          className={value === o ? "active" : ""}
          onClick={() => onChange(o)}
        >
          {value === o ? <Check className="size-3.5" aria-hidden="true" /> : null}
          {o}
        </button>
      ))}
    </div>
  );
}

function Onboarding() {
  const { user, profile } = Route.useRouteContext() as { user: User; profile: DxProfile | null };
  const { redirect } = Route.useSearch();
  return <OnboardingForm key={user.id} user={user} existing={profile} redirectTo={redirect} />;
}

export function OnboardingForm({
  user,
  existing,
  redirectTo,
}: {
  user: User;
  existing: DxProfile | null;
  redirectTo?: string | undefined;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [fields, setFields] = useState<SetupFields>(EMPTY_SETUP);
  const [step, setStep] = useState(0);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveNote, setSaveNote] = useState("");
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [prepared, setPrepared] = useState<ProductBrief | null>(null);
  const [chosenPlan, setChosenPlan] = useState<PilotPlan | null>(null);
  const [requestReference, setRequestReference] = useState<string | null>(null);
  const inFlight = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const draftKey = `dx-product-setup:${user.id}`;

  useEffect(() => {
    let active = true;
    let local = null;
    try {
      local = parseSetupDraft(sessionStorage.getItem(draftKey));
    } catch {
      setStorageAvailable(false);
    }
    const brief = loadPilotBrief();
    setPrepared(brief);
    setChosenPlan(loadPilotPlan());
    setRequestReference(loadPilotClaim()?.reference ?? null);
    const account = Promise.allSettled([
      existing ? Promise.resolve(null) : getMyProfileDraft(),
      existing
        ? Promise.resolve(null)
        : claimStoredPilotRequest().then(() => getMyPilotContinuity()),
    ]);
    let timeout: ReturnType<typeof setTimeout>;
    const deadline = new Promise<null>((resolve) => {
      timeout = setTimeout(() => resolve(null), 8000);
    });
    void Promise.race([account, deadline])
      .then((results) => {
        if (!active) return;
        const server = results?.[0].status === "fulfilled" ? results[0].value : null;
        const continuity = results?.[1].status === "fulfilled" ? results[1].value : null;
        const restored = restoreSetup({
          existing,
          local,
          server,
          brief: brief ?? continuity?.brief ?? null,
          accountName: user.user_metadata.full_name ?? "",
        });
        setFields(restored.fields);
        setStep(restored.step);
        if (continuity) {
          setChosenPlan(continuity.plan);
          setRequestReference(continuity.reference);
          setPrepared((current) => current ?? continuity.brief);
        }
        const failed = !results || results.some((r) => r.status === "rejected");
        setSaveNote(
          failed
            ? "Account draft could not be loaded. Review your answers; nothing has been submitted."
            : restored.source === "browser"
              ? "Your unfinished setup is restored from this tab."
              : restored.source === "account"
                ? "Your unfinished setup is restored from your account."
                : restored.source === "brief"
                  ? "Your prepared product question is carried forward."
                  : existing
                    ? "Review or update your saved setup."
                    : "Your answers shape the starting point. No mission runs during setup.",
        );
        setReady(true);
      })
      .finally(() => clearTimeout(timeout));
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [draftKey, existing, user.user_metadata.full_name]);

  useEffect(() => {
    if (!ready || existing) return;
    try {
      sessionStorage.setItem(
        draftKey,
        JSON.stringify({ ...fields, step, savedAt: new Date().toISOString() }),
      );
      setStorageAvailable(true);
    } catch {
      setStorageAvailable(false);
    }
  }, [ready, existing, draftKey, fields, step]);
  useEffect(() => {
    if (ready) heading.current?.focus();
  }, [step, ready]);
  const update = (key: keyof SetupFields, value: string) => {
    setFields((current) => ({ ...current, [key]: value }));
    setError(null);
  };
  const firstAction = firstActionFor(fields);
  const canNext = step === 0 ? contextComplete(fields) : directionComplete(fields);

  async function advance() {
    if (inFlight.current || !ready || !canNext) return;
    inFlight.current = true;
    setSaving(true);
    setError(null);
    try {
      if (!existing) {
        await saveMyProfileDraft({ data: fields });
        setSaveNote("Your setup draft is saved to your account.");
      }
      setStep((current) => Math.min(2, current + 1));
    } catch {
      setSaveNote(
        "Account draft could not be saved. Your answers remain here; retry before leaving this device.",
      );
      setStep((current) => Math.min(2, current + 1));
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  }
  async function finish() {
    if (inFlight.current || !ready) return;
    if (!contextComplete(fields) || !directionComplete(fields)) {
      setStep(safeSetupStep(2, fields));
      setError("Complete your context and product direction before continuing.");
      return;
    }
    inFlight.current = true;
    setSaving(true);
    setError(null);
    try {
      const profile = await saveMyProfile({ data: fields });
      void auth.updateName(profile.fullName).catch(() => null);
      queryClient.setQueryData(myProfileQuery.queryKey, profile);
      try {
        sessionStorage.removeItem(draftKey);
      } catch {
        /* Optional browser draft. */
      }
      const requested = safeProductRedirect(redirectTo);
      const target =
        requested !== "/command" && requested !== "/command/programmes"
          ? requested
          : firstActionFor(profile).href;
      await navigate({ to: target, replace: true });
    } catch {
      setError(
        "We couldn’t finish setup. Your answers remain here. Check your connection or sign in again, then retry.",
      );
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  }

  return (
    <div className="dxs ob-page setup-page">
      <header className="setup-header">
        <BrandLogo to="/" tagline="Product Super Intelligence" />
        <Link to="/" className="setup-home-link">
          Back to DeliverX <ArrowRight size={14} />
        </Link>
      </header>
      <div className="setup-layout">
        <aside className="setup-story">
          <p className="dxl-eyebrow">Your product starts here</p>
          <h2>Three questions. Then your team.</h2>
          <p>
            Your answers shape the first mission we propose. Nothing runs until you approve a plan.
          </p>
          <OnboardingStage step={step} fields={fields} />
          <small>
            Setup saves your context only. It does not run agents, approve a mission or activate a
            paid pilot.
          </small>
        </aside>
        <main className="setup-main">
          <ol className="setup-progress" aria-label="Setup progress">
            {STEPS.map((label, i) => (
              <li
                key={label}
                aria-current={i === step ? "step" : undefined}
                className={i === step ? "is-current" : i < step ? "is-done" : ""}
              >
                <span>{i < step ? <Check size={13} /> : i + 1}</span>
                {label}
              </li>
            ))}
          </ol>
          <form
            className="setup-card"
            onSubmit={(event) => {
              event.preventDefault();
              void (step === 2 ? finish() : advance());
            }}
            aria-busy={!ready || saving}
          >
            {!ready ? (
              <div className="setup-loading" role="status">
                <h1>Restoring your starting point…</h1>
                <p>Checking your account and this browser for an unfinished setup.</p>
              </div>
            ) : (
              <>
                <p className="setup-step-number">Step {step + 1} of 3</p>
                <h1 ref={heading} tabIndex={-1}>
                  {step === 0
                    ? "Who is building?"
                    : step === 1
                      ? "What are you building towards?"
                      : "Review and open your workspace."}
                </h1>
                <p className="setup-description">
                  {step === 0
                    ? "Your role and team size decide how much the specialists explain and which decisions come to you first."
                    : step === 1
                      ? "Pick a goal and, if you have one, the product question. You can refine both before any mission is planned."
                      : "This is what the workspace will start from. Opening it saves your setup, not a running mission."}
                </p>
                <fieldset disabled={saving} className="setup-fields">
                  {step === 0 && (
                    <>
                      <label className="ob-label" htmlFor="ob-name">
                        Your name
                      </label>
                      <input
                        id="ob-name"
                        className="ob-input"
                        autoComplete="name"
                        required
                        minLength={2}
                        maxLength={80}
                        value={fields.fullName}
                        onChange={(e) => update("fullName", e.target.value)}
                      />
                      <p className="ob-label">Your role</p>
                      <Chips
                        options={DX_ROLES}
                        value={fields.role}
                        onChange={(value) => update("role", value)}
                        label="Your role"
                      />
                      <p className="ob-label">Team size</p>
                      <Chips
                        options={DX_TEAM_SIZES}
                        value={fields.teamSize}
                        onChange={(value) => update("teamSize", value)}
                        label="Team size"
                      />
                    </>
                  )}
                  {step === 1 && (
                    <>
                      <p className="ob-label">Your main goal</p>
                      <div className="setup-goals" role="radiogroup" aria-label="Main goal">
                        {DX_GOALS.map((goal) => {
                          const meta = GOAL_META[goal];
                          return (
                            <button
                              key={goal}
                              type="button"
                              role="radio"
                              aria-checked={fields.goal === goal}
                              onClick={() => update("goal", goal)}
                            >
                              <meta.icon size={20} aria-hidden="true" />
                              <span>
                                <strong>{goal}</strong>
                                <small>{meta.line}</small>
                              </span>
                              {fields.goal === goal && <Check size={16} aria-hidden="true" />}
                            </button>
                          );
                        })}
                      </div>
                      <label className="ob-label" htmlFor="ob-idea">
                        Your product question <span>(optional)</span>
                      </label>
                      <textarea
                        id="ob-idea"
                        className="ob-input"
                        rows={4}
                        maxLength={1000}
                        value={fields.firstIdea}
                        onChange={(e) => update("firstIdea", e.target.value)}
                        placeholder="Which onboarding change should we investigate first?"
                        aria-describedby="setup-question-help"
                      />
                      <p className="setup-help" id="setup-question-help">
                        Keep it specific. Leave out personal data about real people. The question
                        stays out of the address.
                      </p>
                      {fields.goal === "Learn by building a product" && (
                        <p className="setup-learning-note">
                          You’ll learn through the same evidence, decisions and reviewable work as a
                          product team. Explanations can help you reflect; evidence standards stay
                          the same.
                        </p>
                      )}
                    </>
                  )}
                  {step === 2 && (
                    <>
                      <div className="setup-review">
                        <div>
                          <span>Your context</span>
                          <strong>
                            {fields.fullName} · {fields.role} · {fields.teamSize}
                          </strong>
                          <button type="button" onClick={() => setStep(0)}>
                            Edit context
                          </button>
                        </div>
                        <div>
                          <span>Product direction</span>
                          <strong>{fields.goal}</strong>
                          <p>
                            {fields.firstIdea.trim() ||
                              "No question yet. You can write one in the workspace."}
                          </p>
                          <button type="button" onClick={() => setStep(1)}>
                            Edit direction
                          </button>
                        </div>
                      </div>
                      {prepared && (
                        <div className="setup-prepared">
                          <Check size={17} aria-hidden="true" />
                          <div>
                            <strong>Prepared brief available</strong>
                            <p>
                              Your audience, objective and constraints can prefill the mission
                              intake. Supplied evidence is reviewed after the brief is saved.
                            </p>
                          </div>
                        </div>
                      )}
                      <aside className="setup-next">
                        <span>Your first mission</span>
                        <h2>{firstAction.label}</h2>
                        <p>{firstAction.reason}</p>
                        <ul className="setup-next-facts">
                          <li>
                            <small>Mission type</small>
                            {INTENT_LABELS[intentForGoal(fields.goal)]}
                          </li>
                          <li>
                            <small>Starting team</small>
                            {WORKFORCE_INTENTS[intentForGoal(fields.goal)].length} specialists
                          </li>
                          <li>
                            <small>Before it runs</small>
                            You approve the plan
                          </li>
                        </ul>
                      </aside>
                      {chosenPlan && (
                        <p className="setup-help">
                          Chosen offer: {PILOT_PLAN_LABELS[chosenPlan]}
                          {requestReference ? ` · Request ${requestReference}` : ""}. Account setup
                          does not activate a paid pilot.
                        </p>
                      )}
                    </>
                  )}
                </fieldset>
                <p className="setup-save-note" role="status">
                  {saveNote}
                </p>
                {!storageAvailable && (
                  <p className="setup-storage-warning" role="status">
                    This browser cannot keep a draft. Continue to save each completed step to your
                    account; unsaved edits may be lost on refresh.
                  </p>
                )}
                {error && (
                  <div className="setup-error" role="alert">
                    <p>{error}</p>
                    <Link to="/login" search={{ redirect: safeProductRedirect(redirectTo) }}>
                      Return to sign-in
                    </Link>
                  </div>
                )}
                <div className="setup-actions">
                  {step > 0 ? (
                    <button
                      type="button"
                      className="ob-btn ob-btn-ghost"
                      disabled={saving}
                      onClick={() => setStep((s) => s - 1)}
                    >
                      <ArrowLeft size={15} /> Back
                    </button>
                  ) : (
                    <span />
                  )}
                  <button
                    type="submit"
                    className="ob-btn ob-btn-primary"
                    disabled={saving || !canNext}
                  >
                    {saving ? "Saving…" : step === 2 ? "Open my workspace" : "Continue"}
                    <ArrowRight size={15} />
                  </button>
                </div>
              </>
            )}
          </form>
        </main>
      </div>
    </div>
  );
}
