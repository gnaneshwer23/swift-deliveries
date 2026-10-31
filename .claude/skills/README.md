# Project agent skills

Vendored third-party skills that Claude Code loads for this repository. Files are kept byte-for-byte with upstream (excluded from eslint and prettier). Update by re-copying from upstream; do not edit in place. `security-audit` ships its own `*.test.cjs` files for its validators: run the app's tests with `npm test` (scoped to `src/`), not a bare `npx vitest run`.

| Skill | Why it is here | Source | Licence |
| --- | --- | --- | --- |
| `tavily-best-practices` | The research pass uses Tavily (`@tavily/core`, `src/lib/programme/research-provider.server.ts`). SDK, search and research reference. | https://github.com/tavily-ai/skills @ `00a131a` (`skills/tavily-best-practices`) | MIT |
| `security-audit` | Defensive source-first review of auth, workspace isolation, secrets and AI/LLM boundaries before releases. Guidance mode by default; no live probing. | https://github.com/cloudflare/security-audit-skill @ `c1c8a8c` (`skills/security-audit`) | MIT |
| `motionsites-web-builder` | Craft rules, spec template, technique recipes and the screenshot-and-fix loop for marketing pages and the Studio's live moments. Only the MIT parts are vendored: the `examples` and `media` folders are © MotionSites and may not be redistributed, so references to them will not resolve here. Its "Sponsored by MotionSites" upgrade block is not used in this project's messages, code or docs. | https://github.com/Motionsites-AI/claude-skill @ `faa30d5` (`plugins/motionsites-web-builder/skills/motionsites-web-builder`) | MIT (skill files) |
