import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getTtsAvailability, synthesizeSpeechFn } from "@/lib/conversation.functions";
import { speak, speakAudioBase64, stopSpeaking } from "@/lib/conversation/speech";
import { pmBriefListenScript, type PmBrief } from "@/lib/pilot-mission/pm-brief";

/**
 * Read or listen to the same PM brief words. ElevenLabs when configured
 * (founder voice id); otherwise browser speech. Never approves anything.
 */
export function ListenBriefButton({ brief }: { brief: PmBrief }) {
  const [mode, setMode] = useState<"idle" | "playing" | "error">("idle");
  const [detail, setDetail] = useState<string | null>(null);
  const tts = useQuery({
    queryKey: ["command", "tts"],
    queryFn: () => getTtsAvailability(),
    staleTime: 5 * 60_000,
  });

  const play = useMutation({
    mutationFn: async () => {
      const text = pmBriefListenScript(brief);
      stopSpeaking();
      const result = await synthesizeSpeechFn({ data: { text } });
      if (result.ok) {
        const used = await speakAudioBase64(text, {
          base64: result.base64,
          contentType: result.contentType,
        });
        return { used, voiceId: result.voiceId };
      }
      speak(text);
      return { used: "browser" as const, voiceId: result.voiceId, problem: result.problem };
    },
    onSuccess: (out) => {
      setMode("playing");
      setDetail(
        out.used === "elevenlabs"
          ? `Listening · voice ${out.voiceId}`
          : out.problem
            ? `Browser speech (provider unavailable: ${out.problem})`
            : `Browser speech · voice id reserved ${out.voiceId}`,
      );
    },
    onError: (error) => {
      setMode("error");
      setDetail(error instanceof Error ? error.message : "Could not start listen.");
      try {
        speak(pmBriefListenScript(brief));
        setMode("playing");
        setDetail("Browser speech fallback");
      } catch {
        /* ignore */
      }
    },
  });

  return (
    <div className="ps-listen-brief mt-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="cc-btn cc-btn-secondary"
          disabled={play.isPending}
          onClick={() => play.mutate()}
        >
          {play.isPending ? "Preparing…" : mode === "playing" ? "Listen again" : "Listen"}
        </button>
        {mode === "playing" ? (
          <button type="button" className="cc-btn cc-btn-secondary" onClick={() => stopSpeaking()}>
            Stop
          </button>
        ) : null}
      </div>
      <p className="cc-muted mt-1 text-xs">
        Same words as on screen
        {tts.data?.voiceId ? ` · voice ${tts.data.voiceId}` : ""}
        {tts.data?.enabled ? " · ElevenLabs" : " · browser fallback until TTS is enabled"}
        {detail ? ` · ${detail}` : ""}
      </p>
    </div>
  );
}
