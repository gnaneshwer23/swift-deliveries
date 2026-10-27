/**
 * Research modes for the supervised pilot.
 * Web retrieval is never invented: without a configured provider the web
 * portion is blocked and gaps are marked honestly.
 */
import { resolveSearchProvider } from "@/lib/programme/search-provider-env";

export const RESEARCH_MODES = ["provided", "web", "combined"] as const;
export type ResearchMode = (typeof RESEARCH_MODES)[number];

export const RESEARCH_MODE_LABELS: Record<ResearchMode, string> = {
  provided: "Provided evidence",
  web: "Web research (configured provider)",
  combined: "Combined",
};

export type ResearchToolDisclosure = {
  id: string;
  label: string;
  available: boolean;
  detail: string;
};

export type ResearchModePlan = {
  mode: ResearchMode;
  label: string;
  tools: ResearchToolDisclosure[];
  /** True when comparison/options may proceed with the selected mode. */
  executable: boolean;
  /** Honest explanation when web access is required but unavailable. */
  blockReason: string | null;
  /** Gaps that must be recorded when external info is needed but unavailable. */
  externalGaps: string[];
};

export function isResearchMode(value: string): value is ResearchMode {
  return (RESEARCH_MODES as readonly string[]).includes(value);
}

export function webResearchConfigured(
  env: Record<string, string | undefined> = process.env,
): { configured: boolean; provider: string | null } {
  const provider = resolveSearchProvider(env);
  return { configured: Boolean(provider), provider: provider?.name ?? null };
}

export type ResearchProviderReadiness = {
  configured: boolean;
  provider: string | null;
  /** Short UI chip — e.g. "Web research ready · tavily" */
  label: string;
  /** One-line honesty for intake / theatre footnotes. */
  detail: string;
};

/**
 * UI readiness for Combined/Web research. Never claims live retrieval without a key.
 * A raw API key is required (e.g. TAVILY_API_KEY); CLI OAuth alone does not count.
 */
export function researchProviderReadiness(
  env: Record<string, string | undefined> = process.env,
): ResearchProviderReadiness {
  const web = webResearchConfigured(env);
  if (web.configured && web.provider) {
    return {
      configured: true,
      provider: web.provider,
      label: `Web research ready · ${web.provider}`,
      detail: `Combined/Web modes retrieve cited sources via ${web.provider}. URLs stay on the register; pages are not bundled.`,
    };
  }
  return {
    configured: false,
    provider: null,
    label: "Web research not configured",
    detail:
      "Set EXA_API_KEY, TAVILY_API_KEY or BRAVE_SEARCH_API_KEY (local + Vercel) for Combined/Web retrieval. Without a key, DeliverX records honest gaps and does not invent sources.",
  };
}

/**
 * Disclose mode + tools before execution. Never claims live web research
 * without a configured provider key.
 */
export function planResearchMode(
  mode: ResearchMode,
  env: Record<string, string | undefined> = process.env,
): ResearchModePlan {
  const web = webResearchConfigured(env);
  const providedTool: ResearchToolDisclosure = {
    id: "provided_evidence",
    label: "Founder-supplied evidence register",
    available: true,
    detail: "Uses only statements you add. Sources are referenced, not bundled.",
  };
  const webTool: ResearchToolDisclosure = {
    id: "web_search",
    label: web.configured
      ? `Web search (${web.provider})`
      : "Web search (no provider configured)",
    available: web.configured,
    detail: web.configured
      ? `Results come from ${web.provider}. Citations keep URLs; linked pages are not bundled in the export.`
      : "Needs EXA_API_KEY, TAVILY_API_KEY or BRAVE_SEARCH_API_KEY. Until then, no web results are retrieved.",
  };

  if (mode === "provided") {
    return {
      mode,
      label: RESEARCH_MODE_LABELS.provided,
      tools: [providedTool],
      executable: true,
      blockReason: null,
      externalGaps: [],
    };
  }

  if (mode === "web") {
    if (!web.configured) {
      return {
        mode,
        label: RESEARCH_MODE_LABELS.web,
        tools: [webTool],
        executable: false,
        blockReason:
          "Web research is selected, but no search provider is configured. Switch to Provided evidence, or configure EXA_API_KEY, TAVILY_API_KEY or BRAVE_SEARCH_API_KEY. DeliverX will not invent retrieved research.",
        externalGaps: [
          "Current external information was required by the selected research mode and was not retrieved (no search provider configured).",
        ],
      };
    }
    return {
      mode,
      label: RESEARCH_MODE_LABELS.web,
      tools: [webTool],
      executable: true,
      blockReason: null,
      externalGaps: [],
    };
  }

  // combined
  if (!web.configured) {
    return {
      mode,
      label: RESEARCH_MODE_LABELS.combined,
      tools: [providedTool, webTool],
      executable: true,
      blockReason: null,
      externalGaps: [
        "Web portion unavailable: no search provider configured. Continuing with provided evidence only. External information gaps remain unmarked as retrieved.",
      ],
    };
  }
  return {
    mode,
    label: RESEARCH_MODE_LABELS.combined,
    tools: [providedTool, webTool],
    executable: true,
    blockReason: null,
    externalGaps: [],
  };
}
