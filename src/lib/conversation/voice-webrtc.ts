/**
 * The browser end of a voice session: a WebRTC connection to the provider's
 * transcription-only session, authenticated with a short-lived token from our
 * server. The microphone track is muted except between Talk and Send, and the
 * provider's input buffer is cleared at the start of each turn, so only what
 * is said during a turn is transcribed. Browser only.
 */
import type { Connector, VoiceConnection } from "./voice-link";

const CALLS_URL = "https://api.openai.com/v1/realtime/calls";
/** How long a "disconnected" peer may take to recover on its own before it counts as dropped. */
const DISCONNECT_GRACE_MS = 4_000;

type ProviderEvent = {
  type?: string;
  delta?: string;
  transcript?: string;
  error?: { message?: string };
};

export function webrtcConnector(getSecret: () => Promise<string>): Connector {
  return async (handlers) => {
    const secret = await getSecret();
    const microphone = await navigator.mediaDevices.getUserMedia({ audio: true });
    const track = microphone.getAudioTracks()[0];
    if (!track) {
      microphone.getTracks().forEach((t) => t.stop());
      throw new Error("No microphone was found.");
    }
    track.enabled = false;
    const peer = new RTCPeerConnection();
    peer.addTrack(track, microphone);
    const events = peer.createDataChannel("oai-events");
    let closed = false;
    let partial = "";
    let graceTimer: ReturnType<typeof setTimeout> | null = null;

    const close = () => {
      if (closed) return;
      closed = true;
      if (graceTimer) clearTimeout(graceTimer);
      microphone.getTracks().forEach((t) => t.stop());
      events.close();
      peer.close();
    };
    const drop = () => {
      if (closed) return;
      close();
      handlers.onDrop();
    };

    events.addEventListener("message", ({ data }) => {
      let event: ProviderEvent;
      try {
        event = JSON.parse(String(data)) as ProviderEvent;
      } catch {
        return;
      }
      if (event.type === "conversation.item.input_audio_transcription.delta" && event.delta) {
        partial += event.delta;
        handlers.onPartial(partial);
      } else if (event.type === "conversation.item.input_audio_transcription.completed") {
        partial = "";
        handlers.onTranscript(event.transcript ?? "");
      } else if (event.type === "error") {
        handlers.onError(
          `The voice provider reported a problem: ${event.error?.message ?? "unknown error"}.`,
        );
      }
    });
    events.addEventListener("close", drop);
    peer.addEventListener("connectionstatechange", () => {
      if (peer.connectionState === "failed") drop();
      else if (peer.connectionState === "disconnected")
        graceTimer = setTimeout(() => {
          if (peer.connectionState !== "connected") drop();
        }, DISCONNECT_GRACE_MS);
      else if (peer.connectionState === "connected" && graceTimer) clearTimeout(graceTimer);
    });

    try {
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      const res = await fetch(CALLS_URL, {
        method: "POST",
        body: offer.sdp ?? "",
        headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/sdp" },
      });
      if (!res.ok)
        throw new Error(`The voice provider refused the connection (HTTP ${res.status}).`);
      await peer.setRemoteDescription({ type: "answer", sdp: await res.text() });
      if (events.readyState !== "open")
        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error("Voice timed out connecting.")), 10_000);
          events.addEventListener(
            "open",
            () => {
              clearTimeout(timer);
              resolve();
            },
            { once: true },
          );
        });
    } catch (e) {
      close();
      throw e;
    }

    const send = (event: object) => {
      if (events.readyState === "open") events.send(JSON.stringify(event));
    };
    const connection: VoiceConnection = {
      startTurn() {
        partial = "";
        send({ type: "input_audio_buffer.clear" });
        track.enabled = true;
      },
      endTurn() {
        track.enabled = false;
        send({ type: "input_audio_buffer.commit" });
      },
      close,
    };
    return connection;
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
