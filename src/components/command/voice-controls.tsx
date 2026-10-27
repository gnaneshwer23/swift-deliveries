import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Square, VolumeX } from "lucide-react";
import {
  getVoiceAvailability,
  recordVoiceMeasurement,
  startVoiceSession,
} from "@/lib/conversation.functions";
import { VoiceLink, type VoicePhase } from "@/lib/conversation/voice-link";
import type { VoiceMeasurementInput } from "@/lib/conversation/voice-metrics";
import { voiceSupported, webrtcConnector } from "@/lib/conversation/voice-webrtc";
import { canSpeak, isSpeaking, stopSpeaking } from "@/lib/conversation/speech";

/** Measurements never get in the way: a failure to record one is ignored. */
const measure = (data: VoiceMeasurementInput) =>
  void recordVoiceMeasurement({ data }).catch(() => undefined);

/** Silences the reply; if it was talking, that was an interruption, and is counted. */
function interrupt() {
  if (isSpeaking()) measure({ kind: "interruption" });
  stopSpeaking();
}

const PHASE_TEXT: Record<VoicePhase, string> = {
  off: "Voice is off.",
  connecting: "Connecting voice…",
  ready: "Voice is on. Press Talk, speak, then press Send.",
  listening: "Recording. Press Send when you've finished.",
  transcribing: "Writing down what you said…",
  reconnecting: "Connection dropped. Reconnecting…",
  failed: "Voice is unavailable. Typing still works.",
};

/**
 * Push-to-talk voice input. Nothing is captured until you turn voice on and
 * give the browser permission, and nothing is sent until you press Talk. What
 * you said becomes a transcript line that goes through exactly the same path
 * as typing. Stopping speech, ending voice or losing the connection never
 * touches a mission.
 */
export function VoiceControls({
  onTranscript,
  speakReplies,
  onSpeakRepliesChange,
  disabled,
  onBusyChange,
}: {
  /** A spoken turn's final transcript and its time from Send, in milliseconds. */
  onTranscript: (text: string, transcriptMs: number) => void;
  speakReplies: boolean;
  onSpeakRepliesChange: (on: boolean) => void;
  disabled: boolean;
  /** True while a spoken turn is in flight, so the panel can hold typing until it lands. */
  onBusyChange?: (busy: boolean) => void;
}) {
  const availability = useQuery({
    queryKey: ["command", "voice"],
    queryFn: () => getVoiceAvailability(),
    staleTime: 5 * 60_000,
  });
  const [phase, setPhase] = useState<VoicePhase>("off");
  const [partial, setPartial] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [consenting, setConsenting] = useState(false);
  const transcriptRef = useRef(onTranscript);
  transcriptRef.current = onTranscript;
  const onBusyRef = useRef(onBusyChange);
  onBusyRef.current = onBusyChange;
  const linkRef = useRef<VoiceLink | null>(null);

  useEffect(
    () => () => {
      linkRef.current?.stop();
      stopSpeaking();
    },
    [],
  );

  const voice = availability.data;
  if (!voice)
    return availability.isError ? (
      <p className="text-xs text-slate-500">
        Voice availability couldn't be checked. Typing works.
      </p>
    ) : null;
  if (!voice.enabled)
    return (
      <p className="text-xs text-slate-500">
        {voice.problem ?? "Voice isn't switched on in this workspace yet. Typing works everywhere."}
      </p>
    );
  if (!voiceSupported())
    return <p className="text-xs text-slate-500">This browser can't record audio. Typing works.</p>;

  const link = () =>
    (linkRef.current ??= new VoiceLink(
      webrtcConnector(async () => (await startVoiceSession()).value),
      {
        onPhase: (p) => {
          setPhase(p);
          onBusyRef.current?.(p === "listening" || p === "transcribing");
          if (p !== "listening" && p !== "transcribing") setPartial("");
        },
        onTranscript: (text, ms) => transcriptRef.current(text, ms),
        onConnectionEvent: (kind) => measure({ kind }),
        onPartial: setPartial,
        onNotice: setNotice,
      },
    ));

  const on = phase !== "off" && phase !== "failed";

  return (
    <div className="space-y-2 rounded border p-2" style={{ borderColor: "var(--x-border)" }}>
      <p className="text-sm flex items-center gap-2" aria-live="polite">
        {phase === "listening" ? (
          <span
            className="inline-block size-2.5 rounded-full bg-red-600"
            role="img"
            aria-label="Recording"
          />
        ) : null}
        {PHASE_TEXT[phase]}
      </p>
      {partial ? <p className="text-sm text-slate-600">“{partial}”</p> : null}

      {!on && consenting ? (
        <div className="text-sm space-y-2">
          <p>
            Your browser will ask to use the microphone. While voice is on, sound is sent to the
            voice provider for transcription only between Talk and Send. DeliverX stores no audio;
            the provider may keep what it receives for a limited time under its own API data policy.
            Only the written transcript is saved here, for the period you chose. For personal
            details, type instead.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="cc-btn cc-btn-primary"
              onClick={() => {
                setConsenting(false);
                setNotice(null);
                void link().start();
              }}
            >
              <Mic className="size-3" aria-hidden="true" /> Turn voice on
            </button>
            <button type="button" className="cc-btn" onClick={() => setConsenting(false)}>
              Not now
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {!on && !consenting ? (
          <button type="button" className="cc-btn" onClick={() => setConsenting(true)}>
            <Mic className="size-3" aria-hidden="true" /> Use voice
          </button>
        ) : null}
        {phase === "ready" ? (
          <button
            type="button"
            className="cc-btn cc-btn-primary"
            disabled={disabled}
            onClick={() => {
              // Talking over the assistant only stops its speech.
              interrupt();
              setNotice(null);
              void link().talk();
            }}
          >
            <Mic className="size-3" aria-hidden="true" /> Talk
          </button>
        ) : null}
        {phase === "listening" ? (
          <button type="button" className="cc-btn cc-btn-primary" onClick={() => link().send()}>
            <Square className="size-3" aria-hidden="true" /> Send what I said
          </button>
        ) : null}
        {canSpeak() ? (
          <button type="button" className="cc-btn" onClick={() => interrupt()}>
            <VolumeX className="size-3" aria-hidden="true" /> Stop speaking
          </button>
        ) : null}
        {on ? (
          <button
            type="button"
            className="cc-btn"
            onClick={() => {
              interrupt();
              if (phase === "listening" || phase === "transcribing")
                setNotice(
                  "Voice was turned off before that was sent. Say it again, or type instead.",
                );
              link().stop();
            }}
          >
            <MicOff className="size-3" aria-hidden="true" /> Turn voice off
          </button>
        ) : null}
        {canSpeak() ? (
          <label className="text-xs flex items-center gap-1">
            <input
              type="checkbox"
              checked={speakReplies}
              onChange={(e) => {
                if (!e.target.checked) interrupt();
                onSpeakRepliesChange(e.target.checked);
              }}
            />
            Read replies aloud
          </label>
        ) : null}
      </div>
      <p className="text-xs text-slate-500">
        Stopping speech or turning voice off never pauses or cancels a mission. Those need the
        buttons on a reply.
      </p>
      {notice ? (
        <p className="cc-error" role="alert">
          {notice}
        </p>
      ) : null}
    </div>
  );
}
