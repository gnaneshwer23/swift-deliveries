import {
  Code2,
  Gavel,
  MessageSquareText,
  Rocket,
  ScanSearch,
  Target,
  CheckCheck,
} from "lucide-react";
import { useMemo } from "react";
import {
  BuildPathIllustration,
  LearningIllustration,
  WorkforceIllustration,
} from "@/components/illustrations/platform-illustrations";
import type { SetupFields } from "@/lib/onboarding-draft";
import { intentForGoal } from "@/lib/onboarding-intent";
import { WORKFORCE_DEPARTMENTS, WORKFORCE_INTENTS } from "@/lib/marketing/workforce-summary";

const PATH = [
  { id: "prompt", label: "Prompt", icon: MessageSquareText },
  { id: "frame", label: "Frame", icon: Target },
  { id: "evidence", label: "Evidence", icon: ScanSearch },
  { id: "decide", label: "Decide", icon: Gavel },
  { id: "build", label: "Build", icon: Code2 },
  { id: "verify", label: "Verify", icon: CheckCheck },
  { id: "learn", label: "Learn", icon: Rocket },
];

export function OnboardingStage({ step, fields }: { step: number; fields: SetupFields }) {
  const intent = intentForGoal(fields.goal);
  const team = WORKFORCE_INTENTS[intent];
  const active = useMemo(() => {
    const m = new Map<number, number>();
    if (!fields.goal) return m;
    for (const c of team) m.set(c.department, (m.get(c.department) ?? 0) + 1);
    return m;
  }, [team, fields.goal]);

  const view =
    step === 0
      ? {
          label: "Your workspace",
          title: fields.fullName.trim()
            ? `${fields.fullName.trim().split(" ")[0]}, at the centre`
            : "You, at the centre",
          body: "Specialist agents research, draft and review around you. Every decision that matters stays yours.",
          meta:
            [fields.role, fields.teamSize].filter(Boolean).join(" · ") ||
            "Add your role and team size",
        }
      : step === 1
        ? {
            label: "Typical starting team",
            title: fields.goal
              ? `${team.length} specialists · ${active.size} departments`
              : "Choose a goal to see a team",
            body: fields.goal
              ? "This is the team a mission like yours usually starts with. You see and approve the real plan before anything runs."
              : "Each goal starts from a different mix of research, product, design, engineering and quality specialists.",
            meta: fields.goal ? team.map((c) => c.name.replace(/ Agent$/, "")).join(" · ") : "",
          }
        : {
            label: "Your build record starts here",
            title: "Step 1 of 7 · Prompt",
            body:
              fields.firstIdea.trim() ||
              "Your product question opens the record. Evidence, options, decisions and checks are added as the work happens.",
            meta: "Every step records who contributed, what was used and how it was produced.",
          };

  return (
    <div className="ix ob-stage" data-step={step}>
      <div className="ob-stage-head">
        <small>{view.label}</small>
        <strong>{view.title}</strong>
      </div>
      <div className="ob-stage-art" aria-live="polite">
        {step === 0 && <LearningIllustration />}
        {step === 1 && (
          <WorkforceIllustration departments={WORKFORCE_DEPARTMENTS} active={active} />
        )}
        {step === 2 && <BuildPathIllustration steps={PATH} selected="prompt" />}
      </div>
      <div className="ob-stage-foot">
        <p>{view.body}</p>
        {view.meta && <small>{view.meta}</small>}
      </div>
    </div>
  );
}
