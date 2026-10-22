# PSI preview setup

Use Node 24 and the Vercel Nitro preset. Never repoint production while preview verification is incomplete.

## Preview environment

- DATABASE_URL: pooled connection to an isolated Neon preview branch; server-side secret.
- VITE_NEON_AUTH_URL and NEON_AUTH_URL: matching public Auth Base URL for that branch.
- NEON_AUTH_ISSUER: exact issuer configured by Neon Auth; defaults to the Auth Base URL with trailing slash removed. Confirm against the auth configuration before rollout.
- NEON_AUTH_AUDIENCE: expected audience when configured by the auth service. If supplied, mismatches are rejected.
- NEON_AUTH_JWKS_URL: optional explicit JWKS endpoint.
- VITE_AUTH_GOOGLE_ENABLED: enable only after Google is configured for this preview origin.
- DXSI_MODEL_ENABLED: keep false for initial UX verification. True permits billable provider calls.
- DXSI_PROVIDER: openai, vercel-ai-gateway or openrouter. Explicit selection requires that provider's credentials.
- OPENAI_API_KEY: server-side deployment secret only. Never use a VITE_ prefix.
- DXSI_OPENAI_MODEL: direct OpenAI model ID; defaults to DXSI_MODEL or gpt-4.1. Gateway prefixes are rejected.

Vercel preview URLs must be included in Auth trusted origins using the provider's supported configuration. Verify signup, confirmation, recovery, session refresh and sign-out with an authorised test account.

No model key, database credential or auth session belongs in tracked files. The sample variable names above are not a request to share secrets in chat.

## Verification boundaries

Public routes can be reviewed before auth is configured. A successful build cannot establish authenticated readiness. Mocked provider tests make no billable calls. Database integration tests are skipped without DATABASE_URL and must only run against isolated test data. Live-provider smoke tests require a configured secret and explicit test budget.
