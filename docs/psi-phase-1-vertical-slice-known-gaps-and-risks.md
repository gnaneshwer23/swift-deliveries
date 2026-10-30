# PSI Phase 1 vertical slice — known gaps and risks

**As of:** 28 Oct 2026 · commit `904838ec06335dec4bf642ff4d2a16f815f67e4c`

---

## Labelled product gaps (honest)

| Gap                                      | User-visible posture                                    | Phase                 |
| ---------------------------------------- | ------------------------------------------------------- | --------------------- |
| File attachments on idea intake          | Paste into Evidence; note on commitment panel           | Deferred (R1)         |
| Notify when ready delivery               | Preference saved; copy says check the case              | Awaits notifier infra |
| Watchtower scheduled checks              | Preferences + stale fields; “runner not live”           | PT-6 partial          |
| Monitoring allowance billing             | Disclosed separately; not charged without runner        | Commerce later        |
| Cloud TTS for Listen                     | Browser speech only unless optional provider configured | P-D                   |
| Live web research proof                  | Requires env keys + budget approval                     | Ops                   |
| Comprehensive archive at portfolio scale | PT-3 ZIP exists per mission; not enterprise archive     | Phase 2+              |

---

## Technical risks

1. **Dual persistence paths** — Unit tests use `MemoryStore`; production uses Neon JSON documents. Behaviour should match but only integration tests with `DATABASE_URL` prove it.
2. **Simulated comparison default** — Without providers, options are deterministic from evidence; risk of overstating diligence in marketing if labels are removed.
3. **Concurrency** — Mission version conflicts are handled in service layer; high concurrency not load-tested.
4. **Lovable sync** — Pushes to `main` sync to Lovable; keep branch green; avoid force-push.
5. **Legacy Supabase** — Must remain inactive for PSI; accidental exposure would confuse auth story.

---

## Scope risks (process)

- **Phase creep:** Project room monitoring depth, portfolio digests, and runner automation are **Phase 2+** — do not expand under Phase 1 banner.
- **Production claim:** Passing Vitest is necessary, not sufficient, for paid availability (`docs/business-case-approval-standard.md`).

---

## Mitigations already in code

- Honesty labels in decision pack and PM role disclosure
- `executionLimited` distinguishes platform failure from evidence pause
- Counterevidence and recommendation preserved on disagreement
- Export manifest exclusions (PT-3)
- `honesty-posture` panel for stale evidence and cost split copy

---

## Founder decisions (only if pursuing beyond Phase 1)

| Decision                                     | Why                                             |
| -------------------------------------------- | ----------------------------------------------- |
| Authorise Watchtower runner + monitoring SKU | Enables scheduled checks and allowance charging |
| Authorise notifier service                   | Makes “notify when ready” real                  |
| Authorise live provider budget               | Proves cited research path end-to-end           |
| Authorise staging/production deploy          | Separate from local Phase 1 complete            |

**Phase 1 requires no further founder decision to mark local slice complete.**
