# Talking to DeliverX (Phase 4a)

The founder can describe a product objective, ask how a mission is going, or ask to pause, resume or cancel one, in plain words. Phase 4a delivers this by typing, on the Command Centre and on mission pages (`/command/missions/…`). Supervised pilot missions (`/command/supervised/…`) do not have it yet. Voice (Phase 4b) uses exactly the same path: spoken words become a transcript line, and everything below applies unchanged.

## Nothing is approved by talking

The assistant replies with a card saying what it understood. A card never acts.

| You say                         | The card                                                       | What happens                                                                                            |
| ------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| A product objective             | The brief: mission type, product and text, all editable        | Nothing until you click **Draft mission plan**. That drafts a plan; execution still waits for approval. |
| "Pause / resume / cancel it"    | Which mission is meant, with a button                          | Nothing until you click the button. Cancelling asks you to confirm.                                     |
| "Approve the plan", "go ahead"… | A refusal: approvals are given only on the plan or gate itself | Nothing. A link opens the mission.                                                                      |
| "How's it going?"               | A summary read from the mission's event log                    | Nothing. It says only what the log records.                                                             |
| "Stop" or "stop talking"        | Silences the assistant (this matters once voice arrives)       | Nothing. Stopping speech never cancels a mission; cancelling needs "cancel the mission" and a click.    |

Only the latest reply's buttons are live, so an older card cannot be acted on after the conversation has moved on.

## Understanding a request

Interpretation is deterministic (`src/lib/conversation/interpret.ts`): the same words always give the same card, and no model is involved.

- **Missions are never guessed.** "It" means the mission on screen. Otherwise a named mission title is used, or the only mission a request could apply to. If several could apply, the card lists them and you pick one.
- **A mission that can't take the request gets no button.** Asking to pause a finished mission, or resume one that isn't paused, gets a reply saying so, and nothing to click. The server enforces the same rules.
- **Briefs are not commands.** "An app that lets members cancel their plan" or "why students pause lessons" is a brief, not a request. A control request is the verb alone ("cancel it"), the verb aimed at a mission ("pause the tutor mission"), or the verb aimed at a mission's title ("pause Tutor discovery").
- **Negations are not commands.** "Don't cancel the mission" gets "Understood: I won't. Nothing has changed." It is never read as a brief either.
- **Products are confirmed.** If a brief names one of your products, that product is used. If you have one product and didn't name it, the card asks you to confirm it. If you have several, you pick one.
- **Spoken numbers are confirmed in writing.** Numbers heard in speech are listed on the card, each with the words around it, and the plan cannot be drafted until each is ticked as right. Editing the brief clears the ticks, so what you confirm is the final text. Typed numbers are already in writing.

## Corrections

Any line you sent can be corrected. The correction is kept as a new line, marked "corrected", and understood afresh; the earlier line and card stay in the transcript. Nothing has run in between, because nothing runs without a click.

## Transcripts

- **Text only.** There is no column for audio, so raw audio can never be stored.
- **Kept for the period you choose:** 1, 7, 30 (default) or 90 days after the last message. Each new message pushes the date out again. The date is shown under the conversation.
- **Deleted when due.** Expired conversations are deleted whenever conversations are read, and in batches of 500 at the start of every worker tick. The purge and the worker run independently, so a failure in one never stops the other.
- **Deletable now.** **Delete now** removes the conversation and every line at once.
- **Long conversations.** The panel shows the latest 200 lines and says how many earlier lines are kept but not shown.
- **Yours alone.** A conversation belongs to the founder who started it, inside their workspace. No one else can read or add to it.

A mission drafted from a card records `via: "conversation"` on its `mission.created` event, and the activity log says so. The server records that only after checking that the latest card in the founder's own live conversation is a brief. If the card has moved on, drafting is refused. If the card was for a new product, the product and its first mission are created in one transaction, so a failure leaves neither behind.

## Voice (Phase 4b)

Voice is push-to-talk. What you say becomes a transcript line (marked "spoken") and goes through exactly the same path as typing, so everything above applies unchanged. In particular, spoken numbers must be ticked in writing, and nothing is approved by voice.

- **Off until switched on.** Voice needs `DXSI_VOICE_ENABLED=true`, `OPENAI_API_KEY`, and a transcription model in `DXSI_VOICE_TRANSCRIBE_MODEL` that is listed in `DXSI_MODEL_ALLOWLIST`. There is no default model. If anything is missing, the panel says what, and typing works as before.
- **Transcription only.** The provider is given a transcription session, not a conversational model, so it only writes down what was said. Replies come from the same deterministic interpreter as typed messages and are read aloud by the browser's own speech, so the reply you hear is exactly the reply written.
- **Permission first.** Nothing is captured until you click **Use voice**, read what happens to your audio, click **Turn voice on**, and grant the browser's microphone permission.
- **Push-to-talk.** The microphone track is muted except between **Talk** and **Send what I said**. A red dot and "Recording" show while it is open. At each Talk the provider's input buffer is cleared, so only that turn is transcribed.
- **No audio kept.** Audio streams to the provider for transcription and is never stored by DeliverX. Only the written transcript is saved, for the retention period you chose.
- **The key stays on the server.** The browser connects with a token minted per session by `startVoiceSession`. The token is valid for 60 seconds, bound to a transcription-only session, and sent with a hashed user id for the provider's abuse monitoring. Each mint is audited (`voice.session_started`, with the model), and a workspace can mint at most 20 in 10 minutes.
- **Interrupting is not cancelling.** Pressing Talk or **Stop speaking** only silences the spoken reply. **Turn voice off** only ends the voice session. Neither, nor a dropped connection, touches a mission: the voice session (`voice-link.ts`) has no way to reach one.
- **Reconnecting.** If the connection drops, voice reconnects up to three times with a fresh token. A sentence cut off mid-turn is reported, not guessed at. If it can't reconnect, the conversation is untouched and typing carries on.

The provider connection (`voice-webrtc.ts`) follows OpenAI's documented WebRTC and transcription-session flow. It has not yet been exercised against the live API, because no key is configured. The session logic around it is covered by tests with a fake connection.

## Still to come

- **Phase 4c:** measurements of recognition accuracy, response latency and interruptions.
