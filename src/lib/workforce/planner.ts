import { maxPermission } from "./permissions";
import type {
  ClarificationQuestion,
  GeneratedPlan,
  MissionIntent,
  PlannedTask,
} from "./types";

const EXTERNAL_HINT =
  /\b(email|send|deploy|publish|post to|slack|tweet|call api|webhook|notify customer|production)\b/i;

function titleFromRequest(intent: MissionIntent, request: string): string {
  const cleaned = request.replace(/\s+/g, " ").trim();
  const clip = cleaned.length > 72 ? `${cleaned.slice(0, 69)}…` : cleaned;
  const prefix =
    intent === "investigate"
      ? "Investigate"
      : intent === "prototype"
        ? "Prototype"
        : "Improve";
  return clip ? `${prefix}: ${clip}` : `${prefix} mission`;
}

function wantsExternal(request: string, answers: Record<string, string>): boolean {
  const blob = `${request} ${Object.values(answers).join(" ")}`;
  return EXTERNAL_HINT.test(blob);
}

function clarificationFor(
  intent: MissionIntent,
  request: string,
  answers: Record<string, string>,
): ClarificationQuestion[] {
  const questions: ClarificationQuestion[] = [];
  const text = request.trim();

  if (text.length < 24) {
    questions.push({
      id: "outcome",
      prompt: "What concrete outcome should we deliver by the end of this mission?",
      required: true,
    });
  }

  if (intent === "investigate" && !answers["audience"] && !/\b(for|audience|stakeholder)\b/i.test(text)) {
    questions.push({
      id: "audience",
      prompt: "Who is the primary audience for the investigation brief?",
      required: true,
    });
  }

  if (intent === "prototype" && !answers["surface"] && !/\b(page|screen|flow|ui|dashboard|form)\b/i.test(text)) {
    questions.push({
      id: "surface",
      prompt: "Which surface should the prototype cover (e.g. landing, settings, checkout)?",
      required: true,
    });
  }

  if (intent === "improve" && !answers["baseline"] && !/\b(current|existing|today|baseline)\b/i.test(text)) {
    questions.push({
      id: "baseline",
      prompt: "What is the current baseline we are improving (link, description, or symptoms)?",
      required: true,
    });
  }

  if (!answers["success"] && !/\b(success|done when|acceptance)\b/i.test(text)) {
    questions.push({
      id: "success",
      prompt: "How will you know this mission succeeded?",
      required: false,
    });
  }

  return questions.filter((q) => !answers[q.id]?.trim());
}

function investigateTasks(request: string, external: boolean): PlannedTask[] {
  const tasks: PlannedTask[] = [
    {
      key: "scope",
      title: "Frame the investigation",
      description: `Define scope, constraints, and decision to be informed from: “${request.slice(0, 160)}”.`,
      acceptanceCriteria: "Scope statement lists in-scope / out-of-scope and the decision owner.",
      estimatedUsage: 4,
      permissionRequired: "plan",
      isExternal: false,
    },
    {
      key: "collect",
      title: "Collect inputs and separate evidence",
      description: "Gather stated facts vs assumptions; tag each claim.",
      acceptanceCriteria: "Evidence table includes sourced facts and explicit assumptions.",
      estimatedUsage: 8,
      permissionRequired: "execute_internally",
      isExternal: false,
    },
    {
      key: "brief",
      title: "Draft product investigation brief",
      description: "Write a reviewable brief with options, risks, and recommendation.",
      acceptanceCriteria: "Brief has summary, options, recommendation, and open questions.",
      estimatedUsage: 10,
      permissionRequired: "create",
      isExternal: false,
    },
    {
      key: "agent_pass",
      title: "Agent review pass",
      description: "Second agent pass checks evidence labels and consistency.",
      acceptanceCriteria: "Artefact marked Agent-reviewed; contradictions listed or cleared.",
      estimatedUsage: 4,
      permissionRequired: "execute_internally",
      isExternal: false,
    },
  ];
  if (external) {
    tasks.push({
      key: "share_external",
      title: "Share brief externally",
      description: "Send or publish the brief outside DeliverX (requires Act externally approval).",
      acceptanceCriteria: "External share only after explicit approval; otherwise blocked.",
      estimatedUsage: 6,
      permissionRequired: "act_externally",
      isExternal: true,
    });
  }
  return tasks;
}

function prototypeTasks(request: string, external: boolean): PlannedTask[] {
  const tasks: PlannedTask[] = [
    {
      key: "brief",
      title: "Write reviewable product brief",
      description: `Capture problem, users, and prototype goals for: “${request.slice(0, 160)}”.`,
      acceptanceCriteria: "Brief states problem, primary user, and success signal.",
      estimatedUsage: 6,
      permissionRequired: "create",
      isExternal: false,
    },
    {
      key: "structure",
      title: "Structure the interactive flow",
      description: "Define screens/sections and primary interactions.",
      acceptanceCriteria: "Flow list covers entry → primary action → confirmation.",
      estimatedUsage: 6,
      permissionRequired: "execute_internally",
      isExternal: false,
    },
    {
      key: "html",
      title: "Build lightweight HTML prototype",
      description: "Produce a self-contained HTML artefact (not a production deploy).",
      acceptanceCriteria: "HTML opens standalone and shows the primary flow.",
      estimatedUsage: 14,
      permissionRequired: "create",
      isExternal: false,
    },
    {
      key: "auto_test",
      title: "Run automatic structure checks",
      description: "Validate that required sections and CTAs exist in the prototype.",
      acceptanceCriteria: "Checks pass; artefact marked Automatically tested.",
      estimatedUsage: 4,
      permissionRequired: "execute_internally",
      isExternal: false,
    },
  ];
  if (external) {
    tasks.push({
      key: "deploy_preview",
      title: "Publish preview URL",
      description: "Deploy a public preview (Act externally).",
      acceptanceCriteria: "Public URL only after explicit external approval.",
      estimatedUsage: 8,
      permissionRequired: "act_externally",
      isExternal: true,
    });
  }
  return tasks;
}

function improveTasks(request: string, external: boolean): PlannedTask[] {
  const tasks: PlannedTask[] = [
    {
      key: "diagnose",
      title: "Diagnose friction",
      description: `Identify failure points in the current experience: “${request.slice(0, 160)}”.`,
      acceptanceCriteria: "At least three friction points with evidence classification.",
      estimatedUsage: 8,
      permissionRequired: "execute_internally",
      isExternal: false,
    },
    {
      key: "options",
      title: "Propose improvement options",
      description: "Rank options by impact vs effort; call out assumptions.",
      acceptanceCriteria: "Memo lists options with impact/effort and recommendation.",
      estimatedUsage: 8,
      permissionRequired: "create",
      isExternal: false,
    },
    {
      key: "patch_proto",
      title: "Sketch improved flow",
      description: "Produce a lightweight improved HTML/structure sketch.",
      acceptanceCriteria: "Improved sketch shows the recommended change clearly.",
      estimatedUsage: 10,
      permissionRequired: "create",
      isExternal: false,
    },
    {
      key: "agent_pass",
      title: "Agent review pass",
      description: "Check that recommendations do not over-claim evidence.",
      acceptanceCriteria: "Artefact marked Agent-reviewed.",
      estimatedUsage: 4,
      permissionRequired: "execute_internally",
      isExternal: false,
    },
  ];
  if (external) {
    tasks.push({
      key: "notify_stakeholders",
      title: "Notify stakeholders externally",
      description: "Email/Slack the improvement memo outside the workspace.",
      acceptanceCriteria: "External notify only after Act externally approval.",
      estimatedUsage: 5,
      permissionRequired: "act_externally",
      isExternal: true,
    });
  }
  return tasks;
}

export function deriveMissionTitle(intent: MissionIntent, request: string): string {
  return titleFromRequest(intent, request);
}

/**
 * Deterministic planner for Stage 1.
 * Returns clarification questions when the request is incomplete;
 * otherwise a full plan with tasks, acceptance criteria, and usage estimates.
 */
export function generateMissionPlan(input: {
  intent: MissionIntent;
  requestText: string;
  clarificationAnswers?: Record<string, string>;
}): GeneratedPlan {
  const answers = input.clarificationAnswers ?? {};
  const questions = clarificationFor(input.intent, input.requestText, answers);
  const external = wantsExternal(input.requestText, answers);

  if (questions.some((q) => q.required)) {
    return {
      summary: "Need a little more detail before a reliable plan can be approved.",
      estimatedUsage: 0,
      requiredPermission: "plan",
      includesExternalActions: external,
      clarificationQuestions: questions,
      acceptanceCriteria: [],
      tasks: [],
    };
  }

  const tasks =
    input.intent === "investigate"
      ? investigateTasks(input.requestText, external)
      : input.intent === "prototype"
        ? prototypeTasks(input.requestText, external)
        : improveTasks(input.requestText, external);

  const estimatedUsage = tasks.reduce((sum, t) => sum + t.estimatedUsage, 0);
  const requiredPermission = maxPermission(tasks.map((t) => t.permissionRequired));

  const acceptanceCriteria = [
    ...tasks.map((t) => t.acceptanceCriteria),
    "Delivery report lists artefacts with quality and evidence labels (no generic Verified).",
    "Usage stays within the workspace ceiling; billable steps hard-stop if the ceiling is reached.",
  ];

  const summary =
    input.intent === "investigate"
      ? "Produce a reviewable investigation brief with classified evidence and a clear recommendation."
      : input.intent === "prototype"
        ? "Produce a product brief plus a lightweight interactive HTML prototype (not a production deploy)."
        : "Diagnose friction, recommend improvements, and sketch an improved flow.";

  return {
    summary,
    estimatedUsage,
    requiredPermission,
    includesExternalActions: external,
    clarificationQuestions: questions.filter((q) => !q.required),
    acceptanceCriteria,
    tasks,
  };
}
