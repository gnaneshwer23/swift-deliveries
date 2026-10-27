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

## Still to come

- **Phase 4b:** voice, through server-minted short-lived provider tokens. It needs the voice provider key and model to be configured.
- **Phase 4c:** measurements of recognition accuracy, response latency and interruptions.
