/**
 * Spoken replies: prefer ElevenLabs when the server has TTS configured
 * (founder voice id), otherwise the browser's own speech. The words heard
 * match the text shown. Stopping speech never touches a mission.
 */

let currentAudio: HTMLAudioElement | null = null;

export function canSpeak(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function speakBrowser(text: string): void {
  if (!canSpeak()) return;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
}

export function speak(text: string): void {
  stopSpeaking();
  speakBrowser(text);
}

/** Play server-synthesized audio (base64). Falls back to browser speech on failure. */
export async function speakAudioBase64(
  text: string,
  audio: { base64: string; contentType: string } | null,
): Promise<"elevenlabs" | "browser"> {
  stopSpeaking();
  if (!audio?.base64 || typeof window === "undefined") {
    speakBrowser(text);
    return "browser";
  }
  try {
    const binary = atob(audio.base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: audio.contentType || "audio/mpeg" });
    const url = URL.createObjectURL(blob);
    const el = new Audio(url);
    currentAudio = el;
    el.onended = () => {
      URL.revokeObjectURL(url);
      if (currentAudio === el) currentAudio = null;
    };
    el.onerror = () => {
      URL.revokeObjectURL(url);
      if (currentAudio === el) currentAudio = null;
      speakBrowser(text);
    };
    await el.play();
    return "elevenlabs";
  } catch {
    speakBrowser(text);
    return "browser";
  }
}

export function stopSpeaking(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if (canSpeak()) window.speechSynthesis.cancel();
}

/** True while a reply is being read aloud, so talking over it counts as an interruption. */
export function isSpeaking(): boolean {
  if (currentAudio && !currentAudio.paused && !currentAudio.ended) return true;
  return canSpeak() && window.speechSynthesis.speaking;
}
