# Project agent skills

Vendored third-party skills that Claude Code loads for this repository. Files are kept byte-for-byte with upstream (excluded from eslint and prettier). Update by re-copying from upstream; do not edit in place.

| Skill | Why it is here | Source | Licence |
| --- | --- | --- | --- |
| `tavily-best-practices` | The research pass uses Tavily (`@tavily/core`, `src/lib/programme/research-provider.server.ts`). SDK, search and research reference. | https://github.com/tavily-ai/skills @ `00a131a` (`skills/tavily-best-practices`) | MIT |
| `security-audit` | Defensive source-first review of auth, workspace isolation, secrets and AI/LLM boundaries before releases. Guidance mode by default; no live probing. | https://github.com/cloudflare/security-audit-skill @ `c1c8a8c` (`skills/security-audit`) | MIT |
