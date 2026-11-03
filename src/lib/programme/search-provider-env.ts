/**
 * Env-only search provider resolution — safe for shared/client modules.
 * Network SDKs stay in research-provider.server.ts.
 */
type Env = Record<string, string | undefined>;

export function resolveSearchProvider(
  env: Env = process.env,
): { name: string; key: string } | null {
  // A blank or whitespace-only key is not a key.
  const exa = env["EXA_API_KEY"]?.trim();
  if (exa) return { name: "exa", key: exa };
  const tavily = env["TAVILY_API_KEY"]?.trim();
  if (tavily) return { name: "tavily", key: tavily };
  const brave = env["BRAVE_SEARCH_API_KEY"]?.trim();
  if (brave) return { name: "brave", key: brave };
  return null;
}
