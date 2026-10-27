/**
 * Spoken replies use the browser's own speech, so the reply heard is exactly
 * the reply written, and nothing more is sent to a provider. Stopping speech
 * only silences it: it never touches a mission.
 */

export function canSpeak(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function speak(text: string): void {
  if (!canSpeak()) return;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
}

export function stopSpeaking(): void {
  if (canSpeak()) window.speechSynthesis.cancel();
}

/** True while a reply is being read aloud, so talking over it counts as an interruption. */
export function isSpeaking(): boolean {
  return canSpeak() && window.speechSynthesis.speaking;
}
