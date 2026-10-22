# PSI foundation verification

22 October 2026. Review build, not production readiness certification.

## Implemented

Integrated the existing Neon migration and direct OpenAI provider without rewriting published history. Preserved the homepage composition and replaced its career exit with learning through building. Retired public/authenticated career screens using deliberate redirects; archived superseded specifications and roadmap. Historical schemas and records were not modified.

Setup includes a student/builder role and learning goal, resumes answers within the current browser session, retains the requested product destination through email/password and OAuth entry, and prefills the appropriate mission or programme. The dashboard uses the same goal-to-action rules. Removed the unrestricted credit-reset action and UI.

Auth now checks the configured issuer, expiration and issued-at claims, an algorithm allowlist, and audience when configured. JWKS discovery has a bounded timeout. Provider selection can be explicit, gateway-prefixed direct OpenAI IDs are rejected, and incomplete/refused responses cannot be accepted as model deliverables. Corrective retries revalidate the handoff contract.

Updated Vite and Vitest and compatible transitive dependencies, aligned CI to Node 24 and npm ci, and selected the Vercel Nitro build preset. Generated Vercel build output is excluded from lint.

## Checks performed

- Vitest 4.1.12: 149 passed, 16 skipped; no live-provider calls and no database integration tests.
- TypeScript: passed.
- ESLint: zero errors; 10 existing warnings remain.
- Vercel production-format build: passed with nodejs24.x output.
- npm audit: zero high/critical findings; four moderate findings remain in the drizzle-kit → esbuild development-tool dependency chain. No forced downgrade was applied.
- Local browser: homepage retains its layout; Resources contains product-building starting points; learning CTA reaches signup with the programme redirect preserved; /experience redirects to Resources.
- Supplied public Neon JWKS endpoint responds with an EdDSA key. No real session token was obtained, so issuer/session verification against the live auth service remains pending.
- Preview deployment: https://swift-deliveries-ozztw8a7k-gnaneshwerjadav-gmailcoms-projects.vercel.app
- Vercel reports the preview ready. Browser access requires Vercel sign-in. Authenticated Vercel CLI retrieval confirmed the deployed Resources page renders.

## Not claimed

Signed-in onboarding/dashboard walkthroughs, email recovery, isolation/concurrency tests, live OpenAI smoke tests and production cutover are not complete. The review preview intentionally has no isolated DATABASE_URL configured; no production database credential was copied into it. Model mode is off. Auth Base URL and JWKS are public configuration; keys and credentials are absent from tracked files.

Next: provision an isolated Neon preview branch and matching auth configuration, validate real sessions and reset/verification emails, then exercise the mission loop before merging. Durable workers, atomic programme writes, measured model costs and the Product Brain outcome loop remain later work packages in the production plan.
