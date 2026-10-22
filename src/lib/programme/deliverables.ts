/**
 * Deliverables, peer review and verification.
 *
 * Simulated drafts are built from the business case, the decisions the team
 * has adopted so far and upstream deliverables — so later work visibly
 * depends on earlier judgements. Model mode replaces the draft text; the
 * contract, review and verification rules are identical in both modes.
 */
import {
  checkMarkdownContract,
  checkPrototypeHtml,
  markdownSections,
} from "@/lib/workforce/contracts";
import { displayName } from "./roster";
import type { BusinessCase, ReviewRecord, WorkItem } from "./types";

export type EffectiveDecision = { key: string; question: string; label: string; status: string };

const HINTS: Record<string, string> = {
  opportunity: "{name}: {idea}",
  problem: "{problem}",
  "target users": "{users}{segment}",
  "business objectives": "{goals}",
  assumptions:
    "- Demand exists at the scale implied by the goals (assumption)\n- Users will adopt without heavy onboarding (assumption)\n- Constraints: {constraints}",
  risks:
    "- Discovery evidence is limited until real interviews are added\n- Scope creep against the timeline of {weeks} weeks\n- Budget: {budget} credits",
  "success metrics":
    "- Activation of the primary journey\n- Week-4 retention\n- Progress against: {goals}",
  "market landscape":
    "Market context for {name}. Evidence must be sourced; unsourced statements are labelled inference.",
  competitors:
    "| Alternative | Strength | Gap (inference) |\n| --- | --- | --- |\n| Status-quo workaround | Free, familiar | Slow, error-prone |\n| Generic tools | Flexible | Not built for {users} |",
  "customer segments": "{users}{segment}",
  "demand signals":
    "Synthetic interview rehearsal only — real demand signals pending operator-supplied interviews.",
  "evidence gaps": "- Real customer interviews\n- Market sizing source\n- Willingness-to-pay data",
  "technology radar":
    "| Technology | Ring | Rationale |\n| --- | --- | --- |\n| Managed backend platforms | adopt | Mature, fast to build |\n| LLM-assisted features | experiment | Valuable but needs evaluation |\n| Agentic automation | monitor | Fast-moving, reliability unproven |",
  "maturity assessment":
    "Lab result → reproducible prototype → production-ready. Only production-ready items enter MVP scope.",
  recommendations:
    "Adopt managed infrastructure; run a bounded experiment for any AI feature; monitor the rest.",
  "problem statement": "{problem} — for {users}{segment}.",
  requirements:
    "- R1: Primary journey to first outcome in one session{journey}\n- R2: Clear status and evidence for every result\n- R3: Privacy-respecting data handling",
  "user stories":
    "- As one of {users}, I want to reach my first outcome quickly so that I see value immediately.\n- As one of {users}, I want to understand what the product did so that I trust it.",
  "acceptance criteria":
    "- AC1: Primary journey completes without errors\n- AC2: Every result shows its status\n- AC3: No personal data leaves without consent",
  "out of scope": "Anything outside the adopted MVP scope{mvp}.",
  "revenue model": "Subscription with a free trial (assumption to test).",
  pricing: "Entry tier priced against the time saved; validate with real interviews before launch.",
  "unit economics":
    "Target gross margin ≥ 70%; CAC payback < 12 months (targets, not measurements).",
  "cost forecast":
    "Programme budget {budget} credits; infrastructure follows the adopted build approach{stack}.",
  "commercial assumptions":
    "- Price sensitivity is high outside early adopters (synthetic signal)\n- Design partners reduce sales cycle length",
  milestones: "{milestones}",
  workstreams:
    "Product · Design · Engineering · AI & data · Security · QA · Platform · Go-to-market · Analytics",
  dependencies:
    "Discovery → scope gate → design and architecture → design gate → sprints → verification → release gate → launch.",
  "capacity and budget":
    "{budget} credits across {weeks} weeks; deterministic hard-stop at the ceiling.",
  "risks to plan": "- Gate decisions delayed\n- Escalated decisions without operator input",
  "user journeys":
    "1. Arrive and understand value\n2. Complete the primary task{journey}\n3. Review the result and next step",
  "information architecture": "Home · Primary workspace · History · Settings",
  screens:
    "- Entry screen with one primary action\n- Result screen with clear status\n- Settings with privacy controls",
  "content and copy": "Plain language for {users}; every error explains the fix.",
  accessibility:
    "WCAG 2.2 AA: keyboard access, visible focus, 4.5:1 contrast, labelled inputs, live status regions.",
  "system context":
    "Web client → application server → managed database; secrets in environment variables{stack}.",
  components: "- Web UI\n- Application API\n- Data store\n- Background jobs\n- Analytics pipeline",
  "data model": "User · Workspace · Item · Event (append-only) · Consent.",
  integrations: "Email and payments via established providers; each integration behind an adapter.",
  "trade offs":
    "| Choice | Upside | Cost |\n| --- | --- | --- |\n| Managed services | Speed | Some lock-in |\n| Custom services | Control | Operations load |",
  "assets and trust boundaries":
    "User data, credentials, payment tokens; boundaries at browser ↔ API ↔ database ↔ third parties.",
  threats:
    "- Broken access control\n- Injection\n- Credential stuffing\n- Data leakage to third parties",
  "privacy assessment":
    "Data minimisation, purpose limitation, retention limits; DPIA required before processing personal data at scale.",
  mitigations:
    "Row-level security, parameterised queries, rate limiting, MFA option, secrets management, audit trail.",
  "residual risks": "Third-party provider outages; social engineering.",
  "sprint goal": "Sprint {sprint}: deliver the next slice of the adopted MVP scope{mvp}.",
  "delivered stories": "- Primary journey slice {sprint}\n- Tests for the delivered slice",
  "technical notes": "Built on the adopted approach{stack}; reviewed by Code Review before merge.",
  "known issues": "- Edge cases in error handling to harden next sprint",
  positioning:
    "For {users} who struggle with {problem}, {name} delivers the first outcome in one session.",
  "audience and channels": "{users}{segment}: communities, partners, search and content.",
  "launch sequence": "Launch plan follows the go/no-go decision{golive}.",
  "sales motion": "Self-serve trial with assisted onboarding for design partners.",
  "launch metrics": "Sign-ups, activation, week-1 retention, conversion to paid.",
  "north star metric": "Weekly users completing the primary journey.",
  "event taxonomy":
    "journey_started, journey_completed, result_viewed, error_shown, upgrade_clicked (no personal data in properties).",
  "funnels and cohorts": "Visit → sign-up → first outcome → week-4 active; weekly cohorts.",
  dashboards: "Activation, retention, conversion and cost per active user.",
  privacy: "Consent-based analytics; personal data excluded from events.",
  "what we learned": "Decisions taken: {decisions}",
  "next experiments":
    "| Hypothesis | Test | Threshold |\n| --- | --- | --- |\n| Shorter onboarding lifts activation | A/B | +10% |",
  "roadmap changes":
    "Re-prioritise using measured activation and retention once real data arrives.",
  "technology watchlist": "Items in the foresight radar marked monitor or experiment.",
};

function decisionLabel(decisions: EffectiveDecision[], keyPrefix: string): string {
  const d = decisions.find((x) => x.key.startsWith(keyPrefix));
  return d ? ` (decision ${d.key}: ${d.label}, ${d.status})` : "";
}

export function simulatedDeliverable(
  item: WorkItem,
  bc: BusinessCase,
  decisions: EffectiveDecision[],
  extras: { milestones: string; upstreamTitles: string[] },
): string {
  const vars: Record<string, string> = {
    name: bc.name,
    idea: bc.idea.slice(0, 240),
    problem: bc.problem.slice(0, 200) || bc.idea.slice(0, 200),
    users: bc.targetUsers || "target users",
    goals: bc.goals.slice(0, 200) || "the stated objectives",
    constraints: bc.constraints || "none stated",
    weeks: String(bc.timelineWeeks),
    budget: String(bc.budgetCredits),
    sprint: String(item.sprint ?? ""),
    milestones: extras.milestones,
    segment: decisionLabel(decisions, "D1"),
    mvp: decisionLabel(decisions, "D2"),
    stack: decisionLabel(decisions, "D3"),
    journey: decisionLabel(decisions, "D4"),
    golive: decisionLabel(decisions, "D5"),
    decisions: decisions.map((d) => `${d.key} → ${d.label} (${d.status})`).join("; ") || "none yet",
  };
  const sections = (item.requiredSections ?? []).map((name) => {
    const key = name
      .toLowerCase()
      .replace(/[^a-z0-9 ]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    let text = HINTS[key] ?? "To be completed by the owning team.";
    for (const [k, v] of Object.entries(vars)) text = text.replaceAll(`{${k}}`, v);
    // Terse business cases must still yield a substantive, clearly-labelled section.
    if (text.replace(/[-*|\s]/g, "").length < 40) {
      text += `\n\n_Assumption: taken from the business case as written; to be validated with evidence during ${item.phase}._`;
    }
    return `## ${name}\n${text}`;
  });
  return `# ${item.title}

**Owner:** ${displayName(item.owner)} · **Team:** ${item.team.map(displayName).join(", ") || "—"}
**Builds on:** ${extras.upstreamTitles.join(", ") || "business case"}

> Simulated draft — generated from the business case and adopted decisions without a model call. Statements are assumptions or inferences unless a source is cited.

${sections.join("\n\n")}
`;
}

export function prototypeHtml(bc: BusinessCase, decisions: EffectiveDecision[]): string {
  const esc = (v: string) =>
    v
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  const journey =
    decisions.find((d) => d.key.startsWith("D4"))?.label ?? "Guided step-by-step flow";
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(bc.name)} — prototype</title>
<style>
:root{--ink:#101828;--muted:#475467;--line:#e4e7ec;--accent:#3e63dd}
*{box-sizing:border-box}body{margin:0;font:16px/1.5 system-ui,sans-serif;color:var(--ink);background:#f8fafc}
header,main{max-width:760px;margin:0 auto;padding:1.25rem}
.card{background:#fff;border:1px solid var(--line);border-radius:12px;padding:1.25rem;margin:1rem 0}
.steps{display:flex;gap:.5rem;list-style:none;padding:0;margin:0 0 1rem}.steps li{flex:1;padding:.4rem;border-radius:8px;background:#eef2ff;font-size:.8rem;text-align:center}
.steps li[aria-current]{background:var(--accent);color:#fff}
label{display:block;font-weight:600;margin:.5rem 0 .25rem}input,textarea{width:100%;padding:.6rem;border:1px solid var(--line);border-radius:8px;font:inherit}
button{margin-top:.75rem;background:var(--accent);color:#fff;border:0;border-radius:8px;padding:.65rem 1rem;font:600 .95rem system-ui;cursor:pointer}
button:focus-visible,input:focus-visible,textarea:focus-visible{outline:3px solid #1d4ed8;outline-offset:2px}
.muted{color:var(--muted)}[hidden]{display:none}
</style>
</head>
<body>
<header><p class="muted">Prototype · ${esc(journey)}</p><h1>${esc(bc.name)}</h1><p class="muted">${esc(bc.idea.slice(0, 200))}</p></header>
<main>
<ol class="steps" aria-label="Progress"><li id="s1" aria-current="step">1. Describe</li><li id="s2">2. Review</li><li id="s3">3. Done</li></ol>
<section class="card" id="step1"><h2>Tell us what you need</h2>
<label for="who">Your name</label><input id="who" autocomplete="name" />
<label for="need">What do you want to get done?</label><textarea id="need" rows="3"></textarea>
<button type="button" id="next1">Continue</button></section>
<section class="card" id="step2" hidden><h2>Review</h2><p id="summary"></p><button type="button" id="next2">Confirm</button></section>
<section class="card" id="step3" hidden><h2>Done</h2><p role="status" id="done"></p></section>
</main>
<script>
function go(n){[1,2,3].forEach(function(i){document.getElementById('step'+i).hidden=i!==n;var s=document.getElementById('s'+i);if(i===n)s.setAttribute('aria-current','step');else s.removeAttribute('aria-current');});}
document.getElementById('next1').addEventListener('click',function(){var w=document.getElementById('who').value.trim()||'there';var n=document.getElementById('need').value.trim()||'your goal';document.getElementById('summary').textContent='Hi '+w+', we will help with: '+n+'.';go(2);});
document.getElementById('next2').addEventListener('click',function(){document.getElementById('done').textContent='Confirmed. Your first outcome is ready.';go(3);});
</script>
</body>
</html>`;
}

/** Peer review by a different department: contract, decision consistency, evidence hygiene. */
export function reviewDeliverable(
  item: WorkItem,
  content: string,
  decisions: EffectiveDecision[],
): ReviewRecord {
  const findings: string[] = [];
  let score = 0;
  if (item.produces === "prototype") {
    const checks = checkPrototypeHtml(content);
    const passed = checks.filter((c) => c.passed).length;
    score = Math.round((passed / checks.length) * 100);
    checks
      .filter((c) => !c.passed)
      .forEach((c) => findings.push(`Prototype check failed: ${c.label}`));
  } else {
    const contract = checkMarkdownContract(content, item.requiredSections ?? []);
    score += contract.ok
      ? 50
      : Math.max(0, 50 - 10 * (contract.missing.length + contract.empty.length));
    if (contract.missing.length) findings.push(`Missing sections: ${contract.missing.join(", ")}`);
    if (contract.empty.length) findings.push(`Thin sections: ${contract.empty.join(", ")}`);
    const relevant = decisions.filter((d) => d.status !== "pending");
    const cited = relevant.filter((d) => content.includes(d.label) || content.includes(d.key));
    score += relevant.length ? Math.round((25 * cited.length) / relevant.length) : 25;
    if (relevant.length && cited.length < relevant.length) {
      findings.push(
        `Does not reference decision(s): ${relevant
          .filter((d) => !cited.includes(d))
          .map((d) => d.key)
          .join(", ")}`,
      );
    }
    const labelled = /assumption|inference|source|evidence/i.test(content);
    score += labelled ? 25 : 0;
    if (!labelled) findings.push("Claims are not labelled as evidence, assumption or inference.");
  }
  if (!findings.length) findings.push("Meets contract and references the decisions it depends on.");
  return {
    itemKey: item.key,
    reviewer: item.reviewer ?? "DX-049",
    score,
    verdict: score >= 70 ? "approve" : "revise",
    findings,
  };
}

export function verificationReport(
  items: WorkItem[],
  artefacts: Array<{ itemKey: string; body: string; format: string }>,
): { body: string; passed: boolean } {
  const rows: Array<{ check: string; ok: boolean; detail: string }> = [];
  for (const a of artefacts) {
    const item = items.find((i) => i.key === a.itemKey);
    if (!item) continue;
    if (a.format === "html") {
      for (const c of checkPrototypeHtml(a.body))
        rows.push({
          check: `${item.title}: ${c.label}`,
          ok: c.passed,
          detail: c.passed ? "pass" : "fail",
        });
    } else if (item.requiredSections?.length) {
      const r = checkMarkdownContract(a.body, item.requiredSections);
      rows.push({
        check: `${item.title}: contract`,
        ok: r.ok,
        detail: r.ok ? "all sections present" : `missing ${r.missing.join(", ")}`,
      });
    }
  }
  const hasProto = artefacts.some((a) => a.format === "html");
  rows.push({
    check: "Working prototype exists",
    ok: hasProto,
    detail: hasProto ? "pass" : "missing",
  });
  const prd = artefacts.find((a) => a.itemKey === "prd");
  const criteria = prd
    ? (markdownSections(prd.body).get("acceptance criteria") ?? "")
        .split("\n")
        .map((l) => l.replace(/^\s*(?:[-*]|\d+\.)\s*/, "").trim())
        .filter((l) => l.length > 3)
    : [];
  const failed = rows.filter((r) => !r.ok);
  const body = `# Verification report

## Result
${failed.length ? `**FAIL** — ${failed.length}/${rows.length} checks failed; release is blocked.` : `**PASS** — ${rows.length}/${rows.length} automated checks passed.`}

## Checks
| Check | Result | Detail |
| --- | --- | --- |
${rows.map((r) => `| ${r.check.replaceAll("|", "/")} | ${r.ok ? "✅" : "❌"} | ${r.detail.replaceAll("|", "/")} |`).join("\n")}

## Requirements traceability
${criteria.length ? criteria.map((c) => `- ${c} → requires human acceptance testing against the prototype`).join("\n") : "No PRD acceptance criteria found."}

## Scope
Static, reproducible checks only. Behaviour, usability and market fit require human review and real users.
`;
  return { body, passed: failed.length === 0 };
}
