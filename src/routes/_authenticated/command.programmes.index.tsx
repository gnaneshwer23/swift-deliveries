import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Rocket } from "lucide-react";
import { CommandShell } from "@/components/command/command-shell";
import { myProfileQuery } from "@/lib/profile-queries";
import { commandCentreBootstrapQuery } from "@/lib/workforce-queries";
import { programmeFeaturesQuery, programmesListQuery } from "@/lib/programme-queries";
import { createProgrammeRun } from "@/lib/programme.functions";

export const Route = createFileRoute("/_authenticated/command/programmes/")({
  validateSearch: () => ({}),
  head: () => ({
    meta: [
      { title: "Programmes — DeliverX Studio" },
      {
        name: "description",
        content:
          "Long-horizon product programmes with the same Acts language as Studio theatre — human gates throughout.",
      },
    ],
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(commandCentreBootstrapQuery);
  },
  component: ProgrammesHome,
});

const EXAMPLE = {
  name: "PayNudge",
  idea: "An invoicing and late-payment assistant that drafts invoices, tracks payment status and nudges clients politely so freelancers get paid on time.",
  targetUsers: "UK freelancers, small creative agencies",
  problem: "Freelancers lose hours every month chasing late payments, and cash flow suffers.",
  goals:
    "Agree what would be measured before anyone claims an improvement. No observed result is included in this example.",
  constraints: "UK only at launch; never store card details; budget-conscious build.",
};

const STATUS_TEXT: Record<string, string> = {
  active: "Running",
  awaiting_human: "Needs you",
  completed: "Completed",
  partially_completed: "Partially completed",
  cancelled: "Cancelled",
  draft: "Draft",
};

const INTAKE_STEPS = [
  { id: 1 as const, label: "Brief" },
  { id: 2 as const, label: "Constraints" },
  { id: 3 as const, label: "Budget" },
];

function ProgrammesHome() {
  const features = useQuery(programmeFeaturesQuery);
  const list = useQuery(programmesListQuery);
  const profile = useQuery(myProfileQuery);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState({
    name: "",
    idea: "",
    targetUsers: "",
    problem: "",
    goals: "",
    constraints: "",
    timelineWeeks: 16,
    budgetCredits: 400,
  });
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const question = profile.data?.firstIdea?.trim();
    if (!question) return;
    setForm((current) => (current.idea.trim() ? current : { ...current, idea: question }));
  }, [profile.data?.firstIdea]);
  useEffect(() => {
    if (typeof window === "undefined" || !window.location.search.includes("idea=")) return;
    const next = new URL(window.location.href);
    next.searchParams.delete("idea");
    window.history.replaceState({}, "", `${next.pathname}${next.search}${next.hash}`);
  }, []);

  const create = useMutation({
    mutationFn: () => createProgrammeRun({ data: form }),
    onSuccess: async ({ id }) => {
      await queryClient.invalidateQueries({ queryKey: ["programmes"] });
      void navigate({ to: "/command/programmes/$programmeId", params: { programmeId: id } });
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Could not create the programme"),
  });

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({
      ...f,
      [k]: k === "timelineWeeks" || k === "budgetCredits" ? Number(e.target.value) : e.target.value,
    }));

  const supported = features.data?.supported ?? false;
  const briefValid =
    form.name.trim().length >= 2 &&
    form.idea.trim().length >= 20 &&
    form.targetUsers.trim().length >= 2 &&
    form.problem.trim().length >= 5 &&
    form.goals.trim().length >= 5;
  const constraintsValid = form.constraints.trim().length >= 2;
  const budgetValid = form.timelineWeeks >= 6 && form.budgetCredits >= 100;

  return (
    <CommandShell title="Programmes" hideHeading>
      <div className="ps-room">
        <header className="ps-room-stage" aria-label="Programmes">
          <p className="ps-foyer-brand">DeliverX Studio</p>
          <p className="cc-kicker">Programmes</p>
          <h1 className="ps-foyer-headline">Long-horizon product builds</h1>
          <p className="ps-foyer-lede">
            Same Acts language as Studio theatre — Briefing → Strategy → Cast → Approve → Build.
            Human gates stay human-only. For a single decision loop, start from Overview.
          </p>
          <p className="ps-foyer-side-links">
            <Link to="/command" hash="supervised-brief">
              Brief a case
            </Link>
            <span aria-hidden="true">·</span>
            <Link to="/command/projects">Projects</Link>
          </p>
        </header>
        {features.isSuccess && !supported ? (
          <section className="cc-panel cc-panel-active-gate">
            <h2 className="cc-panel-title">Programmes are not enabled yet</h2>
            <p className="cc-muted">
              This workspace does not have long-horizon programmes turned on. Existing Studio
              missions and supervised cases keep working — ask your operator if you need programmes
              for a multi-month build.
            </p>
          </section>
        ) : null}

        {supported ? (
          <section className="cc-composer-card" aria-label="Start a programme">
            <div className="cc-composer-head">
              <div>
                <p className="cc-kicker">
                  <Rocket className="size-3.5" /> New programme
                </p>
                <h2 className="cc-hero-title">Describe the product question</h2>
              </div>
              <button
                type="button"
                className="cc-btn cc-btn-secondary"
                onClick={() => {
                  setForm((f) => ({ ...f, ...EXAMPLE }));
                  setStep(1);
                }}
              >
                Fill hypothetical example
              </button>
            </div>

            <ol className="pg-intake-steps" aria-label="Intake steps">
              {INTAKE_STEPS.map((s) => (
                <li key={s.id} data-current={step === s.id || undefined} data-done={step > s.id}>
                  {s.label}
                </li>
              ))}
            </ol>

            {step === 1 ? (
              <div className="pg-form">
                <label className="cc-label" htmlFor="pg-name">
                  Product name
                  <input
                    id="pg-name"
                    className="cc-input"
                    value={form.name}
                    onChange={set("name")}
                    maxLength={80}
                  />
                </label>
                <label className="cc-label" htmlFor="pg-users">
                  Target users (comma-separated segments)
                  <input
                    id="pg-users"
                    className="cc-input"
                    value={form.targetUsers}
                    onChange={set("targetUsers")}
                  />
                </label>
                <label className="cc-label pg-span" htmlFor="pg-idea">
                  Idea / business case
                  <textarea
                    id="pg-idea"
                    className="cc-input cc-textarea"
                    rows={3}
                    value={form.idea}
                    onChange={set("idea")}
                  />
                </label>
                <label className="cc-label" htmlFor="pg-problem">
                  Problem
                  <textarea
                    id="pg-problem"
                    className="cc-input"
                    rows={2}
                    value={form.problem}
                    onChange={set("problem")}
                  />
                </label>
                <label className="cc-label pg-span" htmlFor="pg-goals">
                  Goals &amp; success measures
                  <textarea
                    id="pg-goals"
                    className="cc-input"
                    rows={2}
                    value={form.goals}
                    onChange={set("goals")}
                  />
                </label>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="pg-form">
                <label className="cc-label pg-span" htmlFor="pg-constraints">
                  Constraints (budget, timeline, data, stack, regulation)
                  <textarea
                    id="pg-constraints"
                    className="cc-input cc-textarea"
                    rows={4}
                    value={form.constraints}
                    onChange={set("constraints")}
                    placeholder="What must stay true for this build?"
                  />
                </label>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="pg-form">
                <label className="cc-label" htmlFor="pg-weeks">
                  Timeline (weeks)
                  <input
                    id="pg-weeks"
                    type="number"
                    min={6}
                    max={52}
                    className="cc-input"
                    value={form.timelineWeeks}
                    onChange={set("timelineWeeks")}
                  />
                </label>
                <label className="cc-label" htmlFor="pg-budget">
                  Budget (credits)
                  <input
                    id="pg-budget"
                    type="number"
                    min={100}
                    max={2000}
                    step={50}
                    className="cc-input"
                    value={form.budgetCredits}
                    onChange={set("budgetCredits")}
                  />
                </label>
                <details className="pg-intake-meta mt-3 pg-span">
                  <summary className="cc-muted text-sm cursor-pointer">
                    How deliverables are produced
                  </summary>
                  <p className="cc-muted text-xs mt-2 mb-0">
                    {features.data?.modelMode.enabled
                      ? `Deliverables generated by ${features.data.modelMode.model}.`
                      : "Simulated mode: deliverables are labelled drafts from deterministic templates; decisions use the real protocol."}{" "}
                    {features.data?.search
                      ? `Web research via ${features.data.search} with [S#] citations.`
                      : "No search provider configured: research will contain no external evidence."}
                  </p>
                </details>
              </div>
            ) : null}

            {error ? <p className="cc-error mt-3">{error}</p> : null}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {step > 1 ? (
                <button
                  type="button"
                  className="cc-btn cc-btn-secondary"
                  onClick={() => setStep((s) => (s === 2 ? 1 : 2))}
                >
                  Back
                </button>
              ) : null}
              {step < 3 ? (
                <button
                  type="button"
                  className="cc-btn cc-btn-primary"
                  disabled={step === 1 ? !briefValid : !constraintsValid}
                  onClick={() => setStep((s) => (s === 1 ? 2 : 3))}
                >
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  className="cc-btn cc-btn-primary"
                  disabled={!briefValid || !constraintsValid || !budgetValid || create.isPending}
                  onClick={() => {
                    setError(null);
                    create.mutate();
                  }}
                >
                  {create.isPending ? "Building roadmap…" : "Create roadmap & assemble workforce →"}
                </button>
              )}
            </div>
          </section>
        ) : null}

        <section className="cc-panel">
          <h2 className="cc-panel-title">Your programmes</h2>
          {list.isLoading ? <p className="cc-muted">Loading…</p> : null}
          {list.data && list.data.length === 0 ? (
            <p className="cc-muted">No programmes yet.</p>
          ) : null}
          <ul className="pg-list">
            {(list.data ?? []).map((p) => (
              <li key={p.id}>
                <Link
                  to="/command/programmes/$programmeId"
                  params={{ programmeId: p.id }}
                  className="pg-list-item"
                >
                  <div className="flex items-center justify-between gap-2">
                    <strong>{p.title}</strong>
                    <span className="cc-chip">{STATUS_TEXT[p.status] ?? p.status}</span>
                  </div>
                  <div className="pg-bar" aria-label={`${Math.round(p.progress * 100)}% complete`}>
                    <span style={{ width: `${Math.round(p.progress * 100)}%` }} />
                  </div>
                  <span className="cc-muted text-xs">
                    {Math.round(p.progress * 100)}% · {p.budget.consumed}/{p.budget.ceiling} credits
                    · updated {new Date(p.updatedAt).toLocaleString()}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </CommandShell>
  );
}
