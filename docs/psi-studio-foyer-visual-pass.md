# Studio foyer visual pass (28 Oct 2026)

## Problem

`/command` still read like a Command Centre ops dashboard: bootstrap loading blocked the foyer, the legacy specialist planner and mission ledger sat in the same scroll as intake, and the supervised **work** act buried the Intelligence Canvas under beat chrome. Broken CSS duplicated the canvas block (truncated `color-mix`), weakening canvas styling.

## After

- **Foyer first:** `WorkspaceFoyer` renders immediately; legacy planner mounts only when **Advanced** is opened (`command-legacy-planner.tsx`).
- **Calm viewport:** One brand + headline + one-liner intake; footnotes and voice collapsed; Portfolio in sidebar.
- **Investigation primary:** Canvas + PM briefing lead the work act; canvas panel props fixed; canvas card uses lavender surface tokens.
- **Project room:** Overview collapsed by default; section nav remains for deep links.

## Review locally

`npm run dev` → sign in → `/command` and `/command/supervised/$missionId` (after starting a case).

Browser snapshot was not verified in this pass (auth required).
