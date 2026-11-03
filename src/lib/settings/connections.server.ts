/**
 * Reads each service's status with the same helpers the product uses, so this page cannot
 * disagree with what a project actually does. Some helpers return API keys (they need them to
 * make calls); only booleans, provider and model names, and configuration problems are kept.
 */
import { resolveProvider } from "@/lib/workforce/model-runner.server";
import { voiceConfig } from "@/lib/conversation/voice.server";
import { researchProviderReadiness } from "@/lib/pilot-mission/research-mode";
import { resolvePsiPaymentsMode } from "@/lib/pilot/psi-payments-mode";
import { isCheckoutFlagEnabled } from "@/lib/pilot/psi-catalog";
import { buildConnections, type ConnectionsInput, type ConnectionsSummary } from "./connections";

type Env = Record<string, string | undefined>;

function modelStatus(env: Env): ConnectionsInput["model"] {
  try {
    const p = resolveProvider(env);
    return { enabled: !!p, provider: p?.name ?? null, model: p?.model ?? null, problem: null };
  } catch (error) {
    return { enabled: false, provider: null, model: null, problem: (error as Error).message };
  }
}

export function readConnections(
  env: Env = process.env,
  googleSignIn: boolean = import.meta.env["VITE_AUTH_GOOGLE_ENABLED"] === "true",
  now: number = Date.now(),
): ConnectionsSummary {
  const voice = voiceConfig(env);
  const research = researchProviderReadiness(env);
  return buildConnections(
    {
      model: modelStatus(env),
      research: { configured: research.configured, provider: research.provider },
      voice: { enabled: voice.enabled, problem: voice.enabled ? null : voice.problem },
      payments: resolvePsiPaymentsMode(env),
      checkoutFlagOn: isCheckoutFlagEnabled(env),
      // The worker tick refuses every call without this secret (routes/api/worker/tick.ts).
      schedulerConfigured: Boolean(env["CRON_SECRET"]?.trim()),
      // The sign-in page reads the same build-time flag (lib/auth-oauth.ts).
      googleSignIn,
    },
    now,
  );
}
