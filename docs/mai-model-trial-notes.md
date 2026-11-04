# MAI model trial notes

Status: **preparation only. Nothing is switched on.** Each trial below costs money and sends data to a new
processor, so each one needs the owner's approval first (see "Decision needed").

Checked on 3 November 2026 from the sources listed under each model. Model names, prices and availability
change; re-check them on the day of any trial instead of trusting this page. No model name in this note is
added to code or configuration.

## Why look at these at all

DeliverX already lets the owner choose the model (`DXSI_PROVIDER`, `DXSI_MODEL`, `DXSI_MODEL_ALLOWLIST`) and
discloses the model on every artefact. Microsoft AI (microsoft.ai) publishes its own MAI models. Two of them
match things DeliverX does: speech-to-text for voice input, and a reasoning model for drafting. microsoft.ai
has no education offering, so nothing there applies to the learning side of the product.

## 1. MAI-Transcribe-2 for voice input

**What it is.** Microsoft's speech-to-text model: about 60 languages, automatic language detection, speaker
labels, word timestamps and keyword biasing. Microsoft also announced a streaming variant,
MAI-Transcribe-2-Streaming.

**Where it is offered (checked 3 Nov 2026).**

- Microsoft Foundry / Azure Speech (microsoft.ai model page; Microsoft Learn "MAI-Transcribe").
- OpenRouter, as `microsoft/mai-transcribe-2`, listed at $0.10 per audio hour, with OpenRouter's data policy
  for it showing prompts not retained and not used for training (OpenRouter model list, read 3 Nov 2026).
- The older MAI-Transcribe-1.5 on OpenRouter is marked for removal on 22 December 2026, so it is not a
  candidate.

**How DeliverX transcribes today.** Voice input opens an OpenAI realtime transcription session from the
browser with a 60-second client secret minted on the server (`src/lib/conversation/voice.server.ts`). The
transcript then goes through the same path as typed text, and the owner confirms it before anything happens.

**What a trial would take.** This is not an allowlist change. OpenRouter offers the model through its
speech-to-text API, which transcribes a finished clip (its model page describes `response_format` and
timestamp options for that request), not a live stream. Confirm this against OpenRouter's speech-to-text
guide on the day. A trial needs:

1. a "record, then transcribe" mode: the browser records the clip and uploads it to a DeliverX server
   function, which sends it to OpenRouter (the key stays on the server);
2. a provider switch for voice, for example `DXSI_VOICE_PROVIDER=openai|openrouter`, with the model still
   required to be in `DXSI_MODEL_ALLOWLIST`;
3. the same limits as today: push-to-talk only, maximum clip length, transcript shown for confirmation, the
   existing voice measurements recorded so the two paths can be compared;
4. a privacy notice update naming the processor before any real user's voice goes to it.

The streaming variant would be the closer match to today's live experience, but it was not listed on
OpenRouter on the date checked. Using it would mean an Azure Speech account and a new integration.

**How to judge it.** The existing voice measurements (Phase 4c, `wf_voice_metrics`) already record the time
from speech to transcript and how many words the owner changed when correcting a line; a trial compares those
for both paths. On top of that, a fixed set of clips the owner records for the purpose (labelled as test
clips, never user audio) is transcribed by both and checked against the owner's own written text, with cost
per minute noted.

## 2. MAI-Thinking-1 for drafting

**What it is.** Microsoft's reasoning model, in public preview on Microsoft Foundry, with a
Chat Completions-compatible API (microsoft.ai "Introducing MAI-Thinking-1"; Microsoft Learn "Deploy and use
MAI-Thinking-1 in Microsoft Foundry (preview)").

**Where it is offered (checked 3 Nov 2026).** Microsoft Foundry only. It is not in OpenRouter's Microsoft
model list, and DeliverX's three supported providers (OpenAI, Vercel AI Gateway, OpenRouter) do not carry it.

**What a trial would take.**

1. A fourth provider in `resolveProvider` (`src/lib/workforce/model-runner.server.ts`) for an Azure Foundry
   endpoint: endpoint URL and key as server-only secrets, the deployment name checked against
   `DXSI_MODEL_ALLOWLIST`, and the same "record every model call" rule as the other providers.
2. An Azure subscription with a Foundry deployment of the model (preview terms apply).
3. The role evaluation suites (`npm run eval:roles`) run against it before any project uses it, compared with
   the current model on the same cases.
4. A privacy notice update naming Microsoft as a processor.

## 3. MAI-Code-1.1-Flash

Microsoft describes it as built into GitHub Copilot and VS Code. On the date checked, it was not offered as an
API model that DeliverX's providers carry. **No product change is proposed.** If it becomes available as an
API model, it could be judged like MAI-Thinking-1, through the role evaluation suites.

## Not proposed

- **MAI-Voice (text-to-speech).** Listen deliberately uses the browser's own speech, so no audio or text goes
  to a speech service and there is no per-use charge. A cloud voice would change that promise.
- **MAI-Image.** DeliverX does not generate images.

## Positioning (no product change)

Microsoft's own framing is "Humanist AI": people at the centre. DeliverX already says the same in its own
words: AI drafts, people decide, and every artefact says how it was made. No copy changes are proposed, and
DeliverX must not imply any association with Microsoft.

## Decision needed from the owner

For each trial, approve or decline:

| Trial                                                        | Spend                                        | New processor          | Engineering                                        |
| ------------------------------------------------------------ | -------------------------------------------- | ---------------------- | -------------------------------------------------- |
| MAI-Transcribe-2 via OpenRouter, test clips only             | OpenRouter usage at the listed per-hour rate | OpenRouter → Microsoft | Record-then-transcribe mode, voice provider switch |
| MAI-Thinking-1 via Microsoft Foundry, evaluation suites only | Azure subscription plus usage                | Microsoft (Azure)      | Foundry provider in the model runner               |

Until approved, nothing in this note is built or configured.
