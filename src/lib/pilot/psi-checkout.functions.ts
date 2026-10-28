import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/middleware";
import { createDirectStripeClient, getStripeErrorMessage, type StripeEnv } from "@/lib/stripe.server";
import { isPilotPlan, type PilotPlan } from "./model";
import { CAREER_LOOKUP_KEYS, offerForPlan, priceEnvOverride } from "./psi-catalog";
import { buildPsiCheckoutSessionCreateParams } from "./psi-checkout-session";
import { resolvePsiPaymentsMode } from "./psi-payments-mode";

type CheckoutOk = { ok: true; url: string; sessionId: string; environment: StripeEnv };
type CheckoutErr = { ok: false; message: string };

function allowedReturnHost(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "deliverx.dev" ||
    hostname === "www.deliverx.dev" ||
    hostname.endsWith(".deliverx.dev") ||
    hostname.endsWith(".lovable.app") ||
    hostname.endsWith(".vercel.app")
  );
}

async function resolvePsiPriceId(
  stripe: ReturnType<typeof createDirectStripeClient>,
  plan: PilotPlan,
): Promise<{ priceId: string; lookupKey: string } | { error: string }> {
  const offer = offerForPlan(plan);
  if (CAREER_LOOKUP_KEYS.has(offer.lookupKey)) {
    return { error: "Career plans cannot be purchased as PSI offers." };
  }
  const override = priceEnvOverride(plan);
  if (override) return { priceId: override, lookupKey: offer.lookupKey };

  const prices = await stripe.prices.list({ lookup_keys: [offer.lookupKey], limit: 1 });
  const price = prices.data[0];
  if (!price?.id) {
    return {
      error: `Stripe price for ${offer.lookupKey} is not configured. Set PSI_STRIPE_PRICE_${plan.toUpperCase()} or create the lookup key on the active Stripe account (live or sandbox).`,
    };
  }
  return { priceId: price.id, lookupKey: offer.lookupKey };
}

export const createPsiCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) =>
    z
      .object({
        plan: z.enum(["builder", "founder", "studio"]),
        workspaceId: z.string().uuid().optional(),
        successUrl: z.string().url(),
        cancelUrl: z.string().url(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }): Promise<CheckoutOk | CheckoutErr> => {
    if (!isPilotPlan(data.plan)) {
      return { ok: false, message: "Choose Builder, Founder or Studio." };
    }

    const mode = resolvePsiPaymentsMode();
    if (!mode.ok) return { ok: false, message: mode.message };
    const environment = mode.environment;

    for (const raw of [data.successUrl, data.cancelUrl]) {
      const url = new URL(raw);
      if (
        (url.protocol !== "https:" && url.hostname !== "localhost") ||
        !allowedReturnHost(url.hostname)
      ) {
        return { ok: false, message: "Invalid return URL." };
      }
    }

    try {
      const { neonDb } = await import("@/lib/db/neon.server");
      const { ensureWorkspace } = await import("@/lib/workforce/access.server");
      const db = neonDb();
      const ensured = await ensureWorkspace(db, context.userId);
      const workspaceId = (data.workspaceId ?? ensured.workspace.id).toLowerCase();
      if (data.workspaceId && data.workspaceId.toLowerCase() !== ensured.workspace.id.toLowerCase()) {
        const workspace = await db
          .from("wf_workspaces")
          .select("id")
          .eq("id", workspaceId)
          .eq("owner_id", context.userId)
          .maybeSingle();
        if (workspace.error) throw new Error(workspace.error.message);
        if (!workspace.data) {
          return { ok: false, message: "That workspace was not found for your account." };
        }
      }

      const existing = await db
        .from("psi_pilot_activations")
        .select("id")
        .eq("workspace_id", workspaceId)
        .maybeSingle();
      if (existing.error && !/does not exist|unknown table/i.test(existing.error.message ?? "")) {
        throw new Error(existing.error.message);
      }
      if (existing.data) {
        return { ok: false, message: "This workspace already has a pilot activation." };
      }

      const stripe = createDirectStripeClient(environment);
      const resolved = await resolvePsiPriceId(stripe, data.plan);
      if ("error" in resolved) return { ok: false, message: resolved.error };

      const session = await stripe.checkout.sessions.create(
        buildPsiCheckoutSessionCreateParams({
          plan: data.plan,
          priceId: resolved.priceId,
          lookupKey: resolved.lookupKey,
          userId: context.userId,
          workspaceId,
          userEmail: context.userEmail,
          successUrl: data.successUrl,
          cancelUrl: data.cancelUrl,
        }),
      );

      if (!session.url) {
        return { ok: false, message: "Stripe did not return a Checkout URL." };
      }
      return {
        ok: true,
        url: session.url,
        sessionId: session.id,
        environment,
      };
    } catch (error) {
      const message = getStripeErrorMessage(error);
      try {
        const { recordMonitoringEvent } = await import("@/lib/monitoring.server");
        await recordMonitoringEvent({
          kind: "payment_failure",
          severity: "critical",
          source: "psi_checkout_session",
          message: `PSI checkout could not be opened: ${message}`,
          userId: context.userId,
          detail: { plan: data.plan, environment },
        });
      } catch {
        /* monitoring is best-effort */
      }
      return { ok: false, message };
    }
  });

export type WorkspacePilotActivationView = {
  workspaceId: string;
  plan: PilotPlan;
  missionAllowance: number;
  missionsConsumed: number;
  paymentTaken: boolean;
  paymentEnvironment: "sandbox" | "live" | null;
  remaining: number;
};

export const getWorkspacePilotActivation = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<{ activation: WorkspacePilotActivationView | null }> => {
    try {
      const { neonDb } = await import("@/lib/db/neon.server");
      const db = neonDb();
      const workspace = await db
        .from("wf_workspaces")
        .select("id")
        .eq("owner_id", context.userId)
        .maybeSingle();
      if (workspace.error || !workspace.data) return { activation: null };
      const workspaceId = String((workspace.data as { id: string }).id);
      const res = await db
        .from("psi_pilot_activations")
        .select(
          "plan, mission_allowance, missions_consumed, payment_taken, stripe_price_lookup_key, payment_environment",
        )
        .eq("workspace_id", workspaceId)
        .maybeSingle();
      if (res.error || !res.data) return { activation: null };
      const row = res.data as Record<string, unknown>;
      const plan = row["plan"];
      if (typeof plan !== "string" || !isPilotPlan(plan)) return { activation: null };
      return {
        activation: {
          workspaceId,
          plan,
          missionAllowance: Number(row["mission_allowance"]),
          missionsConsumed: Number(row["missions_consumed"]),
          paymentTaken: row["payment_taken"] === true,
          paymentEnvironment:
            row["payment_environment"] === "live" || row["payment_environment"] === "sandbox"
              ? row["payment_environment"]
              : null,
          remaining: Math.max(
            0,
            Number(row["mission_allowance"]) - Number(row["missions_consumed"]),
          ),
        },
      };
    } catch {
      return { activation: null };
    }
  });
