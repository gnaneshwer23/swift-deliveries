/** Full programme export: every artefact, meeting, decision, interview and the audit trail. */
import { listCapabilities } from "@/lib/workforce/registry";
import {
  decisionStatus,
  finalOptionId,
  latestDecisions,
  programmeMetrics,
  reputation,
} from "./engine";
import { interviewMarkdown } from "./interviews";
import { checkCitations, sourceRegister } from "./research";
import { displayName, member } from "./roster";
import {
  CRITERIA,
  CRITERION_LABELS,
  type DecisionRecord,
  type InterviewRecord,
  type ProgrammeRecord,
  type ProgrammeState,
} from "./types";

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
const pad = (n: number) => String(n).padStart(2, "0");

export function decisionMarkdown(d: DecisionRecord): string {
  const label = (id: string | null) => d.options.find((o) => o.id === id)?.label ?? "—";
  return `# ${d.key}: ${d.question}

- **Status:** ${decisionStatus(d)}
- **Decision:** ${label(finalOptionId(d))}
- **Owner:** ${displayName(d.owner)}
- **Weighted support:** ${Math.round(d.confidence * 100)}%
- **Rationale (rules applied):** ${d.rationale}
${d.human ? `- **Operator:** ${d.human.decision} → ${label(d.human.optionId)}${d.human.note ? ` — “${d.human.note}”` : ""}` : ""}

## Options and criterion scores
| Option | ${CRITERIA.map((c) => CRITERION_LABELS[c]).join(" | ")} |
| --- | ${CRITERIA.map(() => "---").join(" | ")} |
${d.options.map((o) => `| ${o.label} | ${CRITERIA.map((c) => o.scores[c].toFixed(2)).join(" | ")} |`).join("\n")}

## Round 1 — independent positions
| Agent | Department | Position | Confidence | Weight | Rationale |
| --- | --- | --- | --- | --- | --- |
${d.round1.map((p) => `| ${displayName(p.capabilityId)} | ${member(p.capabilityId).department} | ${label(p.optionId)} | ${Math.round(p.confidence * 100)}% | ${p.weight} | ${p.rationale} ${p.concern} |`).join("\n")}

## Vetoes
${d.vetoes.length ? d.vetoes.map((v) => `- ${displayName(v.capabilityId)} vetoed **${label(v.optionId)}**: ${v.reason}`).join("\n") : "None."}

## Round 2 — after critique
${
  d.round2
    .filter((p) => p.revisedFrom)
    .map(
      (p) =>
        `- ${displayName(p.capabilityId)}: ${label(p.revisedFrom!)} → ${label(p.optionId)}${p.persuadedBy ? ` (persuaded by ${displayName(p.persuadedBy)})` : ""}`,
    )
    .join("\n") || "No positions changed."
}

## Tally
${d.tally.map((t) => `- ${label(t.optionId)}: ${Math.round(t.share * 100)}%${t.vetoed ? " (vetoed)" : ""}`).join("\n")}

## Red-team challenge
${displayName(d.challenge.by)}: ${d.challenge.note}

## Sensitivity
${d.sensitivity.robust ? "Robust: the choice holds if any single criterion is ignored." : `Sensitive: the choice changes if ${d.sensitivity.flipsWithout.join(", ")} is ignored.`}

## Review condition
${d.reviewCondition}

## Dissent
${d.dissent.length ? d.dissent.map((x) => `- ${x.note}`).join("\n") : "None."}
`;
}

const FOLDER: Record<string, string> = {
  business_case: "business/business-case.md",
  business_model: "business/business-model.md",
  market_research: "research/market-research.md",
  technology_radar: "research/technology-radar.md",
  prd: "product/prd.md",
  roadmap: "product/delivery-roadmap.md",
  ux_design: "design/ux-design.md",
  architecture: "engineering/architecture.md",
  threat_model: "engineering/threat-model.md",
  verification_report: "quality/verification-report.md",
  gtm_plan: "operations/gtm-plan.md",
  analytics_plan: "operations/analytics-plan.md",
  evolution_plan: "operations/evolution-plan.md",
};

const csv = (rows: Array<Array<string | number>>) =>
  rows.map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(",")).join("\n") + "\n";

export function buildProgrammeExport(
  state: ProgrammeState,
  records: ProgrammeRecord[],
  exportedAt = new Date().toISOString(),
): Array<{ path: string; content: string }> {
  const root = slug(state.title) || "programme";
  const files: Array<{ path: string; content: string }> = [];
  const inventory: Array<{ path: string; category: string; generation: string; status: string }> =
    [];
  const add = (path: string, content: string, meta?: { generation?: string; status?: string }) => {
    files.push({ path: `${root}/${path}`, content });
    inventory.push({
      path,
      category: path.split("/")[0]!.replace(/\.\w+$/, ""),
      generation: meta?.generation ?? "deterministic",
      status: meta?.status ?? "complete",
    });
  };
  const metrics = programmeMetrics(state, records);
  const decisions = latestDecisions(records);
  const order = new Map(state.roadmap.items.map((i, idx) => [i.key, idx]));
  const items = state.roadmap.items;
  const bc = state.businessCase;

  const latestArtefact = new Map<string, ProgrammeRecord>();
  for (const r of records.filter((x) => x.kind === "artefact" && x.itemKey))
    latestArtefact.set(r.itemKey!, r);
  const genOf = (r: ProgrammeRecord) => String(r.data["generation"] ?? "simulated");
  const simulatedCount = [...latestArtefact.values()].filter((a) =>
    genOf(a).startsWith("simulated"),
  ).length;
  const notes = records
    .filter((r) => r.kind === "human_input" && r.data["type"] === "interview_notes")
    .map((r) => ({ title: r.title, body: r.body }));
  const interviews = records.filter((r) => r.kind === "interviews").at(-1);

  add(
    "README.md",
    `# ${state.title}

${bc.idea}

- **Status:** ${state.status} · **Progress:** ${metrics.itemsDone}/${metrics.itemsTotal} work items
- **Credits:** ${state.budget.consumed}/${state.budget.ceiling}
- **Cast:** band ${metrics.staffing.band} · catalogue roster ${metrics.staffing.catalogueSelected}/${metrics.staffing.catalogueCeiling} (not every case staffs 150)
- **Roles that contributed so far:** ${metrics.engagedRoles} across ${metrics.departments.filter((d) => d.engaged).length} departments
- **Decisions:** ${metrics.decisions.total} (${metrics.decisions.adopted} adopted by panels, ${metrics.decisions.escalated} escalated, ${metrics.decisions.overridden} overridden by the founder)
- **Meetings:** ${metrics.meetings} · **Deliverables:** ${metrics.deliverables} · **Peer review average:** ${metrics.reviewAverage ?? "—"}

## What this package does and does not contain
- ${simulatedCount} of ${latestArtefact.size} deliverables are **simulated drafts** (deterministic templates, no model call) — see \`project-manifest.json\`.
- Customer interviews: ${notes.length} real interview note(s); synthetic rehearsal sessions are **not** customer evidence.
- Engineering: a sandboxed HTML prototype only — **no production source code** has been generated yet.
- Tests: static, reproducible checks on artefacts and the prototype — **no behavioural or end-to-end tests** were run.
- Meetings are structured agent deliberations, not recorded human meetings.

## Layout
- \`business/\` idea brief, business case, business model
- \`research/\` market research, technology radar, customer interviews
- \`product/\` PRD, roadmap (markdown + JSON), delivery roadmap
- \`design/\` UX and UI specification
- \`engineering/\` architecture, threat model, sprint increments, prototype
- \`operations/\` tasks.csv, dependencies.json, meetings, decisions, launch and growth plans
- \`quality/\` verification report, peer reviews, known issues
- \`audit/\` workforce, agent contributions, project events
`,
  );

  add(
    "business/idea-brief.md",
    `# Idea brief — ${bc.name}\n\n## Idea\n${bc.idea}\n\n## Problem\n${bc.problem || "—"}\n\n## Target users\n${bc.targetUsers || "—"}\n\n## Goals and success measures\n${bc.goals || "—"}\n\n## Constraints\n${bc.constraints || "—"}\n\n## Timeline and budget\n${bc.timelineWeeks} weeks · ${bc.budgetCredits} credits\n`,
    { generation: "founder input" },
  );

  add(
    "product/roadmap.md",
    `# Roadmap — ${state.title}

## Phases
| Phase | Weeks | Goal | Progress |
| --- | --- | --- | --- |
${metrics.phases.map((p) => `| ${p.name} | ${p.startWeek}–${p.endWeek} | ${state.roadmap.phases.find((x) => x.key === p.key)!.goal} | ${p.done}/${p.total} |`).join("\n")}

## Milestones
${metrics.milestones.map((m) => `- [${m.reached ? "x" : " "}] Week ${m.week}: ${m.title}`).join("\n")}

## Work items
| # | Week | Phase | Item | Type | Owner | Team size | Depends on | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
${items.map((i, idx) => `| ${idx + 1} | ${i.week} | ${i.phase} | ${i.title} | ${i.kind} | ${displayName(i.owner)} | ${i.team.length} | ${i.dependsOn.join(", ") || "—"} | ${i.status} |`).join("\n")}
`,
  );
  add(
    "product/roadmap.json",
    JSON.stringify({ phases: state.roadmap.phases, milestones: metrics.milestones }, null, 2),
  );

  for (const [key, a] of [...latestArtefact.entries()].sort(
    (x, y) => (order.get(x[0]) ?? 0) - (order.get(y[0]) ?? 0),
  )) {
    const item = items.find((i) => i.key === key);
    const produces = String(a.data["produces"] ?? "");
    const path =
      a.format === "html"
        ? "engineering/prototype/index.html"
        : (FOLDER[produces] ??
          (item?.sprint
            ? `engineering/sprints/sprint-${item.sprint}.md`
            : `operations/${slug(key)}.md`));
    add(path, a.body, {
      generation: genOf(a),
      status: item?.status === "failed" ? "failed" : "complete",
    });
  }

  if (interviews || notes.length) {
    add(
      "research/customer-interviews.md",
      interviews
        ? interviewMarkdown(interviews.data as unknown as InterviewRecord, notes)
        : `# Real interview notes\n\n${notes.map((n) => `## ${n.title}\n${n.body}`).join("\n\n")}`,
      {
        generation: notes.length
          ? "synthetic rehearsal + founder-supplied notes"
          : "synthetic rehearsal only",
        status: notes.length ? "complete" : "needs real interviews",
      },
    );
  }

  const register = sourceRegister(records);
  const knownIds = new Set(register.map((x) => x.id));
  add("research/sources.json", JSON.stringify(register, null, 2), {
    generation: register.length
      ? `web search (${[...new Set(register.map((x) => x.provider))].join(", ")})`
      : "none",
    status: register.length ? "complete" : "no search provider configured",
  });

  add(
    "operations/tasks.csv",
    csv([
      [
        "key",
        "title",
        "type",
        "phase",
        "week",
        "owner",
        "team",
        "reviewer",
        "depends_on",
        "status",
        "estimated_credits",
        "actual_credits",
      ],
      ...items.map((i) => [
        i.key,
        i.title,
        i.kind,
        i.phase,
        i.week,
        i.owner,
        i.team.join(" "),
        i.reviewer ?? "",
        i.dependsOn.join(" "),
        i.status,
        i.estimatedCredits,
        i.actualCredits,
      ]),
    ]),
  );
  add(
    "operations/dependencies.json",
    JSON.stringify(
      items.map((i) => ({ key: i.key, dependsOn: i.dependsOn })),
      null,
      2,
    ),
  );
  records
    .filter((r) => r.kind === "meeting")
    .forEach((m, idx) =>
      add(
        `operations/meetings/${pad((order.get(m.itemKey ?? "") ?? idx) + 1)}-${slug(m.itemKey ?? m.title)}${records.filter((x) => x.kind === "meeting" && x.itemKey === m.itemKey).indexOf(m) > 0 ? `-v${records.filter((x) => x.kind === "meeting" && x.itemKey === m.itemKey).indexOf(m) + 1}` : ""}.md`,
        m.body,
        {
          generation: "structured agent deliberation",
        },
      ),
    );
  decisions.forEach((d) => add(`operations/decisions/${slug(d.key)}.md`, decisionMarkdown(d)));
  add("operations/decisions.json", JSON.stringify(decisions, null, 2));

  const reviews = records.filter((r) => r.kind === "review");
  add(
    "quality/peer-reviews.md",
    `# Peer reviews\n\n${reviews.map((r) => `## ${r.title}\n${r.body}`).join("\n\n") || "None yet."}\n`,
  );
  const issues = [
    ...items.filter((i) => i.status === "failed").map((i) => `- **${i.title}** failed.`),
    ...items
      .filter((i) => i.status === "blocked")
      .map((i) => `- **${i.title}** blocked by an upstream failure.`),
    ...reviews.filter((r) => r.data["verdict"] === "revise").map((r) => `- ${r.title}: ${r.body}`),
    ...decisions
      .filter((d) => d.challenge?.evidenceGap)
      .map((d) => `- ${d.key}: evidence gap — ${d.reviewCondition}`),
    ...decisions
      .filter((d) => d.sensitivity && !d.sensitivity.robust)
      .map((d) => `- ${d.key}: choice is sensitive to ${d.sensitivity.flipsWithout.join(", ")}.`),
    ...decisions.flatMap((d) => d.dissent.slice(0, 2).map((x) => `- ${d.key} dissent: ${x.note}`)),
    ...(notes.length
      ? []
      : ["- No real customer interviews recorded; all customer signals are synthetic."]),
    "- No production source code or behavioural tests yet (prototype and static checks only).",
  ];
  add("quality/known-issues.md", `# Known issues and open risks\n\n${issues.join("\n")}\n`);

  const rep = new Map(reputation(records).map((r) => [r.id, r]));
  const staffed = new Map<string, string[]>();
  for (const i of items) {
    for (const p of new Set([
      i.owner,
      ...i.team,
      ...(i.reviewer ? [i.reviewer] : []),
      ...(i.decision?.panel ?? []),
    ])) {
      staffed.set(p, [...(staffed.get(p) ?? []), i.title]);
    }
  }
  add(
    "audit/workforce.md",
    `# Workforce — 150 roles

Judgement score = (decisions where the role's final position matched the decision that stood + deliverables approved in peer review + 1) / (trials + 2).

| ID | Role | Department | Assignments | Judgement score | Trials | Persuaded others |
| --- | --- | --- | --- | --- | --- | --- |
${listCapabilities()
  .map((c) => {
    const r = rep.get(c.capability_id);
    return `| ${c.capability_id} | ${member(c.capability_id).name} | ${c.department} | ${(staffed.get(c.capability_id) ?? []).join("; ") || "—"} | ${r ? r.score : "—"} | ${r?.trials ?? 0} | ${r?.influence ?? 0} |`;
  })
  .join("\n")}
`,
  );
  add(
    "audit/agent-contributions.json",
    JSON.stringify(
      listCapabilities().map((c) => ({
        id: c.capability_id,
        role: member(c.capability_id).name,
        department: c.department,
        assignments: staffed.get(c.capability_id) ?? [],
        reputation: rep.get(c.capability_id) ?? null,
      })),
      null,
      2,
    ),
  );
  add("audit/project-events.json", JSON.stringify({ programme: state, records }, null, 2));

  const manifest = {
    format: "deliverx-project-package",
    formatVersion: 1,
    programme: { id: state.id, title: state.title, status: state.status, version: state.version },
    exportedAt,
    completeness: {
      workItems: { completed: metrics.itemsDone, total: metrics.itemsTotal },
      deliverables: {
        total: latestArtefact.size,
        simulated: simulatedCount,
        modelGenerated: [...latestArtefact.values()].filter((a) => genOf(a).startsWith("model"))
          .length,
      },
      customerInterviews: {
        real: notes.length,
        synthetic: interviews ? (interviews.data as unknown as InterviewRecord).sessions.length : 0,
      },
      productionSourceCode: false,
      testsRun: "static artefact and prototype checks only",
      decisions: {
        total: decisions.length,
        ratifiedOrOverriddenByFounder: decisions.filter((d) => d.human).length,
        optionsFromModel: decisions.filter((d) => d.options.some((o) => o.origin === "model"))
          .length,
      },
      research: {
        sources: register.length,
        byQuality: {
          high: register.filter((x) => x.quality === "high").length,
          medium: register.filter((x) => x.quality === "medium").length,
          low: register.filter((x) => x.quality === "low").length,
        },
        citationCoverage: [...latestArtefact.values()]
          .filter((a) => genOf(a).startsWith("model") && a.format === "markdown")
          .map((a) => {
            const c = checkCitations(a.body, knownIds);
            return { item: a.itemKey, claims: c.claims, coverage: c.coverage, ok: c.ok };
          }),
      },
    },
    excluded: ["secrets and credentials", "personal identifiers (none are collected by design)"],
    inventory: [
      ...inventory,
      {
        path: "project-manifest.json",
        category: "project-manifest",
        generation: "deterministic",
        status: "complete",
      },
    ],
  };
  files.push({ path: `${root}/project-manifest.json`, content: JSON.stringify(manifest, null, 2) });
  return files;
}
