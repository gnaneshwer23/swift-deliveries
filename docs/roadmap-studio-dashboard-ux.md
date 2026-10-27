# Studio dashboard UX — diagnosis & polish plan

**Status:** Direction B **D1 + D2 shipping** (founder “complete b first”, 27 Oct 2026). D3/D4 held.  
**Date:** 27 October 2026  
**Live tip inspected:** https://www.deliverx.dev/command (~`de79e4d` era pre-ship)  
**Related (shipped spine, not superseded):** `docs/roadmap-briefing-experience.md`, `docs/roadmap-product-building-agents.md`  

---

## 0. Verdict (one line)

G1–G5 landed the **acts spine and foyer labels**, but `/command` still **reads as a SaaS ops wall**: stacked cards, honesty chips, usage chrome, cast grid, Talk strip, and Agents office as “Primary living surface” — not a single product-building briefing entrance.

North star gap: **briefing → strategy → cast → approve → living work** lives on the mission URL; the foyer still advertises **tools and desks**.

---

## 1. What was inspected

| Surface | URL | Method |
| --- | --- | --- |
| Studio foyer | `/command` | Signed-in Cursor browser · desktop 1440×900 + mobile shell · scroll |
| Mission theatre (context) | `/command/supervised/e1a95c83-…` | Same session · Acts chrome present |
| Shell / CSS | `command-shell.tsx`, `workspace-foyer.tsx`, `command.index.tsx`, `psi-workspace.css` | Code |

No tiny P0 crash. Cold load shows a blank canvas + “Loading your workspace…” for several seconds before shell paint — polish issue, not a redesign blocker.

---

## 2. Founder north star (rubric)

DeliverX Studio should feel like **attending a supervised product-building briefing**, then watching the cast work:

1. Brief the case  
2. Strategy / roadmap  
3. Cast & ownership  
4. Human approve  
5. Living work / artefacts  

**Not:** KPI strip, ops ledger, catalogue tourism, chat compliance dumps, or a dashboard of unrelated honesty systems.

Overview’s **one job:** get you into Act I (or resume the current act). Everything else is side room or under the fold.

---

## 3. Concrete visual / UX failures (live)

### 3.1 First viewport = inbox + compliance chips, not a foyer stage

- H1 **Studio** + multi-job subtitle (“Start a product question, watch the agents office, or continue…”).
- **Simulated drafts** / **Voice not configured** chips sit in the hero band — honesty as plot, not footnote.
- **Continue** = three equal-weight bordered cards; long questions **truncate mid-sentence**; looks like a task queue, not “pick the case on stage.”
- Breadcrumb **Studio / Studio** is empty chrome.
- No brand-level product-building presence in the content column (sidebar logo only). Composition fails the “one composition” test: remove nav and it is a generic resume list.

### 3.2 Shell still signals ops console

- Fixed sidebar: Studio / Agents office / Projects / Specialists / Programmes / Pilot requests + usage progress + shield sermon.
- Indigo-soft active state + Inter stack + card radius everywhere ≈ **generic AI SaaS dashboard** (not purple glow, but same family as “admin console”).
- `+ New mission` topbar CTA competes with the in-page brief.

### 3.3 Page is still a scroll of products

Below the fold (same `/command` document):

| Block | Problem |
| --- | --- |
| One-liner panel | Correct job, but framed as form + “provider not configured · usage 0/100” status line |
| Mission cast grid | Full cast board + Band/catalogue language on the **foyer** — theatre content without the theatre |
| Talk to DeliverX `<details>` | Collapsed control, but expands into classification / “Understood: I won't” dumps |
| **Agents office · Primary living surface** | Explicitly claims primacy on Overview — contradicts foyer contract |
| Advanced planner + mission ledger | Intent tabs, sample chips, filter pills — second intake product |

Mechanics of G2 (collapse inbox/stop) landed; **composition did not**. The page still fails “one job.”

### 3.4 Density & hierarchy

- Equal card weight: resume = cast = office = planner.
- Process copy (“Handoff: Waiting on: draft_options”, “Band L — Complex (catalogue ~75)”) wins over case language.
- Zero-state office counters (Doing 0 / Next 0 / Done 0) read as empty ops telemetry.

### 3.5 Mission theatre (for contrast — not the foyer complaint)

Acts labels exist (Briefing → Build). Still chippy beat buttons, sidebar ops chrome, and gate CTAs that lean download/pack. Better than Overview — but Overview is where “dashboard doesn’t look good” hits first.

---

## 4. Root causes (not “needs more polish”)

1. **IA leak:** `command.index.tsx` mounts foyer **and** Agents office **and** advanced tools on one route. Foyer file comments say ops stay under the fold; parent re-promotes office as primary.
2. **Honesty placement:** readiness chips and provider/usage lines own first read.
3. **Shell metaphor:** usage meter + multi-app nav + panel stack = dashboard, regardless of “Studio” rename.
4. **Typography / composition:** Inter + flat canvas + bordered cards — no editorial stage for a one-liner or a single continue case.
5. **Shipped checklist vs feel:** G2/G3 marked shipped when structure existed; founder judgment is **look and presence**, which still fail.

---

## 5. Redesign directions (2–3) + recommendation

### Direction A — Foyer strip (minimal)

Keep shell. First viewport = one continue case **or** one-liner stage; demote chips to footer; remove Agents office + cast board from `/command`; leave Talk/advanced under deeper folds.

- **Pros:** Smallest diff; reuses `psi-workspace.css`; fast demo.  
- **Cons:** Shell still feels SaaS ops; brand presence weak.  
- **Risk:** “Still looks like a dashboard, just shorter.”

### Direction B — Editorial foyer + quiet shell (**recommended · shipping D1+D2**)

Same IA as Option 2 in `roadmap-briefing-experience.md`, but **finish the look**:

- One composition on Overview: brand/product signal + one headline + one short line + one CTA (continue or brief).
- Resume as a single focal case (others in a quiet list).
- Honesty as footnotes / expandable “How this was produced.”
- Soften shell: usage + Pilot + shield to account menu; nav labels stay.
- Agents office **only** on `/command/capabilities#agents-office` (already linked).
- Cast lives on mission + Specialists — not foyer.
- Stay inside `psi-workspace.css` tokens; foyer H1 may use Albert Sans (`--motion-display`); **no** purple/glow AI slop.

- **Pros:** Answers “doesn’t look good” and north star; no route fork; aligns prior G\* decisions.  
- **Cons:** Needs copy + CSS composition work; founder must accept demoting office from Overview.  
- **Risk:** Scope creep into full mission theatre restyle — contain with phases below.

### Direction C — Theatre-first shell rewrite

Replace sidebar dashboard chrome with a stage frame (acts rail always visible; side rooms as drawers).

- **Pros:** Strongest anti-dashboard signal.  
- **Cons:** Large build; touches every `/command/*` page; high Lovable churn risk.  
- **Risk:** Rebuilds chrome before foyer proof.

**Recommend Direction B.** Direction A under-answers the visual complaint. Direction C is premature until foyer composition is proven.

---

## 6. Phased polish plan (approval-gated)

| Phase | Scope | Changes | Demo criteria (founder click) | Status |
| --- | --- | --- | --- | --- |
| **D0 — Contract** | This doc | Close open decisions below | Founder “build D1…” (or named subset) | Done — “complete b first” |
| **D1 — Overview composition** | `/command` only | One first-viewport composition; single focal continue; one-liner as the only hero form; remove Agents office block from index; cast panel off foyer; readiness chips demoted; truncate/title resume rows | First screen = continue **or** brief — no office, no cast grid, no advanced ledger visible without expand | **Shipping** |
| **D2 — Quiet shell** | `CommandShell` | Soften usage/shield/Pilot; fix Studio/Studio breadcrumb; one primary CTA logic | Shell no longer reads as ops console; foyer still calm | **Shipping** |
| **D3 — Mission theatre presence** | Supervised URL | Beat chips → stage focus; one focal gate CTA; process/band language to footnotes | Approve gate feels like Act IV, not a download dashboard | Held |
| **D4 — Side rooms consistency** | Specialists / Projects | Cast-first and project shelf already shipped — visual alignment only if D1–D3 pass | Side rooms don’t reintroduce KPI walls | Held |

Out of scope for this track unless reopened: new `/cases` route, programme rebuild, purple themes, fake cinematic timers, promoting voice or 150-role tourism.

---

## 7. Open decisions — closed for D1/D2

1. **Approve Direction B (D1–D2 first)?** Yes — founder “complete b first”.  
2. **Agents office on Overview:** remove entirely from `/command` (link-only) — **yes**.  
3. **Resume UX:** one hero case — **yes** (others in quiet drawer).  
4. **Shell usage meter:** account menu — **yes**.  
5. **Type:** Inter workspace stack; foyer headline may use Albert Sans (`--motion-display`) only.  
6. **Mission theatre (D3):** wait until foyer demo passes — **held**.

---

## 8. Ship note (D1 + D2)

- Overview: editorial stage · one Continue hero or one-liner brief · cast/office off · honesty in footnotes · Talk + advanced under fold.  
- Shell: breadcrumb no longer `Studio / Studio` · usage / Pilot / shield under Account · `+ New case` · quieter nav active.  
- Next: D3 mission theatre presence; D4 side-room visual alignment.
