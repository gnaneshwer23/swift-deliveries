import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Check, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
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
import {
  ProductDiscoveryIcon,
  ProductPrototypeIcon,
  ProductImproveIcon,
  ApprovalGateIcon,
} from "@/components/marketing/motion-product-visuals";
import { piOnboardingQuery } from "@/lib/onboarding-queries";
import { completePiOnboarding, savePiOnboardingStep } from "@/lib/onboarding.functions";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Personalised Product & Workforce Setup — DeliverX" },
      {
        name: "description",
        content:
          "Configure your product role, target domains, and supervision preferences for DeliverX Command Centre and your Career Evidence Dashboard.",
      },
      { property: "og:title", content: "Personalised Product & Workforce Setup — DeliverX" },
      {
        property: "og:description",
        content: "Tailor your AI Product Workforce missions and career evidence blueprint.",
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
  "Product Targets",
  "Capability Baseline",
  "Evidence Posture",
  "Operating Cadence",
  "Review Setup",
  "Personalised Blueprint",
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

const ROLE_PRESETS = [
  "Product Manager",
  "Senior Product Manager",
  "Head of Product / VP",
  "Founder / Product Lead",
  "Delivery / PMO Sponsor",
] as const;

const DOMAIN_PRESETS = [
  "B2B SaaS & AI",
  "FinTech & Payments",
  "HealthTech & Clinical",
  "Marketplaces & Growth",
  "Enterprise & GovTech",
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
    if (data.state.completed) navigate({ to: "/command", replace: true });
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

  const finish = async (destination: "/command" | "/workspace" = "/command") => {
    setSaving(true);
    try {
      await finishOnboarding({});
      await queryClient.invalidateQueries({ queryKey: ["pi"] });
      await queryClient.invalidateQueries({ queryKey: ["workspace"] });
      toast.success("Your personalised workspace is ready");
      navigate({ to: destination, replace: true });
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const recommended = useMemo(() => {
    const domainText = answers.targetDomains.trim() || "your product domain";
    if (answers.posture.includes("Nothing I can show yet"))
      return {
        title: "Commission an Investigate Mission or Start Experience",
        reason: `You told us you are building your initial proof in ${domainText}. Start by running a supervised product discovery mission in Command Centre or completing a realistic simulation in Experience.`,
      };
    if (answers.targetRole)
      return {
        title: `Tailored for ${answers.targetRole}`,
        reason: `Your Command Centre playbooks and Daily Briefing are now ordered around ${answers.targetRole} (${domainText}). Commission AI product missions under human approval or package verified career artefacts.`,
      };
    return {
      title: "Ready for Supervised Product Execution",
      reason: "Your workspace is configured with a 100-credit ceiling, 12 verified AI specialists, and an append-only evidence record.",
    };
  }, [answers.posture, answers.targetRole, answers.targetDomains]);

  const canContinue =
    step === 2
      ? answers.fullName.trim().length > 0
      : step === 3
        ? answers.targetRole.trim().length > 0
        : step === 6
          ? answers.pace.length > 0
          : true;

  const firstName = answers.fullName.trim().split(" ")[0] || "Operator";

  return (
    <div className="dxs motion-onboarding-shell min-h-screen">
      {/* Top Sticky Bar */}
      <header className="motion-nav">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <BrandLogo />
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-[#EEF5FF] px-3 py-1 text-xs font-semibold text-[#2C77E7]">
              <Sparkles className="size-3.5" /> Personalised Workspace Setup
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500">
              Step {String(step).padStart(2, "0")} of 08
            </span>
            <Link
              to="/command"
              className="text-xs font-semibold text-[#2C77E7] hover:underline"
            >
              Skip to Command Centre →
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[1fr_1.15fr]">
        {/* Left Column: Live Personalised Product & Workforce Preview */}
        <section className="flex flex-col justify-between rounded-3xl border border-[#D8E5FF] bg-gradient-to-br from-[#EEF5FF] via-[#F8FAFF] to-[#E8ECFF] p-8 shadow-sm">
          <div>
            <span className="motion-eyebrow">
              STEP {String(step).padStart(2, "0")} OF 08 · {STEPS[step - 1]?.toUpperCase()}
            </span>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-[#101828] sm:text-4xl">
              {step === 1
                ? "Personalise your AI Product Workforce & Evidence Record."
                : step === 8
                  ? `Welcome aboard, ${firstName}. Your workspace is ready.`
                  : `${STEPS[step - 1]}`}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-[#475467]">
              Everything you enter here shapes your recommended product missions, domain templates,
              and career briefing pace. Self-reported claims are stored transparently and never
              counted as verified evidence until you produce real artefacts.
            </p>

            {/* 8-Step Visual Progress Bar */}
            <div className="mt-6 grid grid-cols-8 gap-1.5" aria-label="Setup progress">
              {STEPS.map((label, index) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    if (index + 1 < step) setStep(index + 1);
                  }}
                  disabled={index + 1 > step}
                  title={label}
                  className={`h-2 rounded-full transition-all ${
                    index + 1 === step
                      ? "bg-[#3e63dd] ring-2 ring-[#3e63dd]/30"
                      : index + 1 < step
                        ? "bg-[#10b981] cursor-pointer"
                        : "bg-slate-200"
                  }`}
                />
              ))}
            </div>

            {/* Live Personalised Blueprint Card */}
            <div className="mt-6 rounded-2xl border border-white/80 bg-white p-5 shadow-md">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#2C77E7]">
                    Live Workspace Blueprint
                  </span>
                  <h2 className="text-base font-bold text-[#101828]">
                    {answers.fullName.trim() || "Your Product Profile"}
                  </h2>
                </div>
                <span className="motion-pill-emerald">100 Credits Ready</span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2.5 text-xs">
                <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                  <span className="text-slate-500 block">Target Product Role</span>
                  <strong className="text-slate-900">
                    {answers.targetRole.trim() || "Product Manager"}
                    {answers.targetLevel ? ` (${answers.targetLevel})` : ""}
                  </strong>
                </div>
                <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                  <span className="text-slate-500 block">Focus Domains</span>
                  <strong className="text-slate-900">
                    {answers.targetDomains.trim() || "B2B SaaS & AI Products"}
                  </strong>
                </div>
                <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                  <span className="text-slate-500 block">Operating Cadence</span>
                  <strong className="text-slate-900">
                    {answers.pace || "Balanced weekly missions"}
                  </strong>
                </div>
                <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                  <span className="text-slate-500 block">Permission Ceiling</span>
                  <strong className="text-[#2C77E7]">Plan → Create → Internal</strong>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  Ready in Your Command Centre
                </span>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 rounded-lg bg-[#F5F8FF] p-2">
                    <ProductDiscoveryIcon className="size-4 shrink-0" />
                    <span className="font-semibold text-slate-800">Investigate</span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-lg bg-[#F5F8FF] p-2">
                    <ProductPrototypeIcon className="size-4 shrink-0" />
                    <span className="font-semibold text-slate-800">Prototype</span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-lg bg-[#F5F8FF] p-2">
                    <ProductImproveIcon className="size-4 shrink-0" />
                    <span className="font-semibold text-slate-800">Improve</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2.5 text-xs text-slate-600">
            <ShieldCheck className="size-4 text-[#2C77E7] shrink-0" />
            <span>
              Honest provenance guarantee: self-reported setup answers never create fake capability scores.
            </span>
          </div>
        </section>

        {/* Right Column: Interactive Step Form Card */}
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#2C77E7]">
                  {step === 7 ? "Review — Marked Self-Reported" : STEPS[step - 1]}
                </span>
                <h2 className="text-xl font-bold text-[#101828] mt-0.5">
                  {step === 1 && "How DeliverX works for you"}
                  {step === 2 && "Tell us who you are"}
                  {step === 3 && "What product role & domain are you targeting?"}
                  {step === 4 && "Baseline your product capabilities"}
                  {step === 5 && "What product artefacts can you show today?"}
                  {step === 6 && "Set your operating cadence & supervision style"}
                  {step === 7 && "Confirm your profile details"}
                  {step === 8 && "Your personalised DeliverX blueprint"}
                </h2>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {step} / 8
              </span>
            </div>

            <div className="mt-6 space-y-5">
              {step === 1 ? (
                <div className="space-y-4 text-sm leading-relaxed text-[#475467]">
                  <p>
                    DeliverX combines two connected workspaces in one platform:
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-[#DCE4FE] bg-[#F8FAFF] p-4">
                      <div className="flex items-center gap-2 font-bold text-[#101828]">
                        <ApprovalGateIcon className="size-5" />
                        <span>1. AI Workforce Command Centre</span>
                      </div>
                      <p className="mt-1.5 text-xs text-slate-600">
                        Commission <strong>Investigate</strong>, <strong>Prototype</strong>, and{" "}
                        <strong>Improve</strong> product missions with 12 verified AI specialists under human approval.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
                      <div className="flex items-center gap-2 font-bold text-[#101828]">
                        <ProductDiscoveryIcon className="size-5" />
                        <span>2. Product Evidence Dashboard</span>
                      </div>
                      <p className="mt-1.5 text-xs text-slate-600">
                        Build provenance-backed PM artefacts through <strong>Experience</strong>, package in{" "}
                        <strong>Launchpad</strong>, and earn external attestation.
                      </p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700">
                    <strong className="text-slate-900">Our supervision &amp; evidence commitment:</strong>{" "}
                    Nothing executes in Command Centre without your plan approval, and only an independent external attestation lights the Verified career badge.
                  </div>
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
                  <Field label="Professional headline" id="headline">
                    <Input
                      id="headline"
                      value={answers.headline}
                      onChange={(e) => set("headline", e.target.value)}
                      placeholder="Product Lead building B2B SaaS & AI workflows"
                    />
                  </Field>
                  <Field label="Current role" id="currentRole">
                    <Input
                      id="currentRole"
                      value={answers.currentRole}
                      onChange={(e) => set("currentRole", e.target.value)}
                      placeholder="Senior Product Manager"
                    />
                  </Field>
                  <Field label="Years of professional experience" id="years">
                    <Select
                      value={answers.yearsExperience}
                      onValueChange={(v) => set("yearsExperience", v)}
                    >
                      <SelectTrigger id="years">
                        <SelectValue placeholder="Choose experience band" />
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
                  <Field label="Target product role" id="targetRole">
                    <Input
                      id="targetRole"
                      value={answers.targetRole}
                      onChange={(e) => set("targetRole", e.target.value)}
                      placeholder="Product Manager"
                    />
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {ROLE_PRESETS.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => set("targetRole", preset)}
                          className={`rounded-full px-2.5 py-1 text-xs font-medium border transition ${
                            answers.targetRole === preset
                              ? "bg-[#EEF5FF] border-[#2C77E7] text-[#2C77E7]"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <Field label="Target seniority level" id="targetLevel">
                    <Select value={answers.targetLevel} onValueChange={(v) => set("targetLevel", v)}>
                      <SelectTrigger id="targetLevel">
                        <SelectValue placeholder="Choose level" />
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
                  <Field label="Product domains you focus on" id="domains">
                    <Input
                      id="domains"
                      value={answers.targetDomains}
                      onChange={(e) => set("targetDomains", e.target.value)}
                      placeholder="HealthTech, FinTech, B2B SaaS"
                    />
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {DOMAIN_PRESETS.map((domain) => (
                        <button
                          key={domain}
                          type="button"
                          onClick={() => set("targetDomains", domain)}
                          className={`rounded-full px-2.5 py-1 text-xs font-medium border transition ${
                            answers.targetDomains === domain
                              ? "bg-[#EEF5FF] border-[#2C77E7] text-[#2C77E7]"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {domain}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <Field label="Goal timeframe" id="timeframe">
                    <Select value={answers.timeframe} onValueChange={(v) => set("timeframe", v)}>
                      <SelectTrigger id="timeframe">
                        <SelectValue placeholder="Choose timeframe" />
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
                  <p className="text-xs leading-relaxed text-[#475467]">
                    Rate your current confidence across core product capabilities. This stays labelled as a self-report and helps order your recommended missions.
                  </p>
                  {data.capabilities.length === 0 ? (
                    <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                      Capability dimensions are ready in your workspace. You can continue or skip this step.
                    </p>
                  ) : (
                    <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
                      {data.capabilities.map((cap) => (
                        <Field key={cap.key} label={cap.name} id={`cap-${cap.key}`}>
                          <Select
                            value={answers.strengths[cap.key] ?? ""}
                            onValueChange={(v) =>
                              set("strengths", { ...answers.strengths, [cap.key]: v })
                            }
                          >
                            <SelectTrigger id={`cap-${cap.key}`}>
                              <SelectValue placeholder="Select confidence level" />
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
                      ))}
                    </div>
                  )}
                </>
              ) : null}

              {step === 5 ? (
                <>
                  <p className="text-xs leading-relaxed text-[#475467]">
                    What product artefacts or career proof can you show today?
                  </p>
                  <div className="space-y-2">
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
                          className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
                            checked
                              ? "border-[#2C77E7] bg-[#EEF5FF] text-[#101828]"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <span>{option}</span>
                          <span
                            className={`inline-flex size-5 items-center justify-center rounded-md border text-xs ${
                              checked
                                ? "border-[#2C77E7] bg-[#2C77E7] text-white"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {checked ? <Check className="size-3.5" /> : null}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <Field label="Additional context on your product portfolio (optional)" id="postureNotes">
                    <Textarea
                      id="postureNotes"
                      rows={3}
                      placeholder="e.g., Shipped 2 internal B2B tools, looking to formalise PRDs and decision memos…"
                      value={answers.postureNotes}
                      onChange={(e) => set("postureNotes", e.target.value)}
                    />
                  </Field>
                </>
              ) : null}

              {step === 6 ? (
                <>
                  <Field label="Weekly operating cadence" id="pace">
                    <Select value={answers.pace} onValueChange={(v) => set("pace", v)}>
                      <SelectTrigger id="pace">
                        <SelectValue placeholder="Choose your weekly pace" />
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
                  <Field label="Collaboration & supervision mode" id="collaboration">
                    <Select
                      value={answers.collaboration}
                      onValueChange={(v) => set("collaboration", v)}
                    >
                      <SelectTrigger id="collaboration">
                        <SelectValue placeholder="Choose how you collaborate" />
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
                  <Field label="AI review & feedback detail" id="feedback">
                    <Select value={answers.feedback} onValueChange={(v) => set("feedback", v)}>
                      <SelectTrigger id="feedback">
                        <SelectValue placeholder="Choose feedback style" />
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
                <div className="max-h-80 overflow-y-auto rounded-2xl border border-slate-200 divide-y divide-slate-100">
                  {[
                    ["Name", answers.fullName],
                    ["Headline", answers.headline],
                    ["Current role", answers.currentRole],
                    ["Experience", answers.yearsExperience],
                    ["Target role", answers.targetRole],
                    ["Target level", answers.targetLevel],
                    ["Domains", answers.targetDomains],
                    ["Timeframe", answers.timeframe],
                    ["Proof today", answers.posture.join(", ")],
                    ["Weekly pace", answers.pace],
                    ["Collaboration", answers.collaboration],
                    ["Feedback", answers.feedback],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="grid grid-cols-[8.5rem_minmax(0,1fr)] items-center gap-3 px-4 py-3 text-xs"
                    >
                      <span className="font-semibold text-slate-500">{label}</span>
                      <div className="flex items-center justify-between gap-2 text-slate-900 font-medium">
                        <span className="truncate">{value || "Not specified"}</span>
                        <span className="shrink-0 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                          Self-reported
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {step === 8 ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-[#DCE4FE] bg-[#F8FAFF] p-5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#2C77E7]">
                      Personalised Recommendation
                    </span>
                    <h3 className="mt-1 text-lg font-bold text-[#101828]">
                      {recommended.title}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-[#475467]">
                      {recommended.reason}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => void finish("/command")}
                      disabled={saving}
                      className="rounded-2xl border-2 border-[#3e63dd] bg-[#EEF5FF] p-4 text-left transition hover:bg-[#e0ecff] cursor-pointer"
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#2C77E7]">
                        Primary Destination
                      </span>
                      <strong className="mt-1 block text-sm font-bold text-[#101828]">
                        Launch AI Workforce Command Centre →
                      </strong>
                      <span className="mt-1 block text-xs text-slate-600">
                        Commission Investigate, Prototype &amp; Improve product missions.
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => void finish("/workspace")}
                      disabled={saving}
                      className="rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:bg-slate-50 cursor-pointer"
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                        Career &amp; Daily Briefing
                      </span>
                      <strong className="mt-1 block text-sm font-bold text-[#101828]">
                        Open Personalised Career Dashboard →
                      </strong>
                      <span className="mt-1 block text-xs text-slate-600">
                        View your tailored PM evidence plan, Experience simulations &amp; Launchpad.
                      </span>
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Footer Navigation Controls */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
            <div className="flex gap-2">
              {step > 1 ? (
                <button
                  type="button"
                  className="btn motion-btn-secondary px-4 py-2.5 text-xs"
                  onClick={() => setStep((prev) => Math.max(1, prev - 1))}
                  disabled={saving}
                >
                  ← Back
                </button>
              ) : null}

              {SKIPPABLE.has(step) ? (
                <button
                  type="button"
                  className="btn motion-btn-secondary px-4 py-2.5 text-xs"
                  onClick={() => void advance(true)}
                  disabled={saving}
                >
                  Skip step
                </button>
              ) : null}
            </div>

            {step < 8 ? (
              <button
                type="button"
                className="btn motion-btn-primary px-6 py-2.5 text-xs"
                onClick={() => void advance(false)}
                disabled={saving || !canContinue}
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                <span>Continue</span>
                <ArrowRight className="size-4" />
              </button>
            ) : (
              <button
                type="button"
                className="btn motion-btn-primary px-6 py-2.5 text-xs"
                onClick={() => void finish("/command")}
                disabled={saving}
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                <span>Open Command Centre</span>
                <ArrowRight className="size-4" />
              </button>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-semibold text-slate-700">
        {label}
      </Label>
      {children}
    </div>
  );
}
