/**
 * Reads each service's status with the same helpers the product uses, so this page cannot
 * disagree with what a project actually does. Some helpers return API keys (they need them to
 * make calls); only booleans, provider and model names, and configuration problems are kept.
 */
import { modelModeStatus } from "@/lib/workforce/model-runner.server";
import { voiceConfig } from "@/lib/conversation/voice.server";
import { researchProviderReadiness } from "@/lib/pilot-mission/research-mode";
import { isPaymentsKillSwitchOn, resolvePsiPaymentsMode } from "@/lib/pilot/psi-payments-mode";
import { isCheckoutFlagEnabled } from "@/lib/pilot/psi-catalog";
import { buildConnections, type ConnectionsSummary } from "./connections";

type Env = Record<string, string | undefined>;

export function readConnections(
  env: Env = process.env,
  googleSignIn: boolean = import.meta.env["VITE_AUTH_GOOGLE_ENABLED"] === "true",
  now: number = Date.now(),
): ConnectionsSummary {
  const voice = voiceConfig(env);
  const research = researchProviderReadiness(env);
  return buildConnections(
    {
      model: modelModeStatus(env),
      research: { configured: research.configured, provider: research.provider },
      voice: { enabled: voice.enabled, problem: voice.enabled ? null : voice.problem },
      payments: resolvePsiPaymentsMode(env),
      checkoutFlagOn: isCheckoutFlagEnabled(env),
      paymentsKillSwitchOn: isPaymentsKillSwitchOn(env),
      // routes/api/worker/tick.ts refuses every call without this secret, and its bearer token
      // can't contain whitespace, so a secret that does could never match.
      schedulerConfigured: /^\S+$/.test(env["CRON_SECRET"] ?? ""),
      // The sign-in page reads the same build-time flag (lib/auth-oauth.ts).
      googleSignIn,
    },
    now,
  );
}
