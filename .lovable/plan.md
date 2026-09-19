# Design enhancement: make DeliverX obvious in 15 seconds

Borrowing the real lesson from leadjourney.io — not its colours or illustrations, but its ability to make a complicated system feel obvious. Start with the outcome, introduce the machinery gradually, keep the spacing calm and the tone direct.

New look: the white background stays. Everything else gets sharper — light, calm surfaces with one warm accent, bento-grid sections, applied across every public page and the signed-in area.

## 1. The story spine (the most important change)

One ladder, repeated everywhere, in five plain words:

```text
Learn  →  Work  →  Build  →  Prove  →  Advance
```

- **Home** opens with the outcome, not the machinery: "Don't just learn the job. Do the job." One short paragraph, two buttons (Get started, See plans), and the five-word ladder directly under it as the mental model.
- The existing six-step method stays, but moves lower and is reframed as "How it actually works" — the detail behind the ladder, for people who want it.
- Product names (Experience, Launchpad, Professional Workspace, Evidence record) stop being the first thing a visitor meets. Each one is introduced as the answer to a stage of the ladder: Experience = Work, Launchpad = Build, Evidence + attestation = Prove, Applications and Interview Lab = Advance.
- Every public page gets the same ladder strip near the top with its own stage highlighted, so the visual language carries through the journey.
- Writing pass on all public pages: shorter sentences, no jargon, no invented claims. The existing honesty statements ("what we do not promise", no guarantees, nothing Verified without external confirmation) stay exactly as they are.

## 2. The new visual language

- **Palette:** near-black base `#0A0A0B`, raised surface `#17171A`, border/elevated `#2A2A2E`, warm amber accent `#F5B544`. Amber is reserved for the one action that matters per section; confirmed/verified states keep a distinct colour so the two never get confused.
- **Type:** large, tight display headings; generous line height in body copy; monospace only for small labels and stage numbers.
- **Space:** considerably more room between sections than today — the calm that makes the information feel manageable.
- **Bento grid:** each section is a set of tiles of differing size rather than a wall of equal cards. Big tile carries the claim, smaller tiles carry the supporting facts.
- **Real product views:** the credibility element. Tiles show actual UI — a real evidence entry, a real capability profile, a coach decision — rendered from the app's own components with a sample record, clearly framed as a product view, never fake data presented as someone's results.
- Radii 4px/8px, visible focus rings, no emoji, no placeholder content.

## 3. Pages in scope

**Public:** Home, Experience, Launchpad, Professional Workspace, How it works, About, Plans, Resources hub and both guides, sign-up / sign-in / password pages, Terms / Privacy / Cookies, shared portfolio and attestation pages.

**Signed-in:** the workspace frame (sidebar, header, page headings), Dashboard, and the shared building blocks — cards, tables, tabs, forms, buttons, empty states — so every one of the 15 signed-in pages inherits the new look without rewriting each page's logic.

## 4. What does not change

No change to what anything does: evidence rules, coach confirmation, attestation, scoring, consent, checkout and pricing all behave exactly as now. This is presentation and wording only.

## Technical notes

- Replace the current `.dxs` / `.dxa` / `.pw-*` token sets in `src/styles.css` with one token layer (near-black + amber) mapped through `@theme inline`, so the public site and the workspace stop drifting apart. Existing class names are kept as aliases where a page depends on them, to avoid touching page logic.
- New shared marketing components: `journey-ladder` (the five-stage strip, with active stage), `bento` grid primitives, `product-view` frame for real UI tiles. `faq-section` and `guide-article` are reused as-is.
- `src/routes/index.tsx` restructured: hero → ladder → bento "what you get" → product views → six-step method → plans teaser → honesty card → FAQ. Its `head()` metadata, canonical URL, Open Graph tags and JSON-LD are preserved, with the HowTo step list kept in sync with the six-step section.
- Workspace restyle lands in `workspace-shell.tsx` plus the shared token layer; individual `_authenticated/*` routes are only touched where a hardcoded colour utility blocks theming.
- Verification per batch: `bunx tsgo --noEmit`, build log clean, then Playwright passes over all public pages and the signed-in pages at 1280px and 375px with both the candidate and coach accounts.

## Suggested sequence

1. Token layer + shared primitives (ladder, bento, product view).
2. Home page rebuild, including the story spine and metadata sync.
3. Remaining public pages, each with its ladder stage and copy pass.
4. Workspace frame and shared building blocks.
5. Full desktop + mobile pass, then publish to deliverx.dev.
