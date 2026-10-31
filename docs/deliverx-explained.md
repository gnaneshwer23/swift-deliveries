# DeliverX, explained end to end

**What this is:** A complete, plain-language description of DeliverX: the idea, how it should work screen by screen, what is already built in this repository, and what to build next. It is written so another AI assistant (for example ChatGPT with access to this GitHub repository) or a new team member can understand the whole product without the conversation history.

**Written:** 31 October 2026, from the founder's own description, the master vision brief, and an audit of this repository at `main` (`8e6ca46`).

**Read with:** `docs/deliverx-vision-repo-audit.md` (detailed gap audit), `docs/prd-deliverx-supervised-ai-workforce.md` (Stage 1 PRD), `AGENTS.md` (rules every change must follow), `design.md` (design system).

---

## 1. DeliverX in simple words

**DeliverX is an AI product company you can hire with one sentence.**

You type your idea in one or two lines, for example _"an app that helps small restaurants reduce food waste"_. A team of AI specialists, led by an AI product manager called **Aria**, then does what a real product company would do:

1. **Investigates** the idea: market, users, competitors, risks.
2. **Briefs you**: is this a good idea, who else does it, what should the first version be, what will it take (time, cost, technology, team).
3. **Discusses** it with you and goes back to the team when you want more work done.
4. **Builds** it after you say "go ahead", stage by stage, with Aria coming back to update you and ask for your approval at each important step.
5. **Hands you everything** at the end as one downloadable project: documents, designs, prototype, code where in scope, test results, and a full record of which agent did what, how and with which sources.

You stay the decision-maker. The AI team drafts, researches and builds; **you approve**. Nothing external happens without your explicit yes.

**Who it is for:**

- **Founders and non-technical idea owners** who want to turn an idea into a real product plan and first version quickly.
- **Product people** who want a full product team's output (PRD, research, designs, metrics) in days, not months.
- **Students and learners** who learn product building by working _alongside_ the agents and seeing how each role thinks.

---

## 2. The experience, step by step

This is the target experience. Section 9 says what is already built.

### Step 0 — Marketing site (not signed in)

The visitor understands in five seconds: _"Turn a one-line idea into a complete product project, built by an AI product team you supervise."_

- Primary button: **Start with an idea**. Secondary: **See a sample project**.
- See section 6 for every marketing page.

### Step 1 — Sign up and personalised onboarding (about 60 seconds)

Aria greets the user and asks 3–4 quick questions, one per screen, all skippable:

1. **Who are you?** Founder · Product manager · Student / learner · Agency or consultant · Just exploring.
2. **How involved do you want to be?** "Show me everything" · "Key decisions only" · "Teach me as we go".
3. **What do you want at the end?** Validated idea and plan · Clickable prototype · First working version · Learning experience.
4. **Rough budget and time appetite** (optional): helps Aria size the plan.

The answers change:

- how much detail Aria shows;
- whether learning notes appear beside each output;
- the default team size;
- the tone of the updates.

They are stored on the user's profile and can be changed later.

### Step 2 — The idea (one screen, one box)

- One heading: **"What do you want to build?"**
- One text box, and one button: **Start**.
- The founder said the current version of this screen feels too complicated. Everything else is optional and appears _after_ the first sentence, or Aria asks it later:
  - the example idea;
  - the context chips (users, platform, budget, timeline, constraints);
  - voice input.

### Step 3 — Aria asks only what matters (0–3 questions)

Aria reads the idea and asks at most three short questions that change the plan, for example "Who pays: the restaurant owner or the chef?" Every question can be skipped. A skipped question becomes a **labelled assumption** that Aria shows in the briefing.

### Step 4 — Live investigation ("the analysis theatre")

This is the signature moment. The screen comes alive while the agents work:

- The idea sits in the centre. Around it, six workstreams light up:
  - **Market**
  - **Users**
  - **Competition**
  - **Risks**
  - **Opportunities**
  - **Direction**
- Keywords, sources, competitor names and findings **fly in, move around and settle** into the workstream they belong to as agents find them.
- Agent avatars, for example Scout (market) and Rex (competitors), show what each one is doing right now: _"Rex is comparing 6 competitors"_, _"Scout found 3 market reports"_.
- A short status line from Aria: **"Give me about 5 minutes. I'll come back with a briefing."** The user can leave. They get a notification (in-app, optionally email) when the briefing is ready.

**Rule:** every moving element must be **a real event from the background work**: a real search result, a real finding, a real task starting or finishing. The animation dramatises real progress. It never fakes it. If no provider is configured, the screen says so instead of pretending.

### Step 5 — Aria's briefing

Aria "walks in" and explains, like a real PM presenting to a founder. The briefing has these parts, each with sources:

| Part                             | What it says                                                                                                                                                                                             |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **The idea, as I understand it** | One paragraph in plain words                                                                                                                                                                             |
| **Verdict**                      | Promising / Promising with risks / Weak, and _why_                                                                                                                                                       |
| **Who it is for**                | Main user groups and the problem each one has                                                                                                                                                            |
| **Competitors and alternatives** | Named competitors, what they do, where the gap is (with links)                                                                                                                                           |
| **Risks and unknowns**           | What could kill it and what we don't know yet                                                                                                                                                            |
| **Recommended first version**    | The smallest version worth building, and what is left out                                                                                                                                                |
| **2–3 directions**               | Options with trade-offs. Aria recommends one _only_ when the evidence supports it                                                                                                                        |
| **Roadmap**                      | Phases from discovery to launch, with what each phase delivers                                                                                                                                           |
| **Timeline estimate**            | Example: "Plan and prototype: 1–2 days with the AI team; first working version: 1–2 weeks"                                                                                                               |
| **Cost estimate**                | AI running cost of the project (usage units / money range) and, separately, what it would cost to build traditionally, for comparison. These are always estimates with stated assumptions, never a quote |
| **Suggested technology**         | Example: "Web app: React + Postgres; mobile later". With reasons                                                                                                                                         |
| **Proposed team**                | Which specialists are needed for _this_ project (section 3)                                                                                                                                              |

Buttons:

- **Approve and build**
- **Discuss with Aria**
- **Ask for more research**
- **Change direction**
- **Stop here**

Aria can also read the briefing aloud.

### Step 6 — Discussion loop

- The user chats with Aria about _this_ project, for example "Why not a mobile app?", "Is competitor X really a threat?" or "Make it cheaper."
- When the answer needs new work, Aria says **"Let me ask the team. Back in about 5 minutes."** The screen returns to the live view (Step 4) with only the agents involved.
- Aria comes back with an **update**: what each agent did, what changed, and what she now recommends.
- This loop repeats as many times as the user wants. Each round is saved as a version, so nothing is lost.

### Step 7 — "Yes, go ahead": meet your team

When the user approves, Aria comes back with the team for this project and introduces them one by one:

> _"Hi Sam, this is the team building your food-waste app. **Maya** is our user researcher. She'll talk through who your users are and what they need. **Lumen** designs the main workflow…"_

Each team member has a card. Clicking a card opens their **agent workspace**:

- name, role and responsibilities;
- what they will deliver on this project, and when;
- who they hand work to and receive work from;
- their current status.

The user can ask "What exactly does Keystone do?" and Aria explains, in simple words or in depth depending on the onboarding choice.

### Step 8 — Delivery: the team builds in the background

The approved roadmap becomes a real plan of tasks, each owned by an agent. The tasks depend on each other: research → PRD → UX → architecture → prototype → build → test → release pack.

- Agents work in the background. The user does not need to watch.
- At important points (**gates**: scope, design, release) the work stops and Aria asks for the user's approval. Only a human can pass a gate.
- Aria sends **updates** whenever a stage completes, for example _"Lumen finished the main user flow. 3 screens, ready for your review."_ The user can approve, comment or ask for changes.
- Usage ceilings protect the budget: when the agreed limit is reached, work stops and Aria asks before spending more.

### Step 9 — The case dashboard (the project's home)

Covered in section 4. It shows:

- where the project is;
- what is waiting for the user;
- what each agent did;
- the timeline, the evidence, and the package.

### Step 10 — Final package (download)

One click downloads a ZIP that contains:

- **README**: what this project is and how to read the package;
- **briefing and decision log**: every decision, who made it, when, on what evidence;
- **PRD** (product requirements), personas, user journeys, metrics plan;
- **UX**: flows, wireframes, screen designs;
- **architecture**: system design, data model, API outline;
- **prototype** (clickable) and code, where in scope;
- **test plan and test results** (QA);
- **launch checklist** and roadmap for the next versions;
- **team record**: for each agent, their role, tasks, inputs, outputs, sources used, and how each output was produced (model id or simulated draft);
- **`project-manifest.json`**: a machine-readable list of every file, who produced it, and what is simulated.

Everything says how it was made. Nothing claims an outcome that was not observed.

---

## 3. The AI team

### 3.1 How the team is chosen

- Aria proposes the team **per project**, in the briefing:
  - **simple** project (landing page, small tool): 5–7 specialists;
  - **medium** (web app with accounts and data): 10–15;
  - **complex** (marketplace, AI product, payments, compliance): 20+.
- The catalogue in the code has **150 roles in 15 departments** (`src/lib/workforce/registry`).
  - Only roles whose output checks pass are marked _available_: 8 today.
  - The others are _planned_ and never shown as working.
- Each role has written instructions, an output contract (what a good output must contain) and evaluation tests.

### 3.2 The core named team (already used in the Studio screens)

| Name         | Role                | Responsibility                                                              |
| ------------ | ------------------- | --------------------------------------------------------------------------- |
| **Aria**     | AI Product Manager  | Owns the brief, talks to the user, coordinates the team, asks for decisions |
| **Iris**     | Idea Analyst        | Frames the problem and sharpens the one-liner                               |
| **Scout**    | Market Researcher   | Market size, trends, demand signals, with sources                           |
| **Rex**      | Competitor Analyst  | Competitors and alternatives, gaps                                          |
| **Maya**     | User Researcher     | Who the users are, their needs, evidence gaps                               |
| **Atlas**    | Product Strategist  | Options, recommended first version, business model                          |
| **Lumen**    | UX Designer         | User flows and the first workflow                                           |
| **Pixel**    | UI Designer         | Screen layouts and visual design                                            |
| **Keystone** | Technical Architect | Architecture, technology choice, data model                                 |
| **Forge**    | Frontend Engineer   | Builds the user interface                                                   |
| **Relay**    | Backend Engineer    | Services, APIs, data                                                        |
| **Nova**     | QA Engineer         | Test plan, acceptance checks, risks                                         |
| **Harbor**   | Project Coordinator | Sequencing, handoffs, blockers                                              |
| **Quill**    | Documentation Agent | Decision trail, readable exports                                            |

### 3.3 Departments in the catalogue

- Product Management
- Research and Intelligence
- Design and UX
- Software Engineering
- AI and Data Engineering
- QA and Reliability
- Infrastructure and Delivery
- Security, Privacy and Governance
- Product Analytics and Continuous Improvement
- Growth and Marketing
- Sales and Commercial Operations
- Finance, Legal and Governance
- Executive Intelligence
- Future Technology and Foresight
- Agent Operations and Orchestration

To scale the team, give each new role a short human name and a one-line responsibility. **Promote it to available only after its evaluation tests pass.**

### 3.4 How agents work together

- Work is a **graph of tasks** (`src/lib/workforce/graph.ts`). A task runs only when everything upstream is finished and approved, because errors cascade through handoffs.
- Every output must pass its **handoff contract** (`contracts.ts`) before the next agent uses it. Failures are saved and shown, never hidden.
- Important decisions use **deliberation** (`src/lib/programme/deliberation.ts`):
  - agents give independent positions first, then critique;
  - vetoes are hard rules;
  - high-impact decisions go to the human.

---

## 4. Dashboards (signed in)

Principle: **one main question per screen, one main button, and status in words.** The founder's feedback is that the current screens are too complicated, so the redesign direction is _fewer elements, not more_.

### 4.1 Studio home (`/command`)

- Big box: **"What do you want to build?"** (start a new idea).
- **"Waiting for you"**: the 1–3 things that need the user now (approve a brief, review a design, answer a question).
- **Your projects**: one row per idea, showing:
  - name;
  - stage (Investigating / Briefing ready / Building: Design / Done);
  - a one-line latest update from Aria;
  - **Open**.

### 4.2 Case workspace (`/command/supervised/$missionId`)

The home of one project. A left rail with:

| View         | Shows                                                                                    |
| ------------ | ---------------------------------------------------------------------------------------- |
| **Overview** | Stage, Aria's latest update, what is waiting for you, next step                          |
| **Aria**     | The chat with the PM about this project                                                  |
| **Team**     | The team cards, with status from real work                                               |
| **Timeline** | Roadmap phases, owners, dependencies, estimates, and what changed                        |
| **Evidence** | Every source and claim, labelled Source-backed / User-provided / Assumption / Unverified |
| **Package**  | Everything produced so far, with download                                                |
| **Path**     | Brief → Investigation → Briefing → Decide → Build stages                                 |

### 4.3 Agent workspace (opens from a team card)

Tabs:

- **Overview**
- **Tasks**
- **Inputs**
- **Outputs**
- **Evidence**
- **Handoffs**

Every item links to the real record: the task run, the artefact version, the source.

### 4.4 Mission / delivery dashboard

- Stage rail: a stage shows as done **only** when its own output exists.
- Progress uses a stated rule: completed tasks out of total tasks.
- Also shown: active agents, pending gates, recent activity, usage against the ceiling.

---

## 5. Learning experience

DeliverX teaches by building, not by courses.

- **"How this was made" note** beside every output: which agent, what inputs, what method, what a human PM would check.
- **Role explainer**: click any agent and learn what that role does in a real company, with this project as the example.
- **"Teach me as we go" mode** (chosen at onboarding): Aria adds a short lesson at each stage. Example: _"A PRD is… Here is yours. Notice how each requirement has a test."_
- **Resource pages** (public):
  - What is a PRD?
  - How to validate an idea
  - What does a QA engineer do?
  - …each linking to a sample project.
- **Rule:** the career features are retired and must not come back:
  - CV packaging;
  - job applications;
  - coaching dashboards;
  - credentials.

  Learning is about building products. The old material is in `docs/archive/career/`.

---

## 6. Marketing pages

| Page                                 | Purpose                  | Key content                                                                                                                                                                                       |
| ------------------------------------ | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Home** (`/`)                       | Explain in 5 seconds     | Hero _"Turn a one-line idea into a complete product project"_, a 20-second animation of idea → analysis → Aria briefing → team → package, the "you stay in control" promise, and a sample project |
| **How it works** (`/how-it-works`)   | Walk through the 6 steps | Idea → investigation → briefing → decide → team builds → package                                                                                                                                  |
| **The AI team** (`/ai-agents`)       | Meet the agents          | Named roles, what each does, how they hand off work                                                                                                                                               |
| **Sample project**                   | Proof                    | A full example package to browse, clearly labelled Sample                                                                                                                                         |
| **Pricing** (`/pricing`)             | Plans by usage           | Units per project and plan limits (checkout is off today)                                                                                                                                         |
| **Security and trust** (`/security`) | Why it is safe           | Human approvals, no fabricated data, data handling, how each output is labelled                                                                                                                   |
| **Resources** (`/resources`)         | Learning and SEO         | Guides tied to sample outputs                                                                                                                                                                     |

Visual direction: keep the current homepage foundation. Animation must show the real product, not abstract decoration.

---

## 7. Visual and motion direction

- **Design system:** `design.md` and the `.sx` tokens in `src/styles/studio-system.css`:
  - light paper background with deep ink text;
  - an indigo accent, and amber for "waiting for you";
  - fonts: Albert Sans for headings, Inter for body text.
- **Motion is for the live moments only:** investigation, "Aria is coming back", team introduction. Everywhere else stays calm and readable.
- **Motion is driven by events:** each animation corresponds to a real event (search result found, task started or finished, artefact saved).
- **Accessibility:**
  - respect reduced motion;
  - status is always written in words, never colour only;
  - works at phone width.
- **Open question for the founder:** the current screens feel too complicated. The next design pass should cut each screen to one heading, one main panel and one main button, with the rest behind "more".

---

## 8. Principles (non-negotiable)

From `AGENTS.md`:

**Approvals and spending**

1. **AI drafts, humans approve.** External actions never run without an explicit approval. Only humans pass gates.
2. **Approvals are bound to the exact plan version.** If the plan changes, approval is needed again.
3. **Usage ceilings hard-stop spending.**

**Honesty** 4. **Never fabricate**:

- customers, interviews or meetings;
- analytics or test results;
- deployments or citations.

Synthetic interviews are rehearsal only and labelled. 5. **Every output says how it was made** (model id or simulated draft). 6. **Quality labels** are "Agent-reviewed", "Automatically tested", "Human-reviewed" or "Externally attested", never just "Verified".

**Data and privacy** 7. **No personal identifiers sent to models.** No long-lived API keys in the browser. 8. **Database changes are additive**, with rollback plans. Production migrations need the owner's approval.

**Scope** 9. **Out of scope:** books/publishing and regulated healthcare.

---

## 9. What is built today (honest status, 31 Oct 2026)

### 9.1 Stack

- **App:** TanStack Start (React, server functions), TypeScript, Tailwind v4, Vite.
- **Data and auth:** Neon Postgres and Neon Auth.
- **Hosting:** Vercel. The repo is also connected to Lovable.
- **Research:** web search through Tavily, Exa or Brave, when a key is set.
- **Models:** model calls go through `src/lib/workforce/model-runner.server.ts`, with an allowlist and recording. Model mode is **off in production**, so drafts are labelled simulated.
- **Background work:** a durable worker with leases and retries (`worker.server.ts`). The cron runs **every 5 minutes** (Vercel Pro), and an open Room advances the build step by step.

### 9.2 Status by step

| Step                             | Status                                                                                                                                                                              |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Marketing site                   | Built; headline differs from this brief                                                                                                                                             |
| Onboarding                       | Partial; two welcome flows exist, and personalisation is not yet driving the experience                                                                                             |
| Idea entry, clarifying questions | Working; questions are fixed, not chosen by Aria per idea                                                                                                                           |
| Live investigation map           | Working, from real records. It runs one research pass of 3 web searches; the agent names are labels, not running agents; the "flying keywords" theatre is not built                 |
| Aria briefing                    | Working, with sources. Options are drafted by one model call (simulated in production). Missing: a build cost/timeline estimate and a tech recommendation                           |
| Chat with Aria                   | Answers questions about the case from its record (deterministic, PR #72). It does not yet send work back to agents                                                                  |
| Decide, then Begin delivery      | Working. Approval is saved and bound to the version, and Begin delivery creates a real delivery plan in the workforce engine (PR #73)                                               |
| Team and agent workspace         | Built screens. They still show labels, not the delivery engine's real tasks (next: P1-2)                                                                                            |
| Delivery engine (`wf_*`)         | Built: lifecycle charter → research → PRD → UX/architecture → prototype → verify → release pack, with gates, contracts, memory, usage limits. Not yet visible in the Studio screens |
| Case workspace views             | Built (PR #74): Overview, Team, Timeline, Evidence, Package, Aria, Path                                                                                                             |
| Design system                    | Built (PR #74/#75). The founder finds the result still too complicated                                                                                                              |
| Download package                 | Built: README, decisions, roadmap, briefing, team record, evidence, prototype HTML, manifest. Missing: PRD/UX/architecture/test outputs from the delivery engine (next: P1-5)       |
| Notifications ("Aria is back")   | Not built                                                                                                                                                                           |
| Code generation                  | Not built; the prototype is an HTML template                                                                                                                                        |

---

## 10. What to build next (fast path)

The point of this order: make the core loop real (_idea → briefing → yes → team works → updates → package_) before adding more surface.

**Make the core loop real**

1. **Simplify the screens** (design): one heading, one panel and one button per screen. Start with idea entry, the briefing and the case overview.
2. **Team shows real work** (P1-2/P1-3): the team cards, dashboard and timeline read the delivery engine's tasks, runs and outputs.
3. **Faster background work + "Aria is back" updates** (P1-6):
   - run the next task as soon as one finishes, instead of the daily cron;
   - add an in-app update when a stage completes, with optional email later.

**Real content and briefing**

4. **Turn on model mode** (founder decision):
   - needs a provider key, the allowlist and a spend cap;
   - without it, every output stays a labelled simulated draft.
5. **Briefing estimates** (P1-4): build timeline, cost range and tech suggestion, each with stated assumptions.
6. **Full package** (P1-5): add the PRD, UX, architecture, test and release outputs to the ZIP.

**The two signature features**

7. **Analysis theatre**: animate real worker events (findings, tasks) during investigation and during each "back in 5 minutes" loop.
8. **Chat sends work to agents**: "Ask the team" from chat creates a bounded task round, then Aria reports back.

**Reach**

9. **Personalised onboarding** drives detail level, learning notes and team size.
10. **Marketing refresh**: new hero, sample project, the AI team page.

---

## 11. Agent runtime options (including Hermes Agent)

DeliverX should stay the **orchestrator and the system of record**. It decides:

- what task runs;
- who approved it;
- what budget it has;
- what output contract it must meet;
- how the result is labelled.

The agent that does the work can be swapped:

| Option                                             | Good for                                                                                  | Notes                                                                                                                                                                         |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Direct model API calls** (current design)        | Research synthesis, PRD, UX writing, architecture docs                                    | Already wired through `model-runner.server.ts`, with recording and PII screening                                                                                              |
| **Hermes Agent** (Nous Research, open source, MIT) | Long-running tasks that need tools: terminal, files, web, scheduled jobs; reusable skills | Runs as a persistent agent on a server with memory and skills. DeliverX would send it one bounded task at a time and accept the result only if it passes the handoff contract |
| **Coding agents in a sandbox**                     | Generating and testing real code                                                          | Needs an isolated sandbox, time and cost limits, and output review before it is shown as "built"                                                                              |

Whatever runtime is used:

- secrets stay on the server;
- each call is recorded with its model id and cost;
- usage ceilings apply;
- nothing is marked "tested" unless a test actually ran.

---

## 12. Repository map (where to look)

| Area                             | Path                                                                                                                                                                                |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rules for any change             | `AGENTS.md`                                                                                                                                                                         |
| Design system                    | `design.md`, `src/styles/studio-system.css`                                                                                                                                         |
| Studio routes                    | `src/routes/_authenticated/command.*.tsx`                                                                                                                                           |
| Studio case (the user's project) | `src/lib/pilot-mission/*` (stored in `psi_supervised_missions`)                                                                                                                     |
| Studio screens                   | `src/components/command/*` (for example `investigation-stage-shell.tsx`, `product-intelligence-map.tsx`, `investigation-pm-briefing-stage.tsx`, `investigation-team-formation.tsx`) |
| Begin delivery (Studio → engine) | `src/lib/pilot-mission/delivery.ts`, `delivery.server.ts`                                                                                                                           |
| Delivery engine                  | `src/lib/workforce/*` (`lifecycle.ts`, `graph.ts`, `worker.server.ts`, `contracts.ts`, `stage-artefacts.ts`)                                                                        |
| Agent catalogue                  | `src/lib/workforce/registry/`                                                                                                                                                       |
| Chat / voice                     | `src/lib/conversation/*`, `src/lib/pilot-mission/case-questions.ts`                                                                                                                 |
| Export package                   | `src/lib/pilot-mission/supervised-zip.ts`                                                                                                                                           |
| Marketing pages                  | `src/routes/index.tsx`, `how-it-works.tsx`, `ai-agents.tsx`, `pricing.tsx`, `security.tsx`, `resources.*.tsx`                                                                       |
| Database migrations              | `drizzle/migrations/` with `docs/migrations-and-rollback.md`                                                                                                                        |
| Gap audit                        | `docs/deliverx-vision-repo-audit.md`                                                                                                                                                |

---

## 13. Prompt to give ChatGPT

> I'm building **DeliverX**, an AI product company that turns a one-line product idea into a complete, supervised product project. The repository is `gnaneshwer23/swift-deliveries` on GitHub. Start by reading `docs/deliverx-explained.md` (the full explanation), then `AGENTS.md` (rules), `docs/deliverx-vision-repo-audit.md` (what is built vs missing) and `design.md` (design system).
>
> Then help me with: **[your task, e.g. "design the simplified idea-entry and briefing screens", "write the marketing home page copy", "plan the analysis-theatre animation driven by real worker events"]**.
>
> Constraints: keep the rules in `AGENTS.md` (humans approve, never fabricate data, every output says how it was made). Tell me what is already in the code before proposing new code, and point to file paths.
