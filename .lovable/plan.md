# Interview Practice Strategy — Sprint 1–2: Evidence-Grounded AI Interviewer

Source: uploaded "DeliverX — Interview Practice Strategy" (8 Oct 2026). The strategy orders four pieces; this plan builds piece 1 (the evidence-grounded AI interviewer, sprints 1–2), the one competitors can't copy. Peer cohort sessions (piece 2), coach-reviewed recordings (piece 3) and the "no live copilots" homepage line (piece 4) are listed as follow-ups, not built now.

## What exists today

Interview Lab (`/workspace/interview`) already: starts a practice session, drafts 5 questions from the user's evidence record via the AI gateway (never inventing work), saves frozen text answers with self-ratings, and never writes evidence or Verified state.

## What this plan adds

1. **Typed questions tied to record entries** — each generated question links to a real evidence/artefact entry and gets a type (defend, trade-off, stakeholder, metric). The user can open the entry the question refers to.
2. **Drill-down follow-ups** — after each answer, the AI scores it; a weak dimension triggers one follow-up question (max depth 3), the way a hiring manager probes.
3. **Record check (fabrication check)** — the AI extracts each factual claim from an answer (metric, action, outcome, role) and labels it: Supported (green tick + record excerpt), Partial ("your record doesn't show this figure"), Not in record ("is this from work outside DeliverX? Label it so"), or Contradicted (hard flag, excerpt side by side). The UI never says "fabricated".
4. **Framework-scored feedback** — end-of-session feedback scored against the pinned pm-core@2026.1 dimensions, every point citing the answer text and the record entry. Labelled practice-level; the word "verified" never appears.
5. **Trust rail in the schema** — new tables carry `signal_level = 'practice'` and cannot write to evidence, score runs, judgements or Verified status. Answers freeze at submit (checksum, no edits), same as artefacts.

## Data model (new tables, owner-scoped RLS)

- `answer_claims` — claim text, type, matched record entry, support status, record excerpt
- `interview_feedback` — rubric dimension, score, rationale, source (ai now; peer/coach later)
- `interview_questions` gains: source record entry id, question type, parent question id, depth
- Existing `interview_sessions` / `interview_answers` reused; answers gain a checksum

## AI pipeline (server-side only, Lovable AI gateway)

Per session: select 3–5 strongest + 1–2 weakest record entries → one typed question per entry → one question at a time → follow-up on weak dimensions (depth ≤ 3) → extract claims → record check → score against pm-core@2026.1 → save as practice. Structured JSON only, per the six interviewer prompt rules in the spec. Per-session API cost logged to monitoring.

## Acceptance criteria (from the spec)

- Every question links to a real record entry the user can open
- Answers cannot be edited after submit
- Each extracted claim shows a status and, where matched, the record excerpt
- Nothing in a session can change a Verified signal
- A 5-question session runs end to end in under 25 minutes
- Per-session API cost is logged

## Technical notes

- Migration `0012_interview_practice_sprint1.sql`: new tables/columns, RLS, signal_level constraint
- Extend `src/lib/interview-ai.server.ts` (question typing, follow-ups, claim extraction, record check, rubric scoring) and `src/lib/career.functions.ts` / `career-queries.ts`
- Rework `src/routes/_authenticated/workspace.interview.tsx`: one-question-at-a-time flow, frozen answers, feedback view grouped by rubric dimension with Record check badges
- Model: `openai/gpt-6-astra` via the existing gateway pattern; key stays server-side
- Tests: record-check status mapping, answer freeze, follow-up depth cap, trust-rail constraint (no interview table can write evidence)

## Deferred (later sprints, not this plan)

- Piece 2: peer "defend my decision" cohorts — Cal.com slots + Daily.co/Whereby rooms, `peer_cohort_slots`, `peer_pairings`, artefact swap with time-boxed access
- Piece 3: async coach-reviewed recordings, per-session payment
- Piece 4: "no live interview copilots" line on the homepage "What we do not promise" list
- Voice input (speech-to-text into the same flow) after the pilot
