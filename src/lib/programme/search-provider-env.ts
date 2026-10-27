/**
 * Env-only search provider resolution — safe for shared/client modules.
 * Network SDKs stay in research-provider.server.ts.
 */
type Env = Record<string, string | undefined>;

export function resolveSearchProvider(
  env: Env = process.env,
): { name: string; key: string } | null {
  if (env["EXA_API_KEY"]) return { name: "exa", key: env["EXA_API_KEY"] };
  if (env["TAVILY_API_KEY"]) return { name: "tavily", key: env["TAVILY_API_KEY"] };
  if (env["BRAVE_SEARCH_API_KEY"]) return { name: "brave", key: env["BRAVE_SEARCH_API_KEY"] };
  return null;
}
