import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Loader2 } from "lucide-react";
import { MarketingLogo } from "@/components/marketing/marketing-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { piOnboardingQuery } from "@/lib/onboarding-queries";
import { completePiOnboarding, savePiOnboardingStep } from "@/lib/onboarding.functions";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Professional Intelligence Setup — DeliverX" },
      {
        name: "description",
        content:
          "Set your targets, strengths and working style. Everything you enter here is recorded as a self-reported claim.",
      },
      { property: "og:title", content: "Professional Intelligence Setup — DeliverX" },
      {
        property: "og:description",
        content: "Eight short steps that orient your DeliverX record. No scores, no badges.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(piOnboardingQuery),
  component: OnboardingPage,
});

const STEPS = [
  "Welcome",
  "Identity",
  "Targets",
  "Strengths",
  "Evidence posture",
  "Working style",
  "Review",
  "Recommended path",
] as const;

const SKIPPABLE = new Set([4, 5]);

const STRENGTH_LEVELS = [
  { value: "no_experience", label: "No experience yet" },
  { value: "some_exposure", label: "Some exposure" },
  { value: "practised", label: "Practised" },
  { value: "confident", label: "Confident" },
] as const;

const POSTURE_OPTIONS = [
  "A portfolio I can share",
  "Written artefacts from past work",
  "References or former managers",
  "Certificates or courses only",
  "Nothing I can show yet",
] as const;

type Answers = {
  fullName: string;
  headline: string;
  currentRole: string;
  yearsExperience: string;
  targetRole: string;
  targetLevel: string;
  targetDomains: string;
  timeframe: string;
  strengths: Record<string, string>;
  posture: string[];
  postureNotes: string;
  pace: string;
  collaboration: string;
  feedback: string;
};

function OnboardingPage() {
  const { data } = useSuspenseQuery(piOnboardingQuery);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const saveStep = useServerFn(savePiOnboardingStep);
  const finishOnboarding = useServerFn(completePiOnboarding);

  const claimValue = (kind: string, key: string) =>
    data.claims.find((c) => c.kind === kind && c.key === key)?.value ?? "";

  const [step, setStep] = useState(() => Math.min(8, Math.max(1, data.state.currentStep)));
  const [saving, setSaving] = useState(false);
  const [answers, setAnswers] = useState<Answers>(() => ({
    fullName: data.profile?.fullName ?? "",
    headline: data.profile?.headline ?? "",
    currentRole: claimValue("identity", "current_role"),
    yearsExperience: claimValue("identity", "years_experience"),
    targetRole: claimValue("target", "target_role"),
    targetLevel: claimValue("target", "target_level"),
    targetDomains: claimValue("target", "target_domains"),
    timeframe: claimValue("target", "timeframe"),
    strengths: Object.fromEntries(
      data.claims.filter((c) => c.kind === "strength").map((c) => [c.key, c.value]),
    ),
    posture: claimValue("evidence_posture", "proof_today")
      ? claimValue("evidence_posture", "proof_today").split(" | ")
      : [],
    postureNotes: claimValue("evidence_posture", "notes"),
    pace: claimValue("working_style", "pace"),
    collaboration: claimValue("working_style", "collaboration"),
    feedback: claimValue("working_style", "feedback"),
  }));

  useEffect(() => {
    if (data.state.completed) navigate({ to: "/workspace", replace: true });
  }, [data.state.completed, navigate]);

  const set = <K extends keyof Answers>(key: K, value: Answers[K]) =>
    setAnswers((prev) => ({ ...prev, [key]: value }));

  const claimsForStep = (target: number) => {
    if (target === 2)
      return [
        { kind: "identity" as const, key: "current_role", value: answers.currentRole },
        { kind: "identity" as const, key: "years_experience", value: answers.yearsExperience },
      ].filter((c) => c.value.trim().length > 0);
    if (target === 3)
      return [
        { kind: "target" as const, key: "target_role", value: answers.targetRole },
        { kind: "target" as const, key: "target_level", value: answers.targetLevel },
        { kind: "target" as const, key: "target_domains", value: answers.targetDomains },
        { kind: "target" as const, key: "timeframe", value: answers.timeframe },
      ].filter((c) => c.value.trim().length > 0);
    if (target === 4)
      return Object.entries(answers.strengths)
        .filter(([, value]) => value)
        .map(([key, value]) => ({
          kind: "strength" as const,
          key,
          value,
          capabilityKey: key,
        }));
    if (target === 5)
      return [
        {
          kind: "evidence_posture" as const,
          key: "proof_today",
          value: answers.posture.join(" | "),
        },
        { kind: "evidence_posture" as const, key: "notes", value: answers.postureNotes },
      ].filter((c) => c.value.trim().length > 0);
    if (target === 6)
      return [
        { kind: "working_style" as const, key: "pace", value: answers.pace },
        { kind: "working_style" as const, key: "collaboration", value: answers.collaboration },
        { kind: "working_style" as const, key: "feedback", value: answers.feedback },
      ].filter((c) => c.value.trim().length > 0);
    return [];
  };

  const advance = async (skipped = false) => {
    setSaving(true);
    try {
      await saveStep({
        data: {
          step,
          skipped,
          claims: skipped ? [] : claimsForStep(step),
          ...(step === 2
            ? { profile: { fullName: answers.fullName, headline: answers.headline } }
            : {}),
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["pi"] });
      await queryClient.invalidateQueries({ queryKey: ["workspace"] });
      setStep((prev) => Math.min(8, prev + 1));
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const finish = async () => {
    setSaving(true);
    try {
      await finishOnboarding({});
      await queryClient.invalidateQueries({ queryKey: ["pi"] });
      toast.success("Your record is set up");
      navigate({ to: "/workspace", replace: true });
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const recommended = useMemo(() => {
    if (answers.posture.includes("Nothing I can show yet"))
      return {
        title: "Start with Experience",
        reason:
          "You told us you have nothing to show yet, so the fastest route to real proof is doing simulated work that produces artefacts.",
      };
    if (answers.targetRole)
      return {
        title: "Start with Experience, then package in Launchpad",
        reason: `You are aiming for ${answers.targetRole}. Build evidence first, then package only what the record supports.`,
      };
    return {
      title: "Start with Experience",
      reason: "Evidence only exists after you act, so the loop begins with real work.",
    };
  }, [answers.posture, answers.targetRole]);

  const canContinue =
    step === 2
      ? answers.fullName.trim().length > 0
      : step === 3
        ? answers.targetRole.trim().length > 0
        : step === 6
          ? answers.pace.length > 0
          : true;

  return (
    <div className="min-h-screen bg-[var(--mkt-ink)] font-sans text-[var(--mkt-text1)] [&_input]:h-11 [&_[role=combobox]]:h-11">
      <header className="px-3 pt-3">
        <div className="mx-auto flex h-[var(--mkt-navh)] max-w-[var(--mkt-maxw)] items-center rounded-[1.1rem] border border-[var(--mkt-border)] bg-[var(--mkt-s1)] px-5 shadow-[var(--mkt-shadow-nav)]">
          <MarketingLogo />
        </div>
      </header>

      <main className="mx-auto mt-4 grid max-w-[var(--mkt-maxw)] gap-4 px-3 pb-8 lg:grid-cols-[minmax(0,1fr)_minmax(30rem,0.85fr)]">
        <section className="rounded-2xl border border-[var(--mkt-border)] bg-[var(--mkt-s2)] p-6 shadow-[var(--mkt-shadow-card)] sm:p-10 lg:p-14">
          <p className="mkt-label">
            Professional Intelligence / Step {String(step).padStart(2, "0")} of 08
          </p>
          <h1 className="mt-8 max-w-2xl font-display text-5xl font-bold leading-[1] sm:text-6xl">
            {STEPS[step - 1]}
          </h1>
          <p className="mt-8 max-w-md text-base leading-relaxed text-[var(--mkt-text2)]">
            Everything you enter here is stored as a self-reported claim. It creates no evidence, no
            score and no verified status. Only work you do inside the platform, judged against a
            framework, can do that.
          </p>
          <div className="mt-12 grid grid-cols-8 border border-[var(--mkt-border)]">
            {STEPS.map((label, index) => (
              <div
                key={label}
                className={`h-2 border-r border-[var(--mkt-border)] last:border-r-0 ${
                  index + 1 <= step ? "bg-[var(--mkt-green)]" : "bg-[var(--mkt-s2)]"
                }`}
              />
            ))}
          </div>
          <ol className="mt-8 space-y-2 font-mono text-[0.6875rem] font-bold uppercase text-[var(--mkt-text3)]">
            {STEPS.map((label, index) => (
              <li key={label} className={index + 1 === step ? "text-[var(--mkt-text1)]" : undefined}>
                {String(index + 1).padStart(2, "0")} — {label}
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-2xl border border-[var(--mkt-border)] bg-[var(--mkt-s1)] p-6 shadow-[var(--mkt-shadow-card)] sm:p-10 lg:p-12">
          <p className="font-mono text-[0.6875rem] font-bold uppercase text-[var(--mkt-green-m)]">
            {step === 7 ? "Review — all self-reported" : STEPS[step - 1]}
          </p>

          <div className="mt-8 space-y-5 border-t border-[var(--mkt-border-l)] pt-8">
            {step === 1 ? (
              <div className="space-y-4 text-sm leading-relaxed text-[var(--mkt-text2)]">
                <p>
                  DeliverX turns real and realistic work into provenance-backed evidence. Do the
                  work, keep the proof, earn the signal.
                </p>
                <p className="border border-[var(--mkt-border-l)] bg-[var(--mkt-s2)] p-4 text-[var(--mkt-text1)]">
                  Our commitment: verified means verified. Only an external attestation can light the
                  Verified signal — never a score, never a coach, never this setup.
                </p>
                <p>The next seven steps take about three minutes. You can skip two of them.</p>
              </div>
            ) : null}

            {step === 2 ? (
              <>
                <Field label="Full name" id="fullName">
                  <Input
                    id="fullName"
                    value={answers.fullName}
                    onChange={(e) => set("fullName", e.target.value)}
                    placeholder="Maya Rao"
                  />
                </Field>
                <Field label="Headline" id="headline">
                  <Input
                    id="headline"
                    value={answers.headline}
                    onChange={(e) => set("headline", e.target.value)}
                    placeholder="Data analyst moving into product management"
                  />
                </Field>
                <Field label="Current role" id="currentRole">
                  <Input
                    id="currentRole"
                    value={answers.currentRole}
                    onChange={(e) => set("currentRole", e.target.value)}
                    placeholder="Senior Data Analyst"
                  />
                </Field>
                <Field label="Years of professional experience" id="years">
                  <Select
                    value={answers.yearsExperience}
                    onValueChange={(v) => set("yearsExperience", v)}
                  >
                    <SelectTrigger id="years">
                      <SelectValue placeholder="Choose one" />
                    </SelectTrigger>
                    <SelectContent>
                      {["0–2", "3–5", "6–9", "10+"].map((v) => (
                        <SelectItem key={v} value={v}>
                          {v} years
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </>
            ) : null}

            {step === 3 ? (
              <>
                <Field label="Target role" id="targetRole">
                  <Input
                    id="targetRole"
                    value={answers.targetRole}
                    onChange={(e) => set("targetRole", e.target.value)}
                    placeholder="Product Manager"
                  />
                </Field>
                <Field label="Target level" id="targetLevel">
                  <Select value={answers.targetLevel} onValueChange={(v) => set("targetLevel", v)}>
                    <SelectTrigger id="targetLevel">
                      <SelectValue placeholder="Choose one" />
                    </SelectTrigger>
                    <SelectContent>
                      {["Associate / Junior", "Mid-level", "Senior", "Lead or Head of"].map((v) => (
                        <SelectItem key={v} value={v}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Domains you are aiming at" id="domains">
                  <Input
                    id="domains"
                    value={answers.targetDomains}
                    onChange={(e) => set("targetDomains", e.target.value)}
                    placeholder="HealthTech, FinTech, marketplaces"
                  />
                </Field>
                <Field label="Timeframe" id="timeframe">
                  <Select value={answers.timeframe} onValueChange={(v) => set("timeframe", v)}>
                    <SelectTrigger id="timeframe">
                      <SelectValue placeholder="Choose one" />
                    </SelectTrigger>
                    <SelectContent>
                      {["Within 3 months", "3–6 months", "6–12 months", "Exploring"].map((v) => (
                        <SelectItem key={v} value={v}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </>
            ) : null}

            {step === 4 ? (
              <>
                <p className="text-sm leading-relaxed text-[var(--mkt-text2)]">
                  Rate yourself against the pilot framework. This is a self-report and stays labelled
                  as one — it never contributes capability.
                </p>
                {data.capabilities.length === 0 ? (
                  <p className="border border-[var(--mkt-border-l)] p-4 text-sm text-[var(--mkt-text2)]">
                    The framework is unavailable right now. You can skip this step.
                  </p>
                ) : (
                  data.capabilities.map((cap) => (
                    <Field key={cap.key} label={cap.name} id={`cap-${cap.key}`}>
                      <Select
                        value={answers.strengths[cap.key] ?? ""}
                        onValueChange={(v) =>
                          set("strengths", { ...answers.strengths, [cap.key]: v })
                        }
                      >
                        <SelectTrigger id={`cap-${cap.key}`}>
                          <SelectValue placeholder="Choose one" />
                        </SelectTrigger>
                        <SelectContent>
                          {STRENGTH_LEVELS.map((level) => (
                            <SelectItem key={level.value} value={level.label}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  ))
                )}
              </>
            ) : null}

            {step === 5 ? (
              <>
                <p className="text-sm leading-relaxed text-[var(--mkt-text2)]">
                  What proof of your work can you show today?
                </p>
                <div className="border border-[var(--mkt-border-l)]">
                  {POSTURE_OPTIONS.map((option) => {
                    const checked = answers.posture.includes(option);
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() =>
                          set(
                            "posture",
                            checked
                              ? answers.posture.filter((item) => item !== option)
                              : [...answers.posture, option],
                          )
                        }
                        className={`flex w-full items-center justify-between border-b border-[var(--mkt-border-l)] px-4 py-3 text-left text-sm last:border-b-0 ${
                          checked
                            ? "bg-[var(--mkt-text1)] text-[var(--mkt-on-dark)]"
                            : "text-[var(--mkt-text2)] hover:bg-[var(--mkt-s2)]"
                        }`}
                      >
                        {option}
                        <span className="font-mono text-[0.625rem] font-bold uppercase">
                          {checked ? "Selected" : "Select"}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <Field label="Anything else about your proof today" id="postureNotes">
                  <Textarea
                    id="postureNotes"
                    rows={3}
                    value={answers.postureNotes}
                    onChange={(e) => set("postureNotes", e.target.value)}
                  />
                </Field>
              </>
            ) : null}

            {step === 6 ? (
              <>
                <Field label="Preferred pace" id="pace">
                  <Select value={answers.pace} onValueChange={(v) => set("pace", v)}>
                    <SelectTrigger id="pace">
                      <SelectValue placeholder="Choose one" />
                    </SelectTrigger>
                    <SelectContent>
                      {["A few hours a week", "Several evenings a week", "Full-time focus"].map(
                        (v) => (
                          <SelectItem key={v} value={v}>
                            {v}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="How you like to work" id="collaboration">
                  <Select
                    value={answers.collaboration}
                    onValueChange={(v) => set("collaboration", v)}
                  >
                    <SelectTrigger id="collaboration">
                      <SelectValue placeholder="Choose one" />
                    </SelectTrigger>
                    <SelectContent>
                      {["Mostly independently", "Mixed", "Closely with others"].map((v) => (
                        <SelectItem key={v} value={v}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Feedback appetite" id="feedback">
                  <Select value={answers.feedback} onValueChange={(v) => set("feedback", v)}>
                    <SelectTrigger id="feedback">
                      <SelectValue placeholder="Choose one" />
                    </SelectTrigger>
                    <SelectContent>
                      {["Direct and frequent", "Balanced", "Light touch"].map((v) => (
                        <SelectItem key={v} value={v}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </>
            ) : null}

            {step === 7 ? (
              <div className="border border-[var(--mkt-border-l)]">
                {[
                  ["Name", answers.fullName],
                  ["Headline", answers.headline],
                  ["Current role", answers.currentRole],
                  ["Experience", answers.yearsExperience],
                  ["Target role", answers.targetRole],
                  ["Target level", answers.targetLevel],
                  ["Domains", answers.targetDomains],
                  ["Timeframe", answers.timeframe],
                  [
                    "Strengths",
                    Object.entries(answers.strengths)
                      .filter(([, v]) => v)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(", "),
                  ],
                  ["Proof today", answers.posture.join(", ")],
                  ["Pace", answers.pace],
                  ["Working style", answers.collaboration],
                  ["Feedback", answers.feedback],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="grid grid-cols-[9rem_minmax(0,1fr)] gap-3 border-b border-[var(--mkt-border-l)] p-4 last:border-b-0"
                  >
                    <p className="font-mono text-[0.625rem] font-bold uppercase text-[var(--mkt-green-m)]">
                      {label}
                    </p>
                    <p className="min-w-0 break-words text-sm text-[var(--mkt-text2)]">
                      {value || "Not answered"}
                      <span className="ml-2 border border-[var(--mkt-border-l)] px-1.5 py-0.5 font-mono text-[0.5625rem] font-bold uppercase text-[var(--mkt-text3)]">
                        Self-reported
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            ) : null}

            {step === 8 ? (
              <div className="space-y-4">
                <div className="border border-[var(--mkt-border-l)] bg-[var(--mkt-s2)] p-5">
                  <p className="font-mono text-[0.625rem] font-bold uppercase text-[var(--mkt-green-m)]">
                    Recommended next action
                  </p>
                  <p className="mt-3 font-serif text-xl font-black uppercase">
                    {recommended.title}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--mkt-text2)]">
                    {recommended.reason}
                  </p>
                </div>
                <p className="text-sm leading-relaxed text-[var(--mkt-text2)]">
                  Nothing you entered has created evidence, a score, or a badge. Your record starts
                  empty and grows only from work you do.
                </p>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2 pt-2">
              {step > 1 ? (
                <Button
                  variant="outline"
                  onClick={() => setStep((prev) => Math.max(1, prev - 1))}
                  disabled={saving}
                >
                  Back
                </Button>
              ) : null}

              {SKIPPABLE.has(step) ? (
                <Button variant="ghost" onClick={() => void advance(true)} disabled={saving}>
                  Skip this step
                </Button>
              ) : null}

              {step < 8 ? (
                <Button
                  className="h-11 flex-1 bg-[var(--mkt-text1)] text-xs font-bold uppercase text-[var(--mkt-on-dark)] hover:bg-[var(--mkt-green)]"
                  onClick={() => void advance(false)}
                  disabled={saving || !canContinue}
                >
                  {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                  Continue <ArrowRight className="ml-2 size-4" />
                </Button>
              ) : (
                <Button
                  className="h-11 flex-1 bg-[var(--mkt-text1)] text-xs font-bold uppercase text-[var(--mkt-on-dark)] hover:bg-[var(--mkt-green)]"
                  onClick={() => void finish()}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                  Go to my record <ArrowRight className="ml-2 size-4" />
                </Button>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
