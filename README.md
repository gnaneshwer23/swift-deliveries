# DeliverX PSI

DeliverX is an AI product company. Bring an idea or product problem, work with a selected AI team, review decisions and keep the resulting artefacts. Students learn through building in the same product environment.

## Current build

The homepage visual foundation is preserved. `/command` commissions missions; `/command/programmes` runs broader programmes with human gates. `/onboarding` captures the builder's role, goal and first idea, then carries the brief into the appropriate product flow.

Persistence and authentication use Neon PostgreSQL and Neon Auth. Direct OpenAI support is integrated from PR #5. Model mode remains an explicit opt-in, and simulated output is labelled. Signed-in **DeliverX Studio** at `/command` runs the investigation foyer → scope review → approve → canvas → PM briefing → path → export loop on persisted supervised missions (`psi_supervised_missions`); durable `wf_*` worker missions are a separate spine not yet wired to Studio research. Static checks are not production deployment or live-provider certification.

Career-product routes are retirement redirects. Historical specifications live in `docs/archive/career/`; historical database records and migrations are retained. Legacy billing handlers remain for reconciliation and must be audited before removing their configuration.

## Run and verify

Use Node 24 and `npm ci --legacy-peer-deps`, then `npm run dev` (port 43123). Required configuration is documented in `docs/psi-preview-setup.md`.

Checks: `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build`. Live database tests are opt-in and must use isolated test data, never a production connection.

Plan: `docs/psi-production-readiness-plan.md`. This branch is an implementation foundation, not a production certification.
