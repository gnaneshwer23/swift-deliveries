# DeliverX provider posture (P0-B)

**Date:** 27 October 2026  
**Tip:** `f688e80` (Production READY)  
**Decision (founder P0):** **Simulated drafts by default** until Production (and Preview if demoing there) has opt-in model mode configured. Do not invent keys. Do not silently swap Simulated → Model.

Related: `docs/psi-preview-setup.md`, `docs/roadmap-next-build.md` §P0-B, foyer chips in `src/components/command/studio-readiness.tsx`.

---

## What a pilot receives today

| Capability | Production posture at `f688e80` | UI honesty |
| --- | --- | --- |
| Stage / artefact generation | **Simulated** — `DXSI_MODEL_ENABLED` not set on Production | Foyer chip: **Simulated drafts**; artefact badge: **Simulated draft** |
| Voice brief | **Off** — voice env names absent | Foyer chip: **Voice not configured** |
| Web research (Combined/Web) | **On** when `TAVILY_API_KEY` present (Production) | Research chip: **Web research ready · tavily** (when key wired); otherwise gaps labelled |
| Checkout / Stripe | **Off** — no payments env names | Pricing/pilot: **Checkout is not live** / manual activation |

Model mode is opt-in in code (`DXSI_MODEL_ENABLED === "true"` plus provider credentials and allowlist). Missing or misconfigured mode never invents model output; chips show **Simulated drafts** or **Model misconfigured**.

---

## Founder configure list (names only — set in Vercel, never commit values)

Enable **model mode** only when spend cap and allowlist IDs are confirmed on the provider account:

1. `DXSI_MODEL_ENABLED=true`
2. `DXSI_PROVIDER` — `openai` | `vercel-ai-gateway` | `openrouter`
3. Provider key (one of): `OPENAI_API_KEY` / `AI_GATEWAY_API_KEY` / `OPENROUTER_API_KEY`
4. `DXSI_MODEL` (and/or `DXSI_OPENAI_MODEL` for direct OpenAI)
5. `DXSI_MODEL_ALLOWLIST` — comma-separated exact IDs that may be called (required when model mode is on)
6. Optional: `DXSI_DECISION_MODEL` (must also be on the allowlist)

Optional **voice** (reuses OpenAI key path):

7. `DXSI_VOICE_ENABLED=true`
8. `DXSI_VOICE_TRANSCRIBE_MODEL` (must be on the allowlist)
9. `OPENAI_API_KEY` present

Optional **operator allow-list** (defaults to published operator email if unset):

10. `PSI_OPERATOR_EMAILS`

Research already uses Production `TAVILY_API_KEY`. Add the same name on Preview only when live citations are needed there.

After setting secrets: redeploy Production so runtime picks them up. Confirm foyer chips flip to **Model · \<id\>** / **Voice ready** on a fresh signed-in load — no code change required if env is correct.

---

## Explicit non-goals for this posture pass

- No inventing or pasting secrets into git or chat.
- No enabling Stripe / `VITE_PAYMENTS_CHECKOUT_ENABLED` (P1).
- No claiming production-ready when model mode turns on.
- No PII-looking brief text into models without the existing privacy screen path.
