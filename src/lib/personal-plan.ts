import type { DailyBriefing, SelfReportClaim } from "./onboarding.functions";

/**
 * Derives a personalised, self-reported-only plan from onboarding claims plus
 * the record. It reads nothing new and writes nothing: no evidence, no score,
 * no capability, no verified status.
 */

export type PersonalStep = {
  key: string;
  title: string;
  reason: string;
  to: string;
  done: boolean;
};

export type PacePlan = {
  label: string;
  hoursPerWeek: string;
  cadence: string;
};

const claim = (claims: SelfReportClaim[], key: string) =>
  claims.find((c) => c.key === key)?.value ?? "";

export function personalGoal(briefing: DailyBriefing) {
  const role = claim(briefing.targets, "target_role");
  const level = claim(briefing.targets, "target_level");
  const domains = claim(briefing.targets, "target_domains");
  const timeframe = claim(briefing.targets, "timeframe");
  const currentRole = claim(briefing.identity, "current_role");
  const years = claim(briefing.identity, "years_experience");
  return { role, level, domains, timeframe, currentRole, years };
}

const PACE_PLANS: Record<string, PacePlan> = {
  "A few hours a week": {
    label: "Steady",
    hoursPerWeek: "3–5 hours",
    cadence: "One task a week, reviewed at the weekend.",
  },
  "Several evenings a week": {
    label: "Focused",
    hoursPerWeek: "6–10 hours",
    cadence: "Two tasks a week, one review session.",
  },
  "Full-time focus": {
    label: "Intensive",
    hoursPerWeek: "20+ hours",
    cadence: "A task every two days, reviews as they land.",
  },
};

export function pacePlan(briefing: DailyBriefing): PacePlan | null {
  const pace = claim(briefing.workingStyle, "pace");
  return PACE_PLANS[pace] ?? null;
}

export function starterSteps(briefing: DailyBriefing): PersonalStep[] {
  const goal = personalGoal(briefing);
  const posture = claim(briefing.evidencePosture, "proof_today");
  const hasNothing = posture.includes("Nothing I can show yet") || posture.length === 0;
  const hasReferences = posture.includes("References or former managers");
  const early = goal.years === "0–2" || goal.years === "";

  const steps: PersonalStep[] = [];

  steps.push({
    key: "profile",
    title: goal.role ? `Confirm your target: ${goal.role}` : "Set the role you are aiming at",
    reason: goal.role
      ? "Everything below is ordered around this target. Change it whenever it changes."
      : "Without a target, the plan cannot be ordered around anything.",
    to: "/workspace/profile",
    done: goal.role.length > 0,
  });

  steps.push({
    key: "first-work",
    title: hasNothing
      ? "Do your first Experience task"
      : "Do one Experience task to create ledger-backed proof",
    reason: hasNothing
      ? "You told us you have nothing to show yet, so simulated work is the fastest route to a real artefact."
      : "What you have today sits outside the ledger. One task inside the platform produces provenance-backed proof.",
    to: "/workspace/experience",
    done: briefing.evidenceTotal > 0,
  });

  if (early) {
    steps.push({
      key: "interview",
      title: "Practise one interview story",
      reason: "With fewer years behind you, a rehearsed story from real work closes the gap fastest.",
      to: "/workspace/interview",
      done: false,
    });
  }

  steps.push({
    key: "judge",
    title: "Get your work judged against the framework",
    reason:
      "Judgement turns artefacts into a capability picture. It never sets Verified on its own.",
    to: "/workspace/capability",
    done: briefing.judgedCapabilities > 0,
  });

  steps.push({
    key: "attest",
    title: hasReferences
      ? "Ask one of your references to attest"
      : "Ask someone who saw the work to attest",
    reason: hasReferences
      ? "You already named references, so verification is one request away."
      : "Only an external attestation can light Verified — never a score and never a coach.",
    to: "/workspace/capability",
    done: briefing.verifiedClaims > 0,
  });

  if (goal.timeframe === "Within 3 months" || goal.timeframe === "3–6 months") {
    steps.push({
      key: "package",
      title: "Package what the record supports",
      reason: `Your timeframe is "${goal.timeframe}", so start shaping a shareable portfolio early.`,
      to: "/workspace/launchpad",
      done: false,
    });
  }

  return steps;
}
