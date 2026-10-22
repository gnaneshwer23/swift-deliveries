/**
 * Web search providers (server only). Provider is chosen by whichever key is
 * configured: EXA_API_KEY, TAVILY_API_KEY or BRAVE_SEARCH_API_KEY.
 * Failures return no results and a reason — research never invents sources.
 */
import type { RawResult } from "./research";

type Env = Record<string, string | undefined>;
const TIMEOUT_MS = 15_000;

export function resolveSearchProvider(
  env: Env = process.env,
): { name: string; key: string } | null {
  if (env["EXA_API_KEY"]) return { name: "exa", key: env["EXA_API_KEY"] };
  if (env["TAVILY_API_KEY"]) return { name: "tavily", key: env["TAVILY_API_KEY"] };
  if (env["BRAVE_SEARCH_API_KEY"]) return { name: "brave", key: env["BRAVE_SEARCH_API_KEY"] };
  return null;
}

export function parseExa(json: unknown): RawResult[] {
  const results = (json as { results?: Array<Record<string, unknown>> }).results ?? [];
  return results.map((r) => ({
    url: String(r["url"] ?? ""),
    title: String(r["title"] ?? ""),
    snippet: String(
      (Array.isArray(r["highlights"]) ? (r["highlights"] as string[]).join(" … ") : "") ||
        r["text"] ||
        "",
    ),
    publishedAt: typeof r["publishedDate"] === "string" ? (r["publishedDate"] as string) : null,
  }));
}

export function parseTavily(json: unknown): RawResult[] {
  const results = (json as { results?: Array<Record<string, unknown>> }).results ?? [];
  return results.map((r) => ({
    url: String(r["url"] ?? ""),
    title: String(r["title"] ?? ""),
    snippet: String(r["content"] ?? ""),
    publishedAt: typeof r["published_date"] === "string" ? (r["published_date"] as string) : null,
  }));
}

export function parseBrave(json: unknown): RawResult[] {
  const results =
    (json as { web?: { results?: Array<Record<string, unknown>> } }).web?.results ?? [];
  return results.map((r) => ({
    url: String(r["url"] ?? ""),
    title: String(r["title"] ?? ""),
    snippet: [
      r["description"],
      ...(Array.isArray(r["extra_snippets"]) ? (r["extra_snippets"] as string[]) : []),
    ]
      .filter(Boolean)
      .join(" … ")
      .replace(/<[^>]+>/g, ""),
    publishedAt: typeof r["page_age"] === "string" ? (r["page_age"] as string) : null,
  }));
}

async function fetchJson(url: string, init: RequestInit): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function searchWeb(
  query: string,
  count = 5,
): Promise<{ provider: string | null; results: RawResult[]; error?: string }> {
  const p = resolveSearchProvider();
  if (!p) return { provider: null, results: [], error: "no search provider configured" };
  try {
    if (p.name === "exa") {
      const json = await fetchJson("https://api.exa.ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": p.key },
        body: JSON.stringify({
          query,
          numResults: count,
          type: "auto",
          contents: { highlights: { maxCharacters: 500 } },
        }),
      });
      return { provider: p.name, results: parseExa(json) };
    }
    if (p.name === "tavily") {
      const json = await fetchJson("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${p.key}` },
        body: JSON.stringify({
          query,
          max_results: count,
          search_depth: "basic",
          include_published_date: true,
        }),
      });
      return { provider: p.name, results: parseTavily(json) };
    }
    const json = await fetchJson(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${count}&extra_snippets=true`,
      { headers: { Accept: "application/json", "X-Subscription-Token": p.key } },
    );
    return { provider: p.name, results: parseBrave(json) };
  } catch (err) {
    return {
      provider: p.name,
      results: [],
      error: err instanceof Error ? err.message : "search failed",
    };
  }
}
