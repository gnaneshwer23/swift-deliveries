/**
 * Post-approval research pass for the supervised decision loop.
 * Writes findings or honest external gaps into the evidence register.
 * Never invents retrieved web research when no provider is configured.
 */
import { searchWeb } from "@/lib/programme/research-provider.server";
import { planResearchMode, type ResearchMode } from "./research-mode";
import { activityEvent, type PilotActivityEvent } from "./specialist-team";
import type { EvidenceItem, SupervisedMission } from "./types";

export type ResearchPassResult = {
  evidence: EvidenceItem[];
  researchGaps: string[];
  activity: PilotActivityEvent[];
  researchPassCompletedAt: string;
  findingsCount: number;
  gapsRecorded: number;
  provider: string | null;
};

type SearchFn = typeof searchWeb;

function nextEvidenceId(items: EvidenceItem[]): string {
  return `e${items.length + 1}`;
}

function buildQueries(question: string): string[] {
  const q = question.trim().slice(0, 280);
  return [
    q,
    `${q} market competitors`,
    `${q} product alternatives`,
  ].slice(0, 3);
}

function mergeUniqueGaps(existing: string[], extra: string[]): string[] {
  return [...new Set([...existing, ...extra].map((g) => g.trim()).filter(Boolean))].slice(0, 20);
}

function appendEvidence(items: EvidenceItem[], next: Omit<EvidenceItem, "id">): EvidenceItem[] {
  if (items.length >= 20) return items;
  return [...items, { ...next, id: nextEvidenceId(items) }];
}

/**
 * Deterministic research / work pass after plan approval.
 * Soft-seeded placeholders stay; this pass enriches or marks gaps honestly.
 */
export async function runResearchPass(input: {
  mission: Pick<
    SupervisedMission,
    "brief" | "evidence" | "researchMode" | "researchGaps" | "activity" | "team"
  >;
  at: string;
  env?: Record<string, string | undefined>;
  search?: SearchFn;
}): Promise<ResearchPassResult> {
  const mode: ResearchMode = input.mission.researchMode ?? "combined";
  const plan = planResearchMode(mode, input.env ?? process.env);
  const search = input.search ?? searchWeb;
  const evidenceActor =
    input.mission.team?.tasks.find((t) => t.key === "register_evidence")?.capabilityId ?? "DX-018";
  const synthesisActor =
    input.mission.team?.tasks.find((t) => t.key === "synthesise_findings")?.capabilityId ?? "DX-020";

  let evidence = [...(input.mission.evidence ?? [])];
  let researchGaps = [...(input.mission.researchGaps ?? [])];
  const events: PilotActivityEvent[] = [];
  let findingsCount = 0;
  let gapsRecorded = 0;
  let provider: string | null = null;

  events.push(
    activityEvent({
      at: input.at,
      taskKey: "register_evidence",
      kind: "research.pass.started",
      summary: `Research pass started (${plan.label}). Specialists work from the brief and research mode — no fake timer.`,
      actor: evidenceActor,
    }),
    activityEvent({
      at: input.at,
      taskKey: "register_evidence",
      kind: "task.started",
      summary: "Evidence Integrity is registering claims and research mode disclosures.",
      actor: evidenceActor,
    }),
  );

  const wantsWeb = mode === "web" || mode === "combined";
  const webTool = plan.tools.find((t) => t.id === "web_search");

  if (wantsWeb && webTool?.available) {
    const queries = buildQueries(input.mission.brief.question);
    let anyHit = false;
    const seenUrls = new Set(
      evidence
        .map((e) => e.source.trim().toLowerCase())
        .filter((s) => s.startsWith("http")),
    );
    for (const query of queries) {
      const result = await search(query, 3);
      provider = result.provider ?? provider;
      if (result.error && result.results.length === 0) {
        const gap = `Web search via ${result.provider ?? "provider"} failed for “${query.slice(0, 80)}”: ${result.error}. No invented sources were added.`;
        researchGaps = mergeUniqueGaps(researchGaps, [gap]);
        evidence = appendEvidence(evidence, {
          statement: gap,
          source: "Research pass — provider error",
          classification: "gap",
        });
        gapsRecorded += 1;
        continue;
      }
      for (const hit of result.results.slice(0, 2)) {
        const url = hit.url?.trim().slice(0, 500) ?? "";
        const title = hit.title?.trim() ?? "";
        if (!url || !title) continue;
        const urlKey = url.toLowerCase();
        if (seenUrls.has(urlKey)) continue;
        seenUrls.add(urlKey);
        const snippet = (hit.snippet || title).trim().slice(0, 500);
        const via = result.provider ?? provider ?? "web";
        evidence = appendEvidence(evidence, {
          statement: `[Cited · ${via}] ${title}: ${snippet}`,
          source: url,
          classification: "supplied",
        });
        findingsCount += 1;
        anyHit = true;
      }
    }
    if (anyHit && provider) {
      events.push(
        activityEvent({
          at: input.at,
          taskKey: "register_evidence",
          kind: "research.cited",
          summary: `Cited ${findingsCount} web finding(s) via ${provider}. Sources keep live URLs; pages are not bundled.`,
          actor: evidenceActor,
        }),
      );
    }
    if (!anyHit && findingsCount === 0) {
      const gap =
        "Web research ran but returned no usable citations. External market facts remain a gap — not invented.";
      researchGaps = mergeUniqueGaps(researchGaps, [gap]);
      evidence = appendEvidence(evidence, {
        statement: gap,
        source: "Research pass — empty results",
        classification: "gap",
      });
      gapsRecorded += 1;
    }
  } else if (wantsWeb) {
    const gaps = plan.externalGaps.length
      ? plan.externalGaps
      : [
          "Web research was requested but no search provider is configured (EXA_API_KEY, TAVILY_API_KEY or BRAVE_SEARCH_API_KEY). Continuing with provided evidence only.",
        ];
    researchGaps = mergeUniqueGaps(researchGaps, gaps);
    for (const gap of gaps) {
      if (evidence.some((e) => e.statement === gap)) continue;
      evidence = appendEvidence(evidence, {
        statement: gap,
        source: "Research mode disclosure",
        classification: "gap",
      });
      gapsRecorded += 1;
    }
    events.push(
      activityEvent({
        at: input.at,
        taskKey: "register_evidence",
        kind: "research.external_gap",
        summary:
          "No search provider configured. External gaps marked honestly; provided evidence remains. DeliverX will not invent retrieved research.",
        actor: evidenceActor,
      }),
    );
  } else {
    events.push(
      activityEvent({
        at: input.at,
        taskKey: "register_evidence",
        kind: "research.provided_only",
        summary:
          "Provided-evidence mode: register uses founder-supplied items and soft-seeded assumptions only.",
        actor: evidenceActor,
      }),
    );
  }

  events.push(
    activityEvent({
      at: input.at,
      taskKey: "register_evidence",
      kind: "task.completed",
      summary: `Evidence register updated (${findingsCount} finding(s), ${gapsRecorded} new gap note(s)).`,
      actor: evidenceActor,
    }),
    activityEvent({
      at: input.at,
      taskKey: "synthesise_findings",
      kind: "task.started",
      summary: "Research Synthesis is grouping findings, assumptions and gaps for the options step.",
      actor: synthesisActor,
    }),
  );

  const findingStatements = evidence.filter((e) => e.classification === "supplied");
  const gapStatements = evidence.filter((e) => e.classification === "gap");
  const synthesis =
    findingStatements.length > 0
      ? `Synthesis: ${findingStatements.length} supplied finding(s) and ${gapStatements.length} gap(s) are on the register. Options must cite these and must not invent live web hits beyond recorded sources${provider ? ` (${provider})` : ""}.`
      : `Synthesis: no retrieved findings yet. ${gapStatements.length} gap(s) and assumptions remain. Compare may proceed from provided evidence; specialists must not invent external research.`;

  evidence = appendEvidence(evidence, {
    statement: synthesis,
    source: "Research Synthesis Agent",
    classification: findingStatements.length ? "assumption" : "gap",
  });

  events.push(
    activityEvent({
      at: input.at,
      taskKey: "synthesise_findings",
      kind: "task.completed",
      summary: synthesis.slice(0, 280),
      actor: synthesisActor,
    }),
    activityEvent({
      at: input.at,
      taskKey: "synthesise_findings",
      kind: "research.pass.completed",
      summary:
        findingsCount > 0
          ? `Research pass complete with ${findingsCount} cited finding(s). Draft options may proceed.`
          : `Research pass complete with honest gaps (no invented retrieval). Draft options may proceed from the register.`,
      actor: synthesisActor,
    }),
  );

  return {
    evidence: evidence.slice(0, 20),
    researchGaps,
    activity: events,
    researchPassCompletedAt: input.at,
    findingsCount,
    gapsRecorded,
    provider,
  };
}
