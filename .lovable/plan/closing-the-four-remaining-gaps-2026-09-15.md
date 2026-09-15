# Closing the four remaining gaps

Four separate pieces of work. Two need one action from you first (an email domain, a payments account); two are pure build work.

## 1. Sending emails from deliverx.dev

Today the app sends nothing: invitations, attestation requests and portfolio shares all rely on the person copying a link by hand, and sign-up/reset emails come from a generic Lovable sender.

You already own deliverx.dev, so it can be the sender domain (e.g. notify@deliverx.dev). Once you complete the short setup dialog and the DNS records verify, I will:

- Brand the six account emails: confirm sign-up, sign in link, password reset, invite, email change, re-authenticate.
- Add real emails for the flows that currently dead-end:
  - Team invitation — sent to the invitee with the join link and who invited them.
  - Attestation request — sent to the named attestor with the confirm/decline link.
  - Coach decision — sent to the candidate when a submission is confirmed or returned with guidance.
  - Portfolio share — optional send-to-recipient when a share link is created.
- Keep every send tied to one trigger and one recipient. No bulk sending, no newsletters.

Delivery outcomes (bounces, complaints, unsubscribes) will be visible to you and handled automatically.

## 2. Payments for the course and 1:1 coaching

Recommended provider: Paddle. It fits a digital learning/assessment product, and it handles sales tax, invoicing and billing support worldwide as the seller of record, so you don't register for VAT in each country. All-inclusive fee is 5% + 50c per transaction. A test environment is created immediately; taking real money needs a short verification step.

Products to create from your pricing:

| Product | Price | Type |
| --- | --- | --- |
| DeliverX Course | GBP 499 (was GBP 699) | One-time |
| 1:1 Coaching hour | GBP 50 | One-time, repeatable |
| Intro call, 15 min | Free | No payment |

Then:

- A pricing page showing the course at GBP 499 with GBP 699 struck through, the coaching hour, and the free intro call.
- Checkout for the course and for coaching hours, with a success page and a receipt.
- Purchase records so the app knows what someone has bought, and so paid areas open only for buyers.
- The free intro call books without payment.

Note: paid checkout needs a Lovable Pro plan or higher on this project.

## 3. Coach review dashboard

The review queue exists but is a panel bolted onto the candidate coaching page. Coaches get their own area:

- A dedicated Coaching review page, visible only to coaches and admins.
- Queue with counts: waiting, reviewed by me this week, average wait time.
- Each item shows the person, the exercise, attempt number, the submitted work, the file or link, and the content fingerprint.
- Filters by programme, exercise and oldest-first; a search by person.
- Confirm or return with guidance, with the note required, exactly as today — confirming still writes one assessed evidence entry, returning writes none.
- A history tab of the coach's own past decisions, read-only.
- No new powers: reviewing your own work stays blocked, decisions stay permanent.

## 4. Explainable scoring run

Nothing currently produces capability levels — the capability profile reads a table no code writes, which is why scores look unexplained.

A scoring run will:

- Gather that person's evidence for one capability framework: Experience submissions, coach-confirmed work, attested claims.
- Ask Lovable AI to judge each capability, returning a level, a confidence band, and a written rationale that quotes the specific evidence used.
- Save the run and each judgement as permanent records, tied to the exact evidence entries they cite.
- Show, on the capability profile, the level, the band, the rationale and a list of the evidence behind it — so every number can be traced.
- Never let a run mark anything Verified. Verified stays reserved for outside attestation.
- Refuse to run where evidence is too thin, and say what is missing instead of guessing.

Who can run it: the person themselves (baseline/interim), and coaches or admins (labelled as coach-initiated).

## Technical notes

- Email: Lovable managed sending on a delegated subdomain of deliverx.dev; React Email templates plus a server-only send helper; one send per trigger, called from the existing server functions (`invitations`, `attestations`, `coaching.functions.ts`, `launchpad.functions.ts`). A signed events receiver records bounces/complaints/unsubscribes.
- Payments: `enable_paddle_payments`, then products via `batch_create_product`; a `purchases`/`entitlements` table with owner-scoped RLS and grants, written only by the verified webhook; checkout created in a server function; entitlement checks server-side, never in the browser.
- Coach dashboard: new route `src/routes/_authenticated/workspace.review.tsx` plus queue/history server functions reusing `review_coaching_submission`; role gate via `private.has_role`; the existing coaching page keeps candidate-only content.
- Scoring: `src/lib/scoring.functions.ts` with `requireSupabaseAuth`; reads `evidence_ledger` joined to `artefact_versions`; calls Lovable AI (`openai/gpt-6-astra` on the Responses API, streamed and consumed server-side) with a strict schema of `{ capability_key, level, band, rationale, evidence_ids }`; inserts one `score_runs` row plus immutable `capability_judgements`; `snapshot_claims.verified` logic untouched. Judgements insert through a security-definer RPC so the append-only rails stay intact. Gateway failures surface in the UI per the status contract; 402/403 stop the run.
- Order: email (1) and coach dashboard (3) first — no dependencies beyond the domain step; then scoring (4); then payments (2) once the plan and provider account are in place.
