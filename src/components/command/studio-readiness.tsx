import { useQuery } from "@tanstack/react-query";
import { getTtsAvailability, getVoiceAvailability } from "@/lib/conversation.functions";
import { getWorkspacePilotActivation } from "@/lib/pilot/psi-checkout.functions";
import { PILOT_PLAN_LABELS } from "@/lib/pilot/model";
import { commandCentreBootstrapQuery } from "@/lib/workforce-queries";

/**
 * Honest readiness chips for Studio foyer: model mode + voice + paid plan footnote.
 * Never invents keys; discloses Simulated / not configured clearly.
 */
export function StudioReadiness() {
  const boot = useQuery(commandCentreBootstrapQuery);
  const voice = useQuery({
    queryKey: ["command", "voice"],
    queryFn: () => getVoiceAvailability(),
    staleTime: 5 * 60_000,
  });
  const tts = useQuery({
    queryKey: ["command", "tts"],
    queryFn: () => getTtsAvailability(),
    staleTime: 5 * 60_000,
  });
  const activation = useQuery({
    queryKey: ["command", "pilot-activation"],
    queryFn: () => getWorkspacePilotActivation(),
    staleTime: 60_000,
  });
  const model = boot.data?.features.modelMode;
  const plan = activation.data?.activation;

  return (
    <div className="ps-studio-readiness ps-studio-readiness-footnote" aria-label="Studio readiness">
      <span
        className="ps-research-readiness-chip"
        data-ready={model?.enabled ? "true" : "false"}
        title={
          model?.problem ??
          (model?.enabled
            ? `Model mode on · ${model.model ?? model.provider}`
            : "DXSI_MODEL_ENABLED off or credentials missing — artefacts stay Simulated draft")
        }
      >
        {model?.enabled
          ? `Model · ${model.model ?? model.provider ?? "configured"}`
          : model?.problem
            ? "Model misconfigured"
            : "Simulated drafts"}
      </span>
      <span
        className="ps-research-readiness-chip"
        data-ready={voice.data?.enabled ? "true" : "false"}
        title={
          voice.data?.problem ??
          (voice.data?.enabled
            ? "Voice transcription configured"
            : "Voice not configured — set DXSI_VOICE_ENABLED, OPENAI_API_KEY, DXSI_VOICE_TRANSCRIBE_MODEL")
        }
      >
        {voice.data?.enabled
          ? "Voice ready"
          : voice.data?.problem
            ? "Voice misconfigured"
            : "Voice not configured"}
      </span>
      <span
        className="ps-research-readiness-chip"
        data-ready={tts.data?.enabled ? "true" : "false"}
        title={
          tts.data?.problem ??
          (tts.data?.enabled
            ? `Listen TTS · ElevenLabs voice ${tts.data.voiceId}`
            : "Listen uses browser speech until DXSI_TTS_ENABLED=true and ELEVENLABS_API_KEY are set")
        }
      >
        {tts.data?.enabled
          ? `Listen · ${tts.data.voiceId.slice(0, 8)}…`
          : "Listen · browser"}
      </span>
      {plan ? (
        <span
          className="ps-research-readiness-chip"
          data-ready={plan.remaining > 0 ? "true" : "false"}
          title={
            plan.paymentTaken
              ? plan.paymentEnvironment === "sandbox"
                ? "Paid via Stripe sandbox checkout"
                : plan.paymentEnvironment === "live"
                  ? "Paid via Stripe live checkout"
                  : "Paid activation on this workspace"
              : "Manual operator activation — paymentTaken is false"
          }
        >
          {PILOT_PLAN_LABELS[plan.plan]} · {plan.remaining} mission
          {plan.remaining === 1 ? "" : "s"} left
          {plan.paymentTaken && plan.paymentEnvironment === "sandbox"
            ? " · sandbox"
            : plan.paymentTaken && plan.paymentEnvironment === "live"
              ? " · paid"
              : ""}
        </span>
      ) : (
        <span
          className="ps-research-readiness-chip"
          data-ready="false"
          title="No pilot activation on this workspace yet"
        >
          No paid pilot
        </span>
      )}
    </div>
  );
}
