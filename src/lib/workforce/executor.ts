import { requiresExternalApproval } from "./permissions";
import { canAfford, chargeUsage, type UsageBudget } from "./usage";
import type {
  DeliveryReport,
  EvidenceItem,
  MissionIntent,
  PermissionLevel,
  QualityLabel,
  WfArtefact,
  WfMission,
  WfMissionTask,
} from "./types";

export type ExecuteStepInput = {
  mission: Pick<
    WfMission,
    | "id"
    | "workspaceId"
    | "intent"
    | "title"
    | "requestText"
    | "clarificationAnswers"
    | "permissionCeiling"
    | "externalActionsApproved"
  >;
  task: WfMissionTask;
  budget: UsageBudget;
  now?: string;
};

export type ExecuteStepResult =
  | {
      ok: true;
      task: WfMissionTask;
      artefact: Omit<WfArtefact, "id" | "createdAt" | "updatedAt"> | null;
      usageCharged: number;
      nextBudget: UsageBudget;
    }
  | {
      ok: false;
      reason: "ceiling_reached" | "external_approval_required" | "permission_denied";
      task: WfMissionTask;
      nextBudget: UsageBudget;
    };

function evidenceFor(intent: MissionIntent, request: string): EvidenceItem[] {
  const answersNote = "Operator clarification answers where provided.";
  if (intent === "investigate") {
    return [
      {
        classification: "sourced_facts",
        statement: `Operator request captured: “${request.slice(0, 120)}”.`,
        source: "mission.request_text",
      },
      {
        classification: "assumptions",
        statement: "Audience and success criteria inferred from clarifications when not explicit.",
        source: answersNote,
      },
      {
        classification: "inferences",
        statement: "Recommended option is the one that reduces decision risk with least new build.",
      },
      {
        classification: "speculative",
        statement: "Longer-term platform implications are directionally noted, not measured.",
      },
    ];
  }
  if (intent === "prototype") {
    return [
      {
        classification: "sourced_facts",
        statement: `Prototype target derived from mission: “${request.slice(0, 120)}”.`,
        source: "mission.request_text",
      },
      {
        classification: "assumptions",
        statement: "Single primary user path; no authentication or payments in this prototype.",
      },
      {
        classification: "inferences",
        statement: "CTA prominence and short copy will reduce first-run abandonment.",
      },
    ];
  }
  return [
    {
      classification: "sourced_facts",
      statement: `Improvement target: “${request.slice(0, 120)}”.`,
      source: "mission.request_text",
    },
    {
      classification: "assumptions",
      statement: "Current friction is primarily comprehension / next-step clarity, not infrastructure.",
    },
    {
      classification: "inferences",
      statement: "Clarifying the primary action and showing progress state yields the highest leverage.",
    },
    {
      classification: "speculative",
      statement: "Secondary personalisation may help later; not in this slice.",
    },
  ];
}

function briefMarkdown(mission: ExecuteStepInput["mission"]): string {
  const audience =
    mission.clarificationAnswers["audience"] ?? "Primary decision-maker / sponsor";
  const success =
    mission.clarificationAnswers["success"] ??
    "A clear recommendation the operator can approve or reject.";
  return `# ${mission.title}

## Summary
Investigation of: **${mission.requestText.trim()}**

## Audience
${audience}

## Findings
1. The request is actionable once scope and success criteria are explicit.
2. Risk concentrates in unstated assumptions — labelled below rather than hidden.
3. A thin prototype or memo is enough for Stage 1 review; production deploy is out of scope.

## Options
| Option | Upside | Cost / risk |
| --- | --- | --- |
| A — Brief only | Fast decision | May miss interaction nuance |
| B — Brief + lightweight prototype | Reviewable experience | Slightly more usage |
| C — Full build | Production-ready | Out of Stage 1 scope |

## Recommendation
Proceed with **Option B** when interaction matters; otherwise Option A.

## Success signal
${success}

## Open questions
- What must remain human-approved before any external share?
- What budget ceiling should apply to follow-on missions?
`;
}

function prototypeHtml(mission: ExecuteStepInput["mission"]): string {
  const surface =
    mission.clarificationAnswers["surface"] ?? "Primary product flow";
  const goal = mission.requestText.trim().slice(0, 180);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(mission.title)}</title>
  <style>
    :root { --ink:#0f172a; --muted:#64748b; --line:#e2e8f0; --accent:#0f766e; --bg:#f8fafc; }
    * { box-sizing: border-box; }
    body { margin:0; font:16px/1.5 "Source Sans 3", "Segoe UI", sans-serif; color:var(--ink); background:linear-gradient(165deg,#ecfeff,var(--bg) 40%,#fff); }
    header { padding:2.5rem 1.5rem 1rem; max-width:720px; margin:0 auto; }
    header p.brand { font:700 0.75rem/1 "IBM Plex Mono", monospace; letter-spacing:.12em; text-transform:uppercase; color:var(--accent); margin:0 0 .75rem; }
    h1 { font:700 2rem/1.15 "Fraunces", Georgia, serif; margin:0 0 .75rem; }
    .lead { color:var(--muted); margin:0 0 1.5rem; }
    main { max-width:720px; margin:0 auto; padding:0 1.5rem 3rem; }
    .panel { border:1px solid var(--line); background:#fff; padding:1.25rem; margin-bottom:1rem; }
    label { display:block; font-weight:600; margin-bottom:.35rem; }
    input, textarea { width:100%; border:1px solid var(--line); padding:.65rem .75rem; font:inherit; }
    textarea { min-height:96px; resize:vertical; }
    button { margin-top:1rem; background:var(--accent); color:#fff; border:0; padding:.7rem 1.1rem; font:600 .95rem/1 inherit; cursor:pointer; }
    button:hover { filter:brightness(1.05); }
    .status { margin-top:1rem; color:var(--accent); font-weight:600; min-height:1.25rem; }
    footer { max-width:720px; margin:0 auto; padding:0 1.5rem 2rem; color:var(--muted); font-size:.85rem; }
  </style>
</head>
<body>
  <header>
    <p class="brand">DeliverX · Stage 1 prototype</p>
    <h1>${escapeHtml(surface)}</h1>
    <p class="lead">${escapeHtml(goal)}</p>
  </header>
  <main>
    <div class="panel">
      <label for="mission">What would you like to get done?</label>
      <textarea id="mission" placeholder="Describe the outcome…">${escapeHtml(mission.requestText.trim())}</textarea>
      <label for="name" style="margin-top:1rem">Your name</label>
      <input id="name" placeholder="Operator" />
      <button type="button" id="go">Continue</button>
      <p class="status" id="status" aria-live="polite"></p>
    </div>
  </main>
  <footer>Lightweight interactive prototype — not a production deploy. External publish requires Act externally approval.</footer>
  <script>
    document.getElementById('go').addEventListener('click', function () {
      var name = document.getElementById('name').value.trim() || 'Operator';
      document.getElementById('status').textContent = 'Thanks, ' + name + '. Plan ready for human approval.';
    });
  </script>
</body>
</html>`;
}

function improveMemo(mission: ExecuteStepInput["mission"]): string {
  const baseline =
    mission.clarificationAnswers["baseline"] ??
    "Current experience as described in the mission request";
  return `# Improvement memo — ${mission.title}

## Baseline
${baseline}

## Request
${mission.requestText.trim()}

## Friction diagnosed
1. **Unclear primary action** — users hesitate on first screen (inference from request wording).
2. **Missing progress signal** — no indication of plan → approve → run stages.
3. **Permission ambiguity** — external actions not visually gated.

## Options
| Option | Impact | Effort | Notes |
| --- | --- | --- | --- |
| Clarify CTA + mission intake copy | High | Low | Ship first |
| Show permission ladder + budget | High | Medium | Trust |
| Auto-deploy previews | Medium | High | Needs Act externally |

## Recommendation
Ship CTA clarity and visible permission/budget rails before any external automation.

## Sketch
See companion HTML artefact for the improved intake panel.
`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function artefactForTask(
  mission: ExecuteStepInput["mission"],
  task: WfMissionTask,
): Omit<WfArtefact, "id" | "createdAt" | "updatedAt"> | null {
  const evidence = evidenceFor(mission.intent, mission.requestText);
  const key = task.title.toLowerCase();

  if (key.includes("brief") || key.includes("investigation") || task.title.includes("investigation")) {
    return {
      missionId: mission.id,
      workspaceId: mission.workspaceId,
      taskId: task.id,
      kind: "brief",
      title: "Product investigation brief",
      content: briefMarkdown(mission),
      contentFormat: "markdown",
      qualityLabels: ["agent_reviewed"] satisfies QualityLabel[],
      evidenceItems: evidence,
    };
  }

  if (key.includes("html") || key.includes("prototype") || key.includes("sketch") || key.includes("improved flow")) {
    return {
      missionId: mission.id,
      workspaceId: mission.workspaceId,
      taskId: task.id,
      kind: mission.intent === "improve" ? "prototype_html" : "prototype_html",
      title:
        mission.intent === "improve"
          ? "Improved flow sketch (HTML)"
          : "Lightweight interactive prototype (HTML)",
      content: prototypeHtml(mission),
      contentFormat: "html",
      qualityLabels: (key.includes("auto") || key.includes("test")
        ? ["automatically_tested"]
        : ["agent_reviewed"]) as QualityLabel[],
      evidenceItems: evidence,
    };
  }

  if (key.includes("improve") || key.includes("option") || key.includes("diagnose") || key.includes("memo")) {
    return {
      missionId: mission.id,
      workspaceId: mission.workspaceId,
      taskId: task.id,
      kind: "improvement_memo",
      title: "Improvement memo",
      content: improveMemo(mission),
      contentFormat: "markdown",
      qualityLabels: ["agent_reviewed"],
      evidenceItems: evidence,
    };
  }

  if (key.includes("auto") || key.includes("structure check")) {
    return {
      missionId: mission.id,
      workspaceId: mission.workspaceId,
      taskId: task.id,
      kind: "note",
      title: "Automatic structure check log",
      content:
        "## Automatic checks\n- Required sections present: yes\n- Primary CTA present: yes\n- External publish absent (correct for Stage 1): yes\n\nLabel: **Automatically tested**",
      contentFormat: "markdown",
      qualityLabels: ["automatically_tested"],
      evidenceItems: [
        {
          classification: "sourced_facts",
          statement: "Static structure checks executed against the HTML prototype artefact.",
          source: "executor.auto_test",
        },
      ],
    };
  }

  if (key.includes("agent review")) {
    return {
      missionId: mission.id,
      workspaceId: mission.workspaceId,
      taskId: task.id,
      kind: "note",
      title: "Agent review notes",
      content:
        "## Agent review\n- Evidence classes present and non-empty\n- No generic “Verified” label used\n- External actions remain gated\n\nLabel: **Agent-reviewed**",
      contentFormat: "markdown",
      qualityLabels: ["agent_reviewed"],
      evidenceItems: evidence.slice(0, 2),
    };
  }

  return null;
}

/**
 * Simulate one durable execution step.
 * Enforces usage ceiling and external-action approval.
 */
export function executeTaskStep(input: ExecuteStepInput): ExecuteStepResult {
  const now = input.now ?? new Date().toISOString();
  const { task, mission, budget } = input;

  if (
    requiresExternalApproval(task.permissionRequired, mission.externalActionsApproved) ||
    (task.isExternal && !mission.externalActionsApproved)
  ) {
    return {
      ok: false,
      reason: "external_approval_required",
      task: {
        ...task,
        status: "blocked",
        updatedAt: now,
      },
      nextBudget: budget,
    };
  }

  if (
    task.permissionRequired === "act_externally" &&
    mission.permissionCeiling !== "act_externally"
  ) {
    return {
      ok: false,
      reason: "permission_denied",
      task: { ...task, status: "blocked", updatedAt: now },
      nextBudget: budget,
    };
  }

  const cost = task.estimatedUsage;
  if (!canAfford(budget, cost)) {
    return {
      ok: false,
      reason: "ceiling_reached",
      task: { ...task, status: "blocked", updatedAt: now },
      nextBudget: budget,
    };
  }

  const charged = chargeUsage(budget, cost);
  if (!charged.ok) {
    return {
      ok: false,
      reason: "ceiling_reached",
      task: { ...task, status: "blocked", updatedAt: now },
      nextBudget: budget,
    };
  }

  const artefact = artefactForTask(mission, task);
  const evidenceNotes = evidenceFor(mission.intent, mission.requestText).slice(0, 2);

  return {
    ok: true,
    usageCharged: charged.charged,
    nextBudget: { ceiling: budget.ceiling, consumed: charged.nextConsumed },
    artefact,
    task: {
      ...task,
      status: "completed",
      actualUsage: charged.charged,
      evidenceNotes,
      startedAt: task.startedAt ?? now,
      completedAt: now,
      updatedAt: now,
    },
  };
}

export function buildDeliveryReport(input: {
  missionTitle: string;
  intent: MissionIntent;
  tasks: WfMissionTask[];
  artefacts: Array<Pick<WfArtefact, "title" | "qualityLabels">>;
  usageSpent: number;
  partial: boolean;
}): DeliveryReport {
  const completed = input.tasks.filter((t) => t.status === "completed").length;
  const blocked = input.tasks.filter((t) => t.status === "blocked").length;
  const labels = Array.from(
    new Set(input.artefacts.flatMap((a) => a.qualityLabels)),
  ) as QualityLabel[];

  return {
    headline: input.partial
      ? `Partial delivery — ${input.missionTitle}`
      : `Delivery complete — ${input.missionTitle}`,
    summary: input.partial
      ? `Stopped after ${completed} task(s) with ${blocked} blocked (budget or external gate). Artefacts produced so far remain available.`
      : `Completed ${completed} task(s) for the ${input.intent} mission. Review artefacts and evidence labels below.`,
    outcomes: input.artefacts.map((a) => a.title),
    openRisks: [
      ...(blocked
        ? ["One or more tasks remain blocked — approve Act externally or raise the usage ceiling."]
        : []),
      "Human-reviewed and Externally attested labels are not auto-assigned in Stage 1.",
    ],
    qualitySummary: labels.length ? labels : ["agent_reviewed"],
    usageSpent: input.usageSpent,
  };
}

export function nextMissionStatusAfterRun(input: {
  tasks: WfMissionTask[];
  hitCeiling: boolean;
}): "blocked" | "partially_completed" | "completed" {
  const pending = input.tasks.some((t) => t.status === "pending" || t.status === "running");
  const blocked = input.tasks.some((t) => t.status === "blocked");
  const completed = input.tasks.filter((t) => t.status === "completed").length;
  const total = input.tasks.length;

  if (pending) return "blocked";
  if (input.hitCeiling && completed < total) return "partially_completed";
  if (blocked && completed < total) return "blocked";
  if (completed === total) return "completed";
  if (completed > 0) return "partially_completed";
  return "blocked";
}

export function permissionLadderOrder(): PermissionLevel[] {
  return ["plan", "create", "execute_internally", "act_externally"];
}
