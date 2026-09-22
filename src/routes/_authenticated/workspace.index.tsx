import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { WorkspaceShell, WorkspaceCard } from "@/components/workspace/workspace-shell";
import { workspaceBootstrapQuery } from "@/lib/workspace-queries";
import { dailyBriefingQuery } from "@/lib/onboarding-queries";
import type { DailyBriefing, JourneyState } from "@/lib/onboarding.functions";
import { pacePlan, personalGoal, starterSteps } from "@/lib/personal-plan";

export const Route = createFileRoute("/_authenticated/workspace/")({
  head: () => ({
    meta: [
      { title: "Your Daily Briefing — DeliverX" },
      {
        name: "description",
        content:
          "One place that tells you where your professional record stands and the single next action that moves it.",
      },
      { property: "og:title", content: "Your Daily Briefing — DeliverX" },
      {
        property: "og:description",
        content: "Journey state, evidence, judgement and verification at a glance.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(workspaceBootstrapQuery),
      context.queryClient.ensureQueryData(dailyBriefingQuery),
    ]);
  },
  component: ContextualHome,
});

const JOURNEY: Record<JourneyState, { label: string; description: string }> = {
  A: { label: "Pre-experience", description: "Your record is empty. Evidence only exists after you do the work." },
  B: { label: "Evidence building", description: "Artefacts are landing in your ledger. Nothing has been judged yet." },
  C: { label: "Readiness packaging", description: "Capability has been judged against the framework. You can package honestly." },
  D: { label: "Externally verified", description: "At least one claim carries an external attestation." },
};

const SOURCE_LABELS: Record<string, string> = {
  self_report: "Self-report",
  ai_draft: "AI draft",
  experience_sim: "Experience",
  workspace_contribution: "Workspace",
  assessment: "Assessment",
  external_verification: "External verification",
  coaching_submission: "Coaching",
};

const STAGES: { key: JourneyState; name: string; desc: string }[] = [
  { key: "A", name: "Onboarding", desc: "PI profile created" },
  { key: "B", name: "Experience", desc: "Evidence building" },
  { key: "C", name: "Launchpad", desc: "Readiness packaging" },
  { key: "D", name: "Verified", desc: "External attestation" },
];

function ContextualHome() {
  const { data: bootstrap } = useSuspenseQuery(workspaceBootstrapQuery);
  const { data: briefing } = useSuspenseQuery(dailyBriefingQuery);
  const navigate = useNavigate();

  useEffect(() => {
    if (!briefing.onboardingCompleted) navigate({ to: "/onboarding", replace: true });
  }, [briefing.onboardingCompleted, navigate]);

  const journey = JOURNEY[briefing.journeyState];
  const firstName = bootstrap.profile?.full_name?.split(" ")[0] ?? "there";
  const goal = personalGoal(briefing);
  const target = goal.role;
  const next = nextAction(briefing);
  const stageOrder: JourneyState[] = ["A", "B", "C", "D"];
  const currentIdx = stageOrder.indexOf(briefing.journeyState);
  const steps = starterSteps(briefing);
  const doneCount = steps.filter((s) => s.done).length;
  const plan = pacePlan(briefing);
  const showWelcome = briefing.evidenceTotal === 0 && briefing.judgedCapabilities === 0;

  return (
    <WorkspaceShell title="Daily briefing" subtitle={target ? `Target: ${target}` : undefined}>
      <div className="briefing">
        <div className="journey-state">
          Journey stage {briefing.journeyState} · {journey.label}
        </div>
        <div className="briefing-greeting">
          Good to see you, <em>{firstName}</em>.
        </div>
        <div className="briefing-sub">
          {goal.role ? (
            <>
              You are aiming at <strong>{goal.role}</strong>
              {goal.level ? ` at ${goal.level.toLowerCase()}` : ""}
              {goal.timeframe ? `, ${goal.timeframe.toLowerCase()}` : ""}
              {goal.currentRole ? `, from ${goal.currentRole}` : ""}. {journey.description}
            </>
          ) : (
            journey.description
          )}
        </div>
        <div className="briefing-cards">
          <div className="briefing-card">
            <div className="briefing-card-label">Evidence entries</div>
            <div className="briefing-card-val">{briefing.evidenceTotal}</div>
            <div className="briefing-card-sub">
              {briefing.evidenceTotal === 0 ? "Created only by doing work" : "Append-only record"}
            </div>
          </div>
          <div className="briefing-card">
            <div className="briefing-card-label">Capabilities judged</div>
            <div className="briefing-card-val">
              {briefing.judgedCapabilities} / {briefing.capabilityTotal}
            </div>
            <div className="briefing-card-sub">Against pm-core@2026.1</div>
          </div>
          <div className="briefing-card amber-accent">
            <div className="briefing-card-label">Next action</div>
            <div className="briefing-card-val" style={{ fontSize: 16 }}>
              {next.short}
            </div>
            <div className="briefing-card-sub">Recommended for you</div>
          </div>
          <div className="briefing-card">
            <div className="briefing-card-label">Verified claims</div>
            <div className="briefing-card-val">{briefing.verifiedClaims || "—"}</div>
            <div className="briefing-card-sub">Requires external attestation</div>
          </div>
        </div>
      </div>

      {showWelcome ? (
        <div className="app-section">
          <WorkspaceCard
            title={`Welcome, ${firstName}`}
            description="This panel disappears once your first piece of work is on record."
          >
            <div className="px-5 py-4 text-[13px]" style={{ color: "var(--x-slate)" }}>
              <p>
                Your record starts empty on purpose. Nothing here is assumed about you: the only
                things that count are work you do and proof that comes with it.
              </p>
              <p className="mt-3">
                {goal.role
                  ? `The steps below are ordered for ${goal.role}${goal.domains ? ` in ${goal.domains}` : ""}.`
                  : "Add a target role in your profile and the steps below reorder around it."}
              </p>
            </div>
          </WorkspaceCard>
        </div>
      ) : null}

      <div className="app-section">
        <div className="section-title">
          Your plan{goal.role ? ` for ${goal.role}` : ""} · {doneCount} of {steps.length} done
        </div>
        <WorkspaceCard
          title="Tailored first steps"
          description="Built from what you told us at setup. Self-reported answers shape the order, never the result."
        >
          {steps.map((step, i) => (
            <div key={step.key} className="ev-row">
              <span className="ev-num">{String(i + 1).padStart(2, "0")}</span>
              <div className="ev-body">
                <div className="ev-name" style={step.done ? { opacity: 0.6 } : undefined}>
                  {step.title}
                </div>
                <div className="ev-meta">{step.reason}</div>
              </div>
              {step.done ? (
                <span
                  className="text-[10px] font-semibold"
                  style={{ color: "var(--x-teal-text)" }}
                >
                  Done
                </span>
              ) : (
                <Link to={step.to} className="btn btn-secondary btn-sm" style={{ flexShrink: 0 }}>
                  Open
                </Link>
              )}
            </div>
          ))}
        </WorkspaceCard>
      </div>

      {plan ? (
        <div className="app-section">
          <div className="section-title">Your pace</div>
          <WorkspaceCard
            title={`${plan.label} · ${plan.hoursPerWeek} a week`}
            description={`${plan.cadence} You chose this pace at setup — change it any time in your profile.`}
            action={
              <Link to="/workspace/profile" className="btn btn-secondary btn-sm">
                Change
              </Link>
            }
          />
        </div>
      ) : null}

      <div className="app-section">
        <div className="section-title">Recommended next action</div>
        <div className="action-card">
          <div className="action-body" style={{ flex: 1 }}>
            <div className="action-title">{next.label}</div>
            <div className="action-desc">{next.reason}</div>
          </div>
          <Link to={next.to} className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>
            Start now →
          </Link>
        </div>
      </div>

      <div className="content-grid">
        <div>
          <div className="section-title">Evidence by source</div>
          <WorkspaceCard
            title={briefing.evidenceTotal === 0 ? "No evidence yet" : `${briefing.evidenceTotal} entries`}
            action={
              <Link to="/workspace/evidence" className="text-xs no-underline" style={{ color: "var(--x-slate)" }}>
                View all →
              </Link>
            }
          >
            {briefing.evidenceBySource.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-[13px]" style={{ color: "var(--x-slate-light)" }}>
                  Nothing is on record. Do a piece of work and capture the artefact.
                </p>
              </div>
            ) : (
              briefing.evidenceBySource.map((row, i) => (
                <div key={row.source} className="ev-row">
                  <span className="ev-num">{String(i + 1).padStart(2, "0")}</span>
                  <div className="ev-body">
                    <div className="ev-name">{SOURCE_LABELS[row.source] ?? row.source}</div>
                    <div className="ev-meta">{row.source}</div>
                  </div>
                  <span className="text-sm font-bold">{row.count}</span>
                </div>
              ))
            )}
          </WorkspaceCard>

          <div className="section-title" style={{ marginTop: 24 }}>
            What you told us
          </div>
          <WorkspaceCard
            title="Self-reported at setup"
            description="Kept separate from evidence, always labelled."
          >
            {[...briefing.targets, ...briefing.strengths, ...briefing.workingStyle].length === 0 ? (
              <div className="px-5 py-6 text-[13px]" style={{ color: "var(--x-slate-light)" }}>
                Nothing recorded yet.{" "}
                <Link to="/onboarding" className="underline">
                  Complete setup
                </Link>
                .
              </div>
            ) : (
              [...briefing.targets, ...briefing.strengths, ...briefing.workingStyle]
                .slice(0, 10)
                .map((claim) => (
                  <div key={`${claim.kind}-${claim.key}`} className="ev-row">
                    <div className="ev-body">
                      <div className="ev-name">{claim.value}</div>
                      <div className="ev-meta">{claim.key.replace(/_/g, " ")} · self_report</div>
                    </div>
                  </div>
                ))
            )}
          </WorkspaceCard>
        </div>

        <div className="flex flex-col gap-5">
          <WorkspaceCard
            title="Your journey"
            description="State is read from the ledger — never from what you told us."
          >
            {STAGES.map((s, i) => {
              const state = i < currentIdx ? "done" : i === currentIdx ? "current" : "upcoming";
              return (
                <div
                  key={s.key}
                  className="ev-row"
                  style={state === "current" ? { background: "var(--x-amber-light)" } : undefined}
                >
                  <span className={`stage-dot ${state}`} />
                  <div className="ev-body">
                    <div className="ev-name">{s.name}</div>
                    <div className="ev-meta">{s.desc}</div>
                  </div>
                  <span
                    className="text-[10px] font-semibold"
                    style={{
                      color:
                        state === "done"
                          ? "var(--x-teal-text)"
                          : state === "current"
                            ? "var(--x-amber-text)"
                            : "var(--x-slate-light)",
                    }}
                  >
                    {state === "done" ? "Done" : state === "current" ? "Now" : "Locked"}
                  </span>
                </div>
              );
            })}
          </WorkspaceCard>

          <WorkspaceCard
            title="Organisation"
            description={
              bootstrap.organisation
                ? `${bootstrap.organisation.name} · ${bootstrap.memberCount} member${bootstrap.memberCount === 1 ? "" : "s"} · you are ${bootstrap.role ?? "a member"}`
                : "Optional. Add one to capture observed work with colleagues."
            }
            action={
              <Link
                to={bootstrap.organisation ? "/workspace/team" : "/workspace/organisation"}
                className="btn btn-secondary btn-sm"
              >
                {bootstrap.organisation ? "Manage" : "Add"}
              </Link>
            }
          />
        </div>
      </div>
    </WorkspaceShell>
  );
}

function nextAction(briefing: DailyBriefing): { label: string; short: string; reason: string; to: string } {
  if (briefing.evidenceTotal === 0)
    return {
      label: "See how Experience works",
      short: "Start",
      reason: "Your record has no evidence yet. Realistic work is the only thing that can create it.",
      to: "/experience",
    };
  if (briefing.judgedCapabilities === 0)
    return {
      label: "Open your evidence",
      short: "Judge",
      reason: "You have artefacts on record but no framework judgement yet. Review what is captured and run a judgement.",
      to: "/workspace/evidence",
    };
  if (briefing.verifiedClaims === 0)
    return {
      label: "Request an attestation",
      short: "Verify",
      reason: "Capability has been judged. Verified only lights from an external attestation, so ask someone who saw the work.",
      to: "/workspace/capability",
    };
  return {
    label: "Review your capability",
    short: "Review",
    reason: "Your record carries verified signal. Keep it current as new work lands.",
    to: "/workspace/capability",
  };
}

