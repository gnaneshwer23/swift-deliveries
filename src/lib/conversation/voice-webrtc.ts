/**
 * The browser end of a voice session: a WebRTC connection to the provider's
 * transcription-only session, authenticated with a short-lived token from our
 * server. The microphone track is muted except between Talk and Send. At Talk
 * the provider's input buffer is cleared, and the track is unmuted only once
 * the provider confirms it, so only what is said during a turn is transcribed.
 * Browser only.
 */
import type { Connector, VoiceConnection } from "./voice-link";

const CALLS_URL = "https://api.openai.com/v1/realtime/calls";
const CONNECT_TIMEOUT_MS = 10_000;
/** How long a "disconnected" peer may take to recover on its own before it counts as dropped. */
const DISCONNECT_GRACE_MS = 4_000;
/** How long to wait for the provider to confirm a cleared buffer before starting anyway. */
const CLEAR_WAIT_MS = 1_500;

type ProviderEvent = {
  type?: string;
  delta?: string;
  transcript?: string;
  error?: { message?: string };
};

const aborted = () => new Error("Voice was turned off.");

export function webrtcConnector(getSecret: () => Promise<string>): Connector {
  return async (handlers, signal) => {
    const secret = await getSecret();
    if (signal.aborted) throw aborted();
    const microphone = await navigator.mediaDevices.getUserMedia({ audio: true });
    // From here on, every exit path releases the microphone.
    let peer: RTCPeerConnection | null = null;
    let events: RTCDataChannel | null = null;
    let closed = false;
    let graceTimer: ReturnType<typeof setTimeout> | null = null;
    const close = () => {
      if (closed) return;
      closed = true;
      if (graceTimer) clearTimeout(graceTimer);
      microphone.getTracks().forEach((t) => t.stop());
      events?.close();
      peer?.close();
    };
    signal.addEventListener("abort", close, { once: true });

    try {
      if (signal.aborted) throw aborted();
      const track = microphone.getAudioTracks()[0];
      if (!track) throw new Error("No microphone was found.");
      track.enabled = false;
      peer = new RTCPeerConnection();
      peer.addTrack(track, microphone);
      events = peer.createDataChannel("oai-events");
      const channel = events;
      const connection = peer;
      let partial = "";
      let onCleared: (() => void) | null = null;

      const drop = () => {
        if (closed) return;
        close();
        handlers.onDrop();
      };
      channel.addEventListener("message", ({ data }) => {
        let event: ProviderEvent;
        try {
          event = JSON.parse(String(data)) as ProviderEvent;
        } catch {
          return;
        }
        if (event.type === "input_audio_buffer.cleared") {
          onCleared?.();
        } else if (
          event.type === "conversation.item.input_audio_transcription.delta" &&
          event.delta
        ) {
          partial += event.delta;
          handlers.onPartial(partial);
        } else if (event.type === "conversation.item.input_audio_transcription.completed") {
          partial = "";
          handlers.onTranscript(event.transcript ?? "");
        } else if (event.type === "conversation.item.input_audio_transcription.failed") {
          partial = "";
          handlers.onTranscriptFailed(
            `The voice provider couldn't transcribe that${event.error?.message ? ` (${event.error.message})` : ""}.`,
          );
        } else if (event.type === "error") {
          handlers.onError(
            `The voice provider reported a problem: ${event.error?.message ?? "unknown error"}.`,
          );
        }
      });
      channel.addEventListener("close", drop);
      connection.addEventListener("connectionstatechange", () => {
        if (connection.connectionState === "failed") drop();
        else if (connection.connectionState === "disconnected")
          graceTimer = setTimeout(() => {
            if (connection.connectionState !== "connected") drop();
          }, DISCONNECT_GRACE_MS);
        else if (connection.connectionState === "connected" && graceTimer) clearTimeout(graceTimer);
      });

      const offer = await connection.createOffer();
      await connection.setLocalDescription(offer);
      const res = await fetch(CALLS_URL, {
        method: "POST",
        body: offer.sdp ?? "",
        headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/sdp" },
        signal:
          typeof AbortSignal.any === "function"
            ? AbortSignal.any([signal, AbortSignal.timeout(CONNECT_TIMEOUT_MS)])
            : AbortSignal.timeout(CONNECT_TIMEOUT_MS),
      });
      if (!res.ok)
        throw new Error(`The voice provider refused the connection (HTTP ${res.status}).`);
      await connection.setRemoteDescription({ type: "answer", sdp: await res.text() });
      if (channel.readyState !== "open")
        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(
            () => reject(new Error("Voice timed out connecting.")),
            CONNECT_TIMEOUT_MS,
          );
          channel.addEventListener(
            "open",
            () => {
              clearTimeout(timer);
              resolve();
            },
            { once: true },
          );
          signal.addEventListener(
            "abort",
            () => {
              clearTimeout(timer);
              reject(aborted());
            },
            { once: true },
          );
        });

      const send = (event: object) => {
        if (channel.readyState === "open") channel.send(JSON.stringify(event));
      };
      const result: VoiceConnection = {
        async startTurn() {
          partial = "";
          // Audio and events travel separately: unmute only after the clear has landed.
          await new Promise<void>((resolve) => {
            const timer = setTimeout(done, CLEAR_WAIT_MS);
            function done() {
              clearTimeout(timer);
              onCleared = null;
              resolve();
            }
            onCleared = done;
            send({ type: "input_audio_buffer.clear" });
          });
          if (!closed) track.enabled = true;
        },
        endTurn() {
          track.enabled = false;
          send({ type: "input_audio_buffer.commit" });
        },
        close,
      };
      return result;
    } catch (e) {
      close();
      throw e;
    }
  };
}

/** True where this browser can capture audio and open a WebRTC connection. */
export function voiceSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof RTCPeerConnection !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia)
  );
}
