import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
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
import { firstActionFor, safeProductRedirect } from "@/lib/product-journey";

const STEPS = ["About you", "Your goal", "Question"] as const;

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
  return <OnboardingForm user={user} existing={profile} redirectTo={redirect} />;
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
  const [step, setStep] = useState(0);
  const [name, setName] = useState(existing?.fullName || user.user_metadata.full_name || "");
  const [role, setRole] = useState(existing?.role ?? "");
  const [teamSize, setTeamSize] = useState(existing?.teamSize ?? "");
  const [goal, setGoal] = useState(existing?.goal ?? "");
  const [firstIdea, setFirstIdea] = useState(existing?.firstIdea ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chosenPlan, setChosenPlan] = useState<PilotPlan | null>(null);
  const [requestReference, setRequestReference] = useState<string | null>(null);

  const [draftReady, setDraftReady] = useState(false);
  const draftKey = `dx-product-setup:${user.id}`;
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(draftKey);
      if (raw && !existing) {
        const draft = JSON.parse(raw) as Record<string, unknown>;
        if (typeof draft["name"] === "string") setName(draft["name"].slice(0, 80));
        if (DX_ROLES.includes(draft["role"] as (typeof DX_ROLES)[number]))
          setRole(draft["role"] as string);
        if (DX_TEAM_SIZES.includes(draft["teamSize"] as (typeof DX_TEAM_SIZES)[number]))
          setTeamSize(draft["teamSize"] as string);
        if (DX_GOALS.includes(draft["goal"] as (typeof DX_GOALS)[number]))
          setGoal(draft["goal"] as string);
        if (typeof draft["firstIdea"] === "string") setFirstIdea(draft["firstIdea"].slice(0, 1000));
      }
      const storedBrief = loadPilotBrief();
      const storedPlan = loadPilotPlan();
      const storedClaim = loadPilotClaim();
      if (storedPlan) setChosenPlan(storedPlan);
      if (storedClaim) setRequestReference(storedClaim.reference);
      if (storedBrief?.problem.trim()) {
        setFirstIdea((current) => current || storedBrief.problem.slice(0, 1000));
      }
    } catch {
      /* Setup remains usable without browser storage. */
    }
    setDraftReady(true);
  }, [draftKey, existing]);
  useEffect(() => {
    let active = true;
    void (async () => {
      await claimStoredPilotRequest();
      const saved = await getMyPilotContinuity().catch(() => null);
      if (!active) return;
      if (saved && !existing) {
        setChosenPlan(saved.plan);
        setRequestReference(saved.reference);
        setFirstIdea((current) => current || saved.brief.problem.slice(0, 1000));
      }
      const draft = await getMyProfileDraft().catch(() => null);
      if (!active || !draft || existing || draft.completedAt) return;
      setName((current) => current || draft.fullName);
      if (DX_ROLES.includes(draft.role as (typeof DX_ROLES)[number])) {
        setRole((current) => current || draft.role);
      }
      if (DX_TEAM_SIZES.includes(draft.teamSize as (typeof DX_TEAM_SIZES)[number])) {
        setTeamSize((current) => current || draft.teamSize);
      }
      if (DX_GOALS.includes(draft.goal as (typeof DX_GOALS)[number])) {
        setGoal((current) => current || draft.goal);
      }
      setFirstIdea((current) => current || draft.firstIdea.slice(0, 1000));
    })();
    return () => {
      active = false;
    };
  }, [existing]);
  useEffect(() => {
    if (!draftReady || existing) return;
    try {
      sessionStorage.setItem(draftKey, JSON.stringify({ name, role, teamSize, goal, firstIdea }));
    } catch {
      /* Browser storage is optional. */
    }
  }, [draftReady, draftKey, existing, name, role, teamSize, goal, firstIdea]);
  const firstAction = firstActionFor({ goal, firstIdea: firstIdea.trim() });

  const canNext =
    step === 0 ? name.trim().length >= 2 && !!role : step === 1 ? !!teamSize && !!goal : true;

  async function persistDraft() {
    try {
      await saveMyProfileDraft({
        data: {
          fullName: name.trim().slice(0, 80),
          role,
          teamSize,
          goal,
          firstIdea: firstIdea.trim().slice(0, 1000),
        },
      });
    } catch {
      /* The browser draft remains if the account draft cannot be saved. */
    }
  }

  async function finish() {
    setSaving(true);
    setError(null);
    let profile: DxProfile;
    try {
      profile = await saveMyProfile({
        data: {
          fullName: name.trim().slice(0, 80),
          role,
          teamSize,
          goal,
          firstIdea: firstIdea.trim().slice(0, 1000),
        },
      });
    } catch {
      setSaving(false);
      setError("We couldn't save your setup. Check your connection and try again.");
      return;
    }
    // Display name on the auth account; a failure here doesn't block setup.
    await auth.updateName(profile.fullName);
    queryClient.setQueryData(myProfileQuery.queryKey, profile);
    setSaving(false);
    try {
      sessionStorage.removeItem(draftKey);
    } catch {
      /* optional storage */
    }
    const requested = safeProductRedirect(redirectTo);
    const target =
      requested !== "/command" && requested !== "/command/programmes"
        ? requested
        : firstActionFor(profile).href;
    void navigate({ to: target, replace: true });
  }

  return (
    <div className="dxs ob-page">
      <header className="ob-top">
        <BrandLogo to="/" />
        <ol className="ob-steps" aria-label="Setup progress">
          {STEPS.map((s, i) => (
            <li
              key={s}
              aria-current={i === step ? "step" : undefined}
              className={i < step ? "done" : i === step ? "active" : ""}
            >
              <span>{i < step ? <Check className="size-3" aria-hidden="true" /> : i + 1}</span>
              {s}
            </li>
          ))}
        </ol>
      </header>

      <main className="ob-card">
        {step === 0 ? (
          <>
            <h1 className="ob-h1">Welcome to DeliverX.</h1>
            <p className="ob-sub">
              Tell us who is asking the product question. A paid pilot stays a separate agreement.
            </p>
            <label className="ob-label" htmlFor="ob-name">
              Your name
            </label>
            <input
              id="ob-name"
              className="ob-input"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
            />
            <p className="ob-label">Your role</p>
            <Chips options={DX_ROLES} value={role} onChange={setRole} label="Your role" />
          </>
        ) : null}

        {step === 1 ? (
          <>
            <h1 className="ob-h1">What question are you bringing?</h1>
            <p className="ob-sub">
              The workspace starts from a product question, then evidence, your decision and
              reviewable work.
            </p>
            <p className="ob-label">Team size</p>
            <Chips
              options={DX_TEAM_SIZES}
              value={teamSize}
              onChange={setTeamSize}
              label="Team size"
            />
            <p className="ob-label">Main goal</p>
            <Chips options={DX_GOALS} value={goal} onChange={setGoal} label="Main goal" />
          </>
        ) : null}

        {step === 2 ? (
          <>
            <h1 className="ob-h1">What product question should we investigate?</h1>
            <p className="ob-sub">
              This stays on your account. It is not added to the address. You can change it before
              any mission starts.
            </p>
            {chosenPlan ? (
              <p className="ob-hint">
                Chosen offer: {PILOT_PLAN_LABELS[chosenPlan]}
                {requestReference ? ` · Request ${requestReference}` : ""}. Creating this account
                does not activate a paid pilot.
              </p>
            ) : null}
            <label className="ob-label" htmlFor="ob-idea">
              Product question (optional)
            </label>
            <textarea
              id="ob-idea"
              className="ob-input"
              rows={4}
              maxLength={1000}
              placeholder="Which onboarding change should we investigate first?"
              value={firstIdea}
              onChange={(e) => setFirstIdea(e.target.value)}
            />
            <p className="ob-hint">Please don't include personal data about real people.</p>
            <aside className="ob-next" aria-label="Your next step">
              <p className="dxl-eyebrow">Your first step</p>
              <h2>{firstAction.label}</h2>
              <p>{firstAction.reason}</p>
              <small>You review the brief before any work starts.</small>
            </aside>
          </>
        ) : null}

        {error ? (
          <p className="ob-error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="ob-actions">
          {step > 0 ? (
            <button
              type="button"
              className="ob-btn ob-btn-ghost"
              onClick={() => setStep((s) => s - 1)}
            >
              <ArrowLeft className="size-4" /> Back
            </button>
          ) : (
            <span />
          )}
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              className="ob-btn ob-btn-primary"
              disabled={!canNext}
              onClick={() => {
                void persistDraft();
                setStep((s) => s + 1);
              }}
            >
              Continue <ArrowRight className="size-4" />
            </button>
          ) : (
            <button
              type="button"
              className="ob-btn ob-btn-primary"
              disabled={saving || !draftReady}
              onClick={() => void finish()}
            >
              {saving ? "Setting up…" : "Open my product workspace"}
              <ArrowRight className="size-4" />
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
