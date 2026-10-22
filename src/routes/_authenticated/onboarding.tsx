import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { BrandLogo } from "@/components/brand-logo";
import { DX_GOALS, DX_ROLES, DX_TEAM_SIZES, dxProfileOf, type DxProfile } from "@/lib/dx-profile";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [{ title: "Set up your workspace — DeliverX" }, { name: "robots", content: "noindex" }],
  }),
  component: Onboarding,
});

const STEPS = ["About you", "Your goal", "First idea"] as const;

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
    <div className="ob-chips" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o}
          type="button"
          role="radio"
          aria-checked={value === o}
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
  const { user } = Route.useRouteContext() as { user: User };
  return <OnboardingForm user={user} />;
}

export function OnboardingForm({ user }: { user: User }) {
  const navigate = useNavigate();
  const existing = dxProfileOf(user);
  const [step, setStep] = useState(0);
  const [name, setName] = useState((user.user_metadata?.["full_name"] as string | undefined) ?? "");
  const [role, setRole] = useState(existing?.role ?? "");
  const [teamSize, setTeamSize] = useState(existing?.teamSize ?? "");
  const [goal, setGoal] = useState(existing?.goal ?? "");
  const [firstIdea, setFirstIdea] = useState(existing?.firstIdea ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canNext =
    step === 0 ? name.trim().length >= 2 && !!role : step === 1 ? !!teamSize && !!goal : true;

  async function finish() {
    setSaving(true);
    setError(null);
    const profile: DxProfile = {
      role,
      teamSize,
      goal,
      firstIdea: firstIdea.trim().slice(0, 1000),
      completedAt: new Date().toISOString(),
    };
    const { error: updateError } = await supabase.auth.updateUser({
      data: { full_name: name.trim().slice(0, 80), dx_profile: profile },
    });
    setSaving(false);
    if (updateError) {
      setError("We couldn't save your setup. Check your connection and try again.");
      return;
    }
    if (profile.firstIdea) {
      void navigate({
        to: "/command/programmes",
        search: { idea: profile.firstIdea } as never,
        replace: true,
      });
    } else {
      void navigate({ to: "/command", replace: true });
    }
  }

  return (
    <div className="dxs ob-page">
      <header className="ob-top">
        <BrandLogo to="/" />
        <ol className="ob-steps" aria-label="Setup progress">
          {STEPS.map((s, i) => (
            <li key={s} className={i < step ? "done" : i === step ? "active" : ""}>
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
            <p className="ob-sub">Two quick questions so your workforce knows who it works for.</p>
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
            <h1 className="ob-h1">What are you here to do?</h1>
            <p className="ob-sub">We'll tailor your Command Centre around it.</p>
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
            <h1 className="ob-h1">Got an idea already?</h1>
            <p className="ob-sub">
              Describe it in a sentence or two and we'll start your first programme with it. You can
              skip this.
            </p>
            <label className="ob-label" htmlFor="ob-idea">
              Your idea (optional)
            </label>
            <textarea
              id="ob-idea"
              className="ob-input"
              rows={4}
              maxLength={1000}
              placeholder="e.g. A booking app for independent personal trainers that handles payments and reminders."
              value={firstIdea}
              onChange={(e) => setFirstIdea(e.target.value)}
            />
            <p className="ob-hint">Please don't include personal data about real people.</p>
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
              onClick={() => setStep((s) => s + 1)}
            >
              Continue <ArrowRight className="size-4" />
            </button>
          ) : (
            <button
              type="button"
              className="ob-btn ob-btn-primary"
              disabled={saving}
              onClick={() => void finish()}
            >
              {saving
                ? "Setting up…"
                : firstIdea.trim()
                  ? "Start my first programme"
                  : "Go to my Command Centre"}
              <ArrowRight className="size-4" />
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
