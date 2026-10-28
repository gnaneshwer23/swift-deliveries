/**
 * Web search providers (server only). Provider is chosen by whichever key is
 * configured: EXA_API_KEY, TAVILY_API_KEY or BRAVE_SEARCH_API_KEY.
 * Failures return no results and a reason — research never invents sources.
 *
 * Tavily uses the official `@tavily/core` SDK (Path B / tavily-best-practices).
 * A raw `TAVILY_API_KEY` is required; CLI OAuth alone does not configure product
 * search. Keyless mode is intentionally unused so availability stays honest.
 */
import { tavily } from "@tavily/core";
import type { RawResult } from "./research";
import { resolveSearchProvider } from "./search-provider-env";

export { resolveSearchProvider };

const TIMEOUT_MS = 15_000;

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
  return results.map((r) => {
    const published =
      (typeof r["published_date"] === "string" && r["published_date"]) ||
      (typeof r["publishedDate"] === "string" && r["publishedDate"]) ||
      null;
    return {
      url: String(r["url"] ?? ""),
      title: String(r["title"] ?? ""),
      snippet: String(r["content"] ?? ""),
      publishedAt: published,
    };
  });
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

async function searchTavily(query: string, count: number, apiKey: string): Promise<RawResult[]> {
  const client = tavily({
    apiKey,
    clientSource: "deliverx-supervised",
  });
  const response = await client.search(query.slice(0, 400), {
    maxResults: Math.min(Math.max(count, 1), 20),
    searchDepth: "basic",
    topic: "general",
    includeAnswer: false,
    includeRawContent: false,
    includeImages: false,
    timeout: TIMEOUT_MS / 1000,
  });
  return parseTavily(response);
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
      return { provider: p.name, results: await searchTavily(query, count, p.key) };
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
