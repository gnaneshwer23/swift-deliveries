import { useState } from "react";
import { canSpeak, speak, stopSpeaking } from "@/lib/conversation/speech";
import { pmBriefListenScript, type PmBrief } from "@/lib/pilot-mission/pm-brief";

/**
 * Read or listen to the same PM brief words via the browser's own speech
 * (no paid TTS). Listen never approves or mutates a mission.
 */
export function ListenBriefButton({ brief }: { brief: PmBrief }) {
  const [mode, setMode] = useState<"idle" | "playing" | "error">("idle");
  const [detail, setDetail] = useState<string | null>(null);

  function play() {
    const text = pmBriefListenScript(brief);
    stopSpeaking();
    if (!canSpeak()) {
      setMode("error");
      setDetail("This browser cannot speak text aloud.");
      return;
    }
    try {
      speak(text);
      setMode("playing");
      setDetail("Browser speech · same words as on screen");
    } catch (error) {
      setMode("error");
      setDetail(error instanceof Error ? error.message : "Could not start listen.");
    }
  }

  return (
    <div className="ps-listen-brief mt-3">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="cc-btn cc-btn-secondary" onClick={play}>
          {mode === "playing" ? "Listen again" : "Listen"}
        </button>
        {mode === "playing" ? (
          <button type="button" className="cc-btn cc-btn-secondary" onClick={() => stopSpeaking()}>
            Stop
          </button>
        ) : null}
      </div>
      <p className="cc-muted mt-1 text-xs">
        Same words as on screen · uses this device’s voice (no cloud TTS charge)
        {detail ? ` · ${detail}` : ""}
      </p>
    </div>
  );
}
