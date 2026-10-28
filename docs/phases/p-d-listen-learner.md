# Phase P-D — Listen + learner lens (partial)

**Status:** Listen slice shipping; learner lens not started  
**Parent case:** `docs/business-case-deliverx-psi-v2.md` §16 P-D  
**Voice id (founder):** `Aa6nEBJJMKJwJkCx8VU2` (`DXSI_TTS_VOICE_ID`; also code default)

---

## Listen (this slice)

| Item | Behaviour |
| --- | --- |
| Same words | `pmBriefListenScript` matches on-screen PM brief |
| Provider | ElevenLabs when `DXSI_TTS_ENABLED=true` + `ELEVENLABS_API_KEY` |
| Fallback | Browser `speechSynthesis` if TTS off or fails |
| UI | Listen / Stop on briefing + approve acts |
| Safety | Listen never approves or mutates a mission |

## Still needed from founder

1. Set Production (and Preview if demos) `ELEVENLABS_API_KEY`  
2. Set `DXSI_TTS_ENABLED=true` after the key is in place  
3. Redeploy so runtime picks them up  

`DXSI_TTS_VOICE_ID=Aa6nEBJJMKJwJkCx8VU2` is recorded as the default and set on Vercel as plain config.

## Learner lens

Not in this slice — separate follow-on within P-D.

---

## Decision log

| Date | Entry |
| --- | --- |
| 28 Oct 2026 | Founder supplied ElevenLabs voice id `Aa6nEBJJMKJwJkCx8VU2`. Listen wired with browser fallback. |
