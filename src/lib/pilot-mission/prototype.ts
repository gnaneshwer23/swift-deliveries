/**
 * P5 — sandboxed HTML prototype beat for the supervised theatre.
 * Reuses workforce static checks; never auto-passes a human gate.
 */
import { checkPrototypeHtml } from "@/lib/workforce/contracts";
import type { MissionPrototype, MissionPrototypeCheck, SupervisedMission } from "./types";

export type { MissionPrototype, MissionPrototypeCheck };

function prototypeHonesty(mission: SupervisedMission): MissionPrototype["honesty"] {
  const gen = mission.proposal?.generation;
  if (gen?.ran) {
    const modelId = gen.model ?? gen.provider ?? "configured";
    return { mode: "model", label: `Model · ${modelId}`, modelId };
  }
  return { mode: "simulated", label: "Simulated draft", modelId: null };
}

function esc(v: string): string {
  return v
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** Deterministic sandboxed HTML from the decision — Simulated draft when no model ran. */
export function simulatedPrototypeHtml(mission: SupervisedMission): string {
  const option = mission.proposal?.options.find((o) => o.id === mission.approval?.optionId);
  const title = esc((mission.artefact?.title ?? option?.title ?? "Product prototype").slice(0, 80));
  const goal = esc(mission.brief.question.trim().slice(0, 180));
  const decision = esc(
    option
      ? `${mission.approval?.choice ?? "accept"}: ${option.title}`
      : (mission.artefact?.decisionBrief.slice(0, 160) ?? "Owner decision on record"),
  );
  const honesty = prototypeHonesty(mission);
  const badge = honesty.mode === "model" ? esc(honesty.label) : "Simulated prototype";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<style>
:root{--ink:#101828;--muted:#475467;--line:#e4e7ec;--accent:#3e63dd;--bg:#f8fafc}
*{box-sizing:border-box}body{margin:0;font:16px/1.5 system-ui,sans-serif;color:var(--ink);background:var(--bg)}
header,main{max-width:720px;margin:0 auto;padding:1.5rem}
.panel{background:#fff;border:1px solid var(--line);border-radius:12px;padding:1.25rem;margin-bottom:1rem}
label{display:block;font-weight:600;margin-bottom:.35rem}textarea{width:100%;min-height:96px;border:1px solid var(--line);border-radius:8px;padding:.6rem;font:inherit}
button{margin-top:.75rem;background:var(--accent);color:#fff;border:0;border-radius:8px;padding:.65rem 1rem;font:600 .95rem system-ui;cursor:pointer}
button:focus-visible{outline:3px solid #1d4ed8;outline-offset:2px}
.tag{display:inline-block;font-size:.75rem;padding:.15rem .5rem;border-radius:999px;background:#eef2ff;color:#3730a3;margin-right:.35rem}
[hidden]{display:none}
</style>
</head>
<body>
<header>
  <p class="tag">${badge}</p>
  <h1>${title}</h1>
  <p style="color:var(--muted)">${goal}</p>
  <p style="color:var(--muted)"><strong>Decision:</strong> ${decision}</p>
</header>
<main>
  <section class="panel" aria-labelledby="s1">
    <h2 id="s1">1. Describe the need</h2>
    <label for="need">What should this product help with?</label>
    <textarea id="need" placeholder="Your need"></textarea>
    <button type="button" id="go">See draft recommendation</button>
  </section>
  <section class="panel" id="result" hidden aria-live="polite">
    <h2>2. Draft recommendation</h2>
    <p id="out"></p>
    <p><span class="tag">Assumption</span><span class="tag">Needs review</span></p>
    <button type="button" id="approve">Mark reviewed</button>
  </section>
  <p id="status" role="status"></p>
</main>
<script>
document.getElementById('go').addEventListener('click',function(){
  var v=document.getElementById('need').value.trim()||'your goal';
  document.getElementById('out').textContent='Draft recommendation for: '+v+' — based on the approved decision.';
  document.getElementById('result').hidden=false;
});
document.getElementById('approve').addEventListener('click',function(){
  document.getElementById('status').textContent='Reviewed by operator — recorded for audit. Not a production deploy.';
});
</script>
</body>
</html>`;
}

export function verifyPrototypeHtml(html: string): {
  checks: MissionPrototypeCheck[];
  sandboxSafe: boolean;
  verified: boolean;
  failureDetail: string | null;
} {
  const checks = checkPrototypeHtml(html);
  const sandboxSafe = checks.filter((c) => c.id.startsWith("no_")).every((c) => c.passed);
  const failed = checks.filter((c) => !c.passed);
  const verified = failed.length === 0;
  let failureDetail: string | null = null;
  if (!sandboxSafe) {
    failureDetail =
      "Prototype loads remote scripts or makes network calls — rejected as not sandbox-safe.";
  } else if (!verified) {
    failureDetail = `Static verify failed: ${failed.map((f) => f.label).join("; ")}`;
  }
  return { checks, sandboxSafe, verified, failureDetail };
}

export function buildMissionPrototype(
  mission: SupervisedMission,
  input: {
    actorId: string;
    nowMs: number;
    /** Test/injection hook — when set, skips the simulated generator. */
    html?: string;
    ownerCapabilityId?: string;
    ownerLabel?: string;
  },
): MissionPrototype {
  const honesty = prototypeHonesty(mission);
  const html = input.html ?? simulatedPrototypeHtml(mission);
  const verify = verifyPrototypeHtml(html);
  const at = new Date(input.nowMs).toISOString();
  const option = mission.proposal?.options.find((o) => o.id === mission.approval?.optionId);
  return {
    title: mission.artefact?.title
      ? `${mission.artefact.title} — prototype`
      : option
        ? `Prototype · ${option.title}`
        : "Sandboxed HTML prototype",
    html,
    honesty,
    checks: verify.checks,
    sandboxSafe: verify.sandboxSafe,
    verified: verify.verified,
    failureDetail: verify.failureDetail,
    approvedAt: at,
    approvedBy: input.actorId,
    producedAt: at,
    ownerCapabilityId: input.ownerCapabilityId ?? "DX-035",
    ownerLabel: input.ownerLabel ?? "UX Prototype Agent",
  };
}
