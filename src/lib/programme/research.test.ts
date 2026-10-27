import { describe, expect, it } from "vitest";
import {
  assessSource,
  buildSources,
  checkCitations,
  evidenceFromSources,
  researchQueries,
  sourceRegister,
  type RawResult,
  type Source,
} from "./research";
import {
  parseBrave,
  parseExa,
  parseTavily,
  resolveSearchProvider,
} from "./research-provider.server";
import { parseGeneratedOptions } from "./options";
import { createProgramme, decideGate, executeItem, latestDecisions, planNextStep } from "./engine";
import { buildProgrammeExport } from "./export";
import type { GeneratedContent } from "@/lib/workforce/executor";
import type { BusinessCase, DecisionOption, ProgrammeRecord, WorkItem } from "./types";

const NOW = new Date("2026-10-22T00:00:00Z");
const BC: BusinessCase = {
  name: "PayNudge",
  idea: "An invoicing and late-payment assistant that drafts invoices and nudges clients politely.",
  targetUsers: "UK freelancers, small creative agencies",
  problem: "Freelancers lose hours chasing late payments.",
  goals: "500 paying users in 6 months.",
  constraints: "UK only.",
  timelineWeeks: 16,
  budgetCredits: 400,
};

const raw = (
  url: string,
  publishedAt: string | null = "2026-03-01",
  snippet = "x".repeat(120),
): RawResult & { query: string } => ({
  url,
  title: `Title for ${url}`,
  snippet,
  publishedAt,
  query: "q",
});

describe("source quality", () => {
  it("rates authoritative recent sources high and user-generated ones low", () => {
    expect(assessSource(raw("https://www.ons.gov.uk/report"), NOW).quality).toBe("high");
    expect(assessSource(raw("https://www.reddit.com/r/freelance/x"), NOW).quality).toBe("low");
    const undated = assessSource(raw("https://example.com/a", null), NOW);
    expect(undated.reasons).toContain("no publication date");
  });

  it("dedupes by URL and continues ids from the existing register", () => {
    const first = buildSources([raw("https://a.com"), raw("https://a.com"), raw("https://b.com")], {
      itemKey: "market_research",
      provider: "exa",
      existing: [],
      now: NOW,
    });
    expect(first.map((s) => s.id)).toEqual(["S1", "S2"]);
    const second = buildSources([raw("https://b.com"), raw("https://c.com")], {
      itemKey: "tech_radar",
      provider: "exa",
      existing: first,
      now: NOW,
    });
    expect(second.map((s) => [s.id, s.url])).toEqual([["S3", "https://c.com"]]);
  });

  it("plans research questions from the business case", () => {
    expect(researchQueries("market_research", BC, 2026)).toHaveLength(4);
    expect(researchQueries("prd", BC, 2026)).toEqual([]);
  });
});

describe("provider parsers", () => {
  it("normalise Exa, Tavily and Brave responses", () => {
    expect(
      parseExa({
        results: [
          { url: "https://e.com", title: "E", highlights: ["a", "b"], publishedDate: "2026-01-01" },
        ],
      })[0],
    ).toEqual({
      url: "https://e.com",
      title: "E",
      snippet: "a … b",
      publishedAt: "2026-01-01",
    });
    expect(
      parseTavily({
        results: [{ url: "https://t.com", title: "T", content: "c", published_date: null }],
      })[0]!.snippet,
    ).toBe("c");
    expect(
      parseTavily({
        results: [
          {
            url: "https://t.com/sdk",
            title: "SDK",
            content: "snippet",
            publishedDate: "2026-02-01",
          },
        ],
      })[0],
    ).toEqual({
      url: "https://t.com/sdk",
      title: "SDK",
      snippet: "snippet",
      publishedAt: "2026-02-01",
    });
    expect(
      parseBrave({
        web: {
          results: [
            {
              url: "https://b.com",
              title: "B",
              description: "<strong>d</strong>",
              extra_snippets: ["e"],
            },
          ],
        },
      })[0]!.snippet,
    ).toBe("d … e");
  });

  it("picks the configured provider", () => {
    expect(resolveSearchProvider({})).toBeNull();
    expect(resolveSearchProvider({ TAVILY_API_KEY: "k" })?.name).toBe("tavily");
  });
});

describe("citation checker", () => {
  const known = new Set(["S1", "S2"]);
  it("passes cited or labelled numeric claims and ignores ids like R1/AC1", () => {
    const md = `# X\n## Market\n- 41% of freelancers are paid late [S1]\n- We target 500 users (target)\n- R1: primary journey\n## Sources\n- [S1] Something 2026`;
    const c = checkCitations(md, known);
    expect(c).toMatchObject({ ok: true, claims: 2, cited: 1, labelled: 1 });
  });

  it("fails unsourced numbers and unknown ids", () => {
    const c = checkCitations("## A\n- The market is worth £2bn\n- Growth 12% [S9]", known);
    expect(c.ok).toBe(false);
    expect(c.unknownIds).toEqual(["S9"]);
    expect(c.unsupported[0]).toContain("£2bn");
  });

  it("derives evidence strength from cited source quality", () => {
    const reg = [
      { id: "S1", score: 0.9 },
      { id: "S2", score: 0.5 },
    ] as Source[];
    expect(evidenceFromSources([], reg)).toBe(0.2);
    expect(evidenceFromSources(["S1", "S2"], reg)).toBeCloseTo(0.5);
    expect(evidenceFromSources(["S1", "S1"], reg)).toBe(evidenceFromSources(["S1"], reg));
  });
});

describe("model-proposed options", () => {
  const reg = [{ id: "S1", score: 0.8 }] as Source[];
  const valid = {
    options: [
      {
        id: "freelancers",
        label: "Focus on freelancers",
        summary: "Start with solo freelancers first.",
        scores: {
          customer_value: 0.7,
          business_value: 0.5,
          cost: 0.7,
          risk: 0.7,
          time_to_market: 0.8,
          feasibility: 0.8,
        },
        sourceIds: ["S1"],
        assumptions: ["Freelancers adopt quickly"],
      },
      {
        id: "agencies",
        label: "Focus on agencies",
        summary: "Start with small agencies first.",
        scores: {
          customer_value: 0.6,
          business_value: 0.8,
          cost: 0.5,
          risk: 0.6,
          time_to_market: 0.5,
          feasibility: 0.6,
        },
      },
    ],
  };

  it("parses fenced JSON and computes evidence from sources", () => {
    const r = parseGeneratedOptions("```json\n" + JSON.stringify(valid) + "\n```", reg);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.options[0]!.origin).toBe("model");
    expect(r.options[0]!.scores.evidence).toBeGreaterThan(r.options[1]!.scores.evidence);
    expect(r.options[1]!.scores.evidence).toBe(0.2);
  });

  it("rejects invented sources, bad JSON and duplicate ids", () => {
    const bad = { options: [{ ...valid.options[0]!, sourceIds: ["S7"] }, valid.options[1]] };
    expect(parseGeneratedOptions(JSON.stringify(bad), reg)).toMatchObject({ ok: false });
    expect(parseGeneratedOptions("not json", reg)).toMatchObject({ ok: false });
    const dup = { options: [valid.options[0], { ...valid.options[1]!, id: "freelancers" }] };
    expect(parseGeneratedOptions(JSON.stringify(dup), reg)).toMatchObject({
      ok: false,
      error: "duplicate option ids",
    });
  });
});

/** Runs a programme, letting a hook supply per-item execution context (sources, model output, options). */
function run(
  hook: (
    item: WorkItem,
    records: ProgrammeRecord[],
  ) => {
    sources?: Source[];
    generated?: GeneratedContent;
    decisionOptions?: { options: DecisionOption[]; model: string };
  },
) {
  let state = createProgramme("p-research", BC, "t");
  let records: ProgrammeRecord[] = [];
  for (let i = 0; i < 200; i++) {
    const plan = planNextStep(state, records);
    if (plan.type === "execute") {
      const extra = hook(plan.item, records);
      const r = executeItem(state, records, plan.item, { now: `t${i}`, ...extra });
      state = r.state;
      records = [...records, ...r.records];
    } else if (plan.type === "gate") {
      const r = decideGate(state, records, plan.item.key, {
        approve: true,
        choices: {},
        note: "",
        actor: "o",
        now: "g",
      });
      state = r.state;
      records = [...records, ...r.records];
    } else break;
  }
  return { state, records };
}

function sourcesFor(item: WorkItem, records: ProgrammeRecord[]): Source[] | undefined {
  const q = researchQueries(item.key, BC, 2026);
  if (!q.length) return undefined;
  return buildSources(
    q.map((query, i) => ({ ...raw(`https://www.ons.gov.uk/${item.key}/${i}`), query })),
    { itemKey: item.key, provider: "test", existing: sourceRegister(records), now: NOW },
  );
}

describe("research and options inside a programme", () => {
  it("registers sources and quotes them in simulated drafts", () => {
    const { state, records } = run((item, recs) => {
      const sources = sourcesFor(item, recs);
      return sources ? { sources } : {};
    });
    expect(planNextStep(state, records)).toEqual({ type: "finished", status: "completed" });
    const reg = sourceRegister(records);
    expect(reg.length).toBe(2 + 4 + 2 + 2);
    expect(new Set(reg.map((s) => s.id)).size).toBe(reg.length);
    const market = records
      .filter((r) => r.kind === "artefact" && r.itemKey === "market_research")
      .at(-1)!;
    expect(market.body).toContain("## Evidence excerpts");
    expect(market.body).toMatch(/\[S3\]/);
    const files = buildProgrammeExport(state, records, "2026-10-22T00:00:00Z");
    const manifest = JSON.parse(
      files.find((f) => f.path.endsWith("project-manifest.json"))!.content,
    );
    expect(manifest.completeness.research.sources).toBe(reg.length);
    expect(files.some((f) => f.path.endsWith("research/sources.json"))).toBe(true);
  });

  it("rejects model research that does not cite, and accepts model research that does", () => {
    const uncited = `# Market\n## Market landscape\nThe market is worth £2bn and growing fast for everyone involved.\n## Competitors\nSeveral incumbents dominate the space with large teams.\n## Customer segments\nFreelancers and agencies in the United Kingdom market.\n## Demand signals\nDemand rose 40% last year according to some reports.\n## Evidence gaps\nWillingness to pay remains unknown at this stage.`;
    const cited =
      uncited.replace("£2bn", "£2bn [S3]").replace("40%", "40% [S4]") +
      "\n## Sources\n- [S3] a\n- [S4] b";
    for (const [content, expectModel] of [
      [uncited, false],
      [cited, true],
    ] as const) {
      const { records } = run((item, recs) => ({
        ...(sourcesFor(item, recs) ? { sources: sourcesFor(item, recs)! } : {}),
        ...(item.key === "market_research"
          ? { generated: { content, mode: "model" as const, model: "test-model" } }
          : {}),
      }));
      const market = records
        .filter((r) => r.kind === "artefact" && r.itemKey === "market_research")
        .at(-1)!;
      expect(String(market.data["generation"]).startsWith("model")).toBe(expectModel);
      const verification = records.find((r) => r.itemKey === "verification")!;
      if (expectModel)
        expect(verification.body).toMatch(/Market & competitor research: citations \| ✅/);
    }
  });

  it("uses model-proposed options with source-derived evidence; templates are disclosed", () => {
    const model = run((item, recs) => {
      const sources = sourcesFor(item, recs);
      if (item.key !== "discovery_workshop") return sources ? { sources } : {};
      const reg = sourceRegister(recs);
      const parsed = parseGeneratedOptions(
        JSON.stringify({
          options: [
            {
              id: "freelancers",
              label: "Focus on UK freelancers",
              summary: "Narrow first segment with the clearest pain.",
              scores: {
                customer_value: 0.75,
                business_value: 0.55,
                cost: 0.75,
                risk: 0.7,
                time_to_market: 0.8,
                feasibility: 0.8,
              },
              sourceIds: [reg[0]!.id, reg[2]!.id],
            },
            {
              id: "validate",
              label: "Run a paid-pilot validation first",
              summary: "Two-week concierge pilot before committing.",
              scores: {
                customer_value: 0.5,
                business_value: 0.45,
                cost: 0.9,
                risk: 0.9,
                time_to_market: 0.6,
                feasibility: 0.9,
              },
            },
          ],
        }),
        reg,
      );
      if (!parsed.ok) throw new Error(parsed.error);
      return { decisionOptions: { options: parsed.options, model: "decision-model" } };
    });
    const d1 = latestDecisions(model.records).find((d) => d.key.startsWith("D1"))!;
    expect(d1.options.every((o) => o.origin === "model")).toBe(true);
    expect(d1.options[0]!.scores.evidence).toBeGreaterThan(d1.options[1]!.scores.evidence);
    expect(d1.challenge.note).not.toContain("template profiles");

    const template = run(() => ({}));
    const t1 = latestDecisions(template.records).find((d) => d.key.startsWith("D1"))!;
    expect(t1.challenge.note).toContain("template profiles");
  });
});
