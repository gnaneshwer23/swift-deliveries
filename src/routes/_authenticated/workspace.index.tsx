import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { WorkspaceShell, WorkspaceCard } from "@/components/workspace/workspace-shell";
import { workspaceBootstrapQuery } from "@/lib/workspace-queries";
import { dailyBriefingQuery } from "@/lib/onboarding-queries";
import type { DailyBriefing, JourneyState } from "@/lib/onboarding.functions";

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
  A: {
    label: "Pre-experience",
    description: "Your record is empty. Evidence only exists after you do the work.",
  },
  B: {
    label: "Evidence building",
    description: "Artefacts are landing in your ledger. Nothing has been judged yet.",
  },
  C: {
    label: "Readiness packaging",
    description: "Capability has been judged against the framework. You can package honestly.",
  },
  D: {
    label: "Externally verified",
    description: "At least one claim carries an external attestation.",
  },
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

function ContextualHome() {
  const { data: bootstrap } = useSuspenseQuery(workspaceBootstrapQuery);
  const { data: briefing } = useSuspenseQuery(dailyBriefingQuery);
  const navigate = useNavigate();

  useEffect(() => {
    if (!briefing.onboardingCompleted) navigate({ to: "/onboarding", replace: true });
  }, [briefing.onboardingCompleted, navigate]);

  const journey = JOURNEY[briefing.journeyState];
  const firstName = bootstrap.profile?.full_name?.split(" ")[0] ?? "there";
  const target = briefing.targets.find((c) => c.key === "target_role")?.value;
  const next = nextAction(briefing);

  return (
    <WorkspaceShell
      title={`Good to see you, ${firstName}`}
      subtitle={
        target
          ? `Your stated target is ${target}. Everything below is drawn from your record — nothing is assumed.`
          : "Everything below is drawn from your record — nothing is assumed."
      }
    >
      <section className="grid gap-0 border border-[var(--mkt-border)] sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Journey state" value={`${briefing.journeyState} — ${journey.label}`} />
        <Stat label="Evidence records" value={String(briefing.evidenceTotal)} />
        <Stat
          label="Capabilities judged"
          value={`${briefing.judgedCapabilities} / ${briefing.capabilityTotal}`}
        />
        <Stat label="Verified claims" value={String(briefing.verifiedClaims)} />
      </section>

      <WorkspaceCard title="Where you stand" description={journey.description}>
        <p className="text-sm leading-relaxed text-[var(--mkt-text2)]">
          A claim is not evidence and a score is not verification. Your journey state is read from
          the ledger, the judgements and the attestations on your record — never from what you told
          us during setup.
        </p>
      </WorkspaceCard>

      <WorkspaceCard title="Your next action" description={next.reason}>
        <Link
          to={next.to}
          className="inline-flex items-center gap-2 border border-[var(--mkt-border-l)] bg-[var(--mkt-text1)] px-5 py-3 font-mono text-[0.6875rem] font-bold uppercase text-[var(--mkt-on-dark)] transition-colors hover:bg-[var(--mkt-green)]"
        >
          {next.label} <ArrowRight className="size-3.5" />
        </Link>
      </WorkspaceCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <WorkspaceCard
          title="Evidence by source"
          description="Every record keeps its origin. Sources are never blended."
        >
          {briefing.evidenceBySource.length === 0 ? (
            <p className="text-sm text-[var(--mkt-text2)]">
              No evidence yet. Do a piece of work and capture the artefact.
            </p>
          ) : (
            <ul className="border border-[var(--mkt-border-l)]">
              {briefing.evidenceBySource.map((row) => (
                <li
                  key={row.source}
                  className="flex items-center justify-between border-b border-[var(--mkt-border-l)] px-4 py-3 text-sm last:border-b-0"
                >
                  <span className="text-[var(--mkt-text2)]">
                    {SOURCE_LABELS[row.source] ?? row.source}
                  </span>
                  <span className="font-mono text-xs font-bold">{row.count}</span>
                </li>
              ))}
            </ul>
          )}
        </WorkspaceCard>

        <WorkspaceCard
          title="What you told us"
          description="Self-reported at setup. Kept separate from evidence, always labelled."
        >
          {[...briefing.targets, ...briefing.strengths, ...briefing.workingStyle].length === 0 ? (
            <p className="text-sm text-[var(--mkt-text2)]">
              Nothing recorded yet. <Link className="underline" to="/onboarding">Complete setup</Link>.
            </p>
          ) : (
            <ul className="border border-[var(--mkt-border-l)]">
              {[...briefing.targets, ...briefing.strengths, ...briefing.workingStyle]
                .slice(0, 10)
                .map((claim) => (
                  <li
                    key={`${claim.kind}-${claim.key}`}
                    className="grid grid-cols-[8rem_minmax(0,1fr)] gap-3 border-b border-[var(--mkt-border-l)] px-4 py-3 last:border-b-0"
                  >
                    <span className="font-mono text-[0.625rem] font-bold uppercase text-[var(--mkt-green-m)]">
                      {claim.key.replace(/_/g, " ")}
                    </span>
                    <span className="min-w-0 break-words text-sm text-[var(--mkt-text2)]">
                      {claim.value}
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </WorkspaceCard>
      </div>

      <WorkspaceCard
        title="Organisation"
        description={
          bootstrap.organisation
            ? `${bootstrap.organisation.name} · ${bootstrap.memberCount} member${bootstrap.memberCount === 1 ? "" : "s"} · you are ${bootstrap.role ?? "a member"}`
            : "Optional. Add one when you want to capture observed work with colleagues."
        }
        action={
          <Link
            to={bootstrap.organisation ? "/workspace/team" : "/workspace/organisation"}
            className="border border-[var(--mkt-border-l)] px-4 py-2 font-mono text-[0.625rem] font-bold uppercase text-[var(--mkt-text2)] transition-colors hover:bg-[var(--mkt-text1)] hover:text-[var(--mkt-on-dark)]"
          >
            {bootstrap.organisation ? "Manage team" : "Add organisation"}
          </Link>
        }
      />
    </WorkspaceShell>
  );
}

function nextAction(briefing: DailyBriefing): { label: string; reason: string; to: string } {
  if (briefing.evidenceTotal === 0)
    return {
      label: "See how Experience works",
      reason:
        "Your record has no evidence yet. Realistic work is the only thing that can create it.",
      to: "/experience",
    };
  if (briefing.judgedCapabilities === 0)
    return {
      label: "Open your evidence",
      reason:
        "You have artefacts on record but no framework judgement yet. Review what is captured and run a judgement.",
      to: "/workspace/evidence",
    };
  if (briefing.verifiedClaims === 0)
    return {
      label: "Request an attestation",
      reason:
        "Capability has been judged. Verified only lights from an external attestation, so ask someone who saw the work.",
      to: "/workspace/capability",
    };
  return {
    label: "Review your capability",
    reason: "Your record carries verified signal. Keep it current as new work lands.",
    to: "/workspace/capability",
  };
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-r border-[var(--mkt-border)] p-5 last:border-r-0 sm:p-6">
      <p className="font-mono text-[0.625rem] font-bold uppercase text-[var(--mkt-green-m)]">
        {label}
      </p>
      <p className="mt-3 font-serif text-2xl font-black uppercase leading-none">{value}</p>
    </div>
  );
}
