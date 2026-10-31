# Design — DeliverX Studio

A locked design system for the signed-in Studio (`/command`, `/command/supervised/$id` and the
screens they render). Every Studio redesign reads this file before emitting code. Extend or amend
it when the system needs to grow; do not override it per screen.

Scope: the Studio only. The public marketing site keeps its own visual foundation
(`src/styles/psi-foundation.css`, see `AGENTS.md`). This system is tuned to that foundation so the
Studio reads as the same company: same paper, ink, indigo accent and type families.

Tokens live in `src/styles/studio-system.css`, scoped to the `.sx` root class so they never leak
into marketing pages or older screens that have not moved yet.

## Genre

modern-minimal — a calm working tool. Function carries the page.

## Macrostructure family

- App pages (case workspace, dashboard, team, decision path): **Workbench** — a quiet left rail
  for navigation, one work surface, no hero.
- Content pages (briefing, evidence & decision log, package): **Long Document** — a single
  readable column, headings and hairline rules, no card walls.
- No marketing pages in this scope.

## Case structure

One URL per case (`/command/supervised/$id`) with two modes:

1. **Decision path** (before a decision is recorded): four steps — Brief (idea and answered
   questions) · Investigation · Briefing · Decide. One Back / Continue pair, at the bottom.
2. **Case workspace** (after the decision): Overview · Team · Timeline · Evidence & decisions ·
   Package · Ask Aria · Decision path (to revisit). Overview is home once delivery runs.

## Theme

Light paper, navy ink, one indigo accent. Amber means "waiting on you" and nothing else.

- `--sx-paper` oklch(98.2% 0.004 265) — page
- `--sx-surface` oklch(100% 0 0) — work surface, inputs
- `--sx-sunken` oklch(96% 0.008 265) — rail, quiet panels
- `--sx-ink` oklch(29% 0.05 265) — text (#202b43 family)
- `--sx-ink-2` oklch(43% 0.035 265) — secondary text
- `--sx-muted` oklch(52% 0.025 265) — captions (≥ 4.5:1 on paper)
- `--sx-rule` oklch(90% 0.012 265) — hairlines
- `--sx-rule-strong` oklch(82% 0.015 265) — control borders
- `--sx-accent` oklch(50% 0.17 275) — indigo (#4c56c9), ≤ 5 % of any view
- `--sx-accent-ink` oklch(99% 0 0) — text on accent
- `--sx-accent-soft` oklch(95.5% 0.025 275) — current-item wash
- `--sx-waiting` oklch(50% 0.12 65) — owner gates and "waiting on you"
- `--sx-waiting-soft` oklch(96.5% 0.04 85)
- `--sx-done` oklch(46% 0.1 155) — recorded / complete
- `--sx-danger` oklch(50% 0.17 27)
- `--sx-focus` = accent, 2px ring, 2px offset, never animated

## Typography

- Display: Albert Sans 600, roman only, tracking −0.015em. Headings only.
- Body: Inter 400 / 500.
- Mono: JetBrains Mono 500 (system mono fallback) — ids, sources, units, timestamps.
- Scale: `--sx-text-xs` .75 · `sm` .875 · `md` 1 · `lg` 1.125 · `xl` 1.375 · `2xl` 1.75 ·
  `display` clamp(1.6rem, 1.2rem + 1.4vw, 2.25rem).
- Measure: 68ch for document columns.
- No italic headings. No uppercase mono "kicker" labels above headings; a heading is enough.

## Spacing

4-point named scale (`--sx-space-3xs` .25rem … `--sx-space-2xl` 4rem). Pages use named tokens,
never raw values.

## Surfaces and depth

- Hairline rules (`1px solid var(--sx-rule)`) separate things. No glass, no backdrop blur, no
  gradients, no glow, no coloured shadows.
- One elevation only, for floating layers (sheets, menus): a soft neutral shadow.
- Radius: controls 8px, panels 12px, pills 999px.

## Status language (never colour alone)

Every state is written in words next to its mark: Done · Next · Not started · Waiting on you ·
Blocked · Failed · Simulated draft. Amber is reserved for "Waiting on you".

## Motion

- Easing `--sx-ease-out` cubic-bezier(0.16, 1, 0.3, 1); duration `--sx-dur` 180ms.
- Animate opacity and transform only. Nothing animates on page load.
- `prefers-reduced-motion: reduce` → opacity only, ≤ 120ms.

## Microinteractions stance

- Silent success: the record updates; no celebratory toasts.
- Errors inline, next to the action, with what was not changed.
- Approvals always need an explicit confirm step that says what will happen.

## CTA voice

- Primary: solid indigo, 8px radius, verb-first ("Approve and begin delivery"). One per view.
- Secondary: hairline border, ink text.
- Text links: indigo, underlined on hover and focus.

## What screens MUST share

The `.sx` tokens, the type pair, the CTA voice, hairline surfaces, the status vocabulary, and the
rail + surface layout for app pages.

## What screens MAY differ on

Within Workbench: rail contents and surface layout. Content pages may drop the rail on narrow
viewports. No per-screen palettes, fonts or effects.

## Responsive

Verified at 320 / 375 / 414 / 768 px. No horizontal scroll. Below 760px the rail collapses into a
"Sections" disclosure above the surface; the decision-path steps wrap.
