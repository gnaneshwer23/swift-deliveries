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
    // Ensures the operator's workspace exists before programme calls.
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

function ProgrammesHome() {
  const features = useQuery(programmeFeaturesQuery);
  const list = useQuery(programmesListQuery);
  const profile = useQuery(myProfileQuery);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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
  const valid =
    form.name.trim().length >= 2 &&
    form.idea.trim().length >= 20 &&
    form.targetUsers.trim().length >= 2 &&
    form.problem.trim().length >= 5 &&
    form.goals.trim().length >= 5;

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
            An admin needs to apply the database migrations{" "}
            <code>20261022100000_dxsi_product_mission</code> and{" "}
            <code>20261022120000_dxsi_programmes</code>. Existing Studio missions keep working
            meanwhile.
          </p>
        </section>
      ) : null}

      <section className="cc-composer-card" aria-label="Start a programme">
        <div className="cc-composer-head">
          <div>
            <p className="cc-kicker">
              <Rocket className="size-3.5" /> New programme
            </p>
            <h2 className="cc-hero-title">Describe the product question</h2>
            {profile.data?.firstIdea ? (
              <p className="cc-muted text-sm">
                Your saved question is filled in from your account. It is not read from the address.
              </p>
            ) : null}
            <p className="cc-muted text-sm">
              Compare evidence, record the human decision, and keep the work reviewable. Agents do
              not pass a gate. A prototype or launch is not part of this form.
            </p>
          </div>
          <button
            type="button"
            className="cc-btn cc-btn-secondary"
            onClick={() => setForm((f) => ({ ...f, ...EXAMPLE }))}
          >
            Fill hypothetical example
          </button>
        </div>

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
          <label className="cc-label" htmlFor="pg-goals">
            Goals & success measures
            <textarea
              id="pg-goals"
              className="cc-input"
              rows={2}
              value={form.goals}
              onChange={set("goals")}
            />
          </label>
          <label className="cc-label pg-span" htmlFor="pg-constraints">
            Constraints (budget, timeline, data, stack, regulation)
            <input
              id="pg-constraints"
              className="cc-input"
              value={form.constraints}
              onChange={set("constraints")}
            />
          </label>
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
        </div>
        {error ? <p className="cc-error mt-3">{error}</p> : null}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="cc-btn cc-btn-primary"
            disabled={!supported || !valid || create.isPending}
            onClick={() => {
              setError(null);
              create.mutate();
            }}
          >
            {create.isPending ? "Building roadmap…" : "Create roadmap & assemble workforce →"}
          </button>
          <span className="cc-muted text-xs">
            {features.data?.modelMode.enabled
              ? `Deliverables generated by ${features.data.modelMode.model}.`
              : "Simulated mode: deliverables are labelled drafts from deterministic templates; decisions use the real protocol."}{" "}
            {features.data?.search
              ? `Web research via ${features.data.search} with [S#] citations.`
              : "No search provider configured: research will contain no external evidence."}
          </span>
        </div>
      </section>

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
                  {Math.round(p.progress * 100)}% · {p.budget.consumed}/{p.budget.ceiling} credits ·
                  updated {new Date(p.updatedAt).toLocaleString()}
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
