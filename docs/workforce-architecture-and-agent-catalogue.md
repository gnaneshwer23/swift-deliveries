# DeliverX Workforce Architecture and Agent Catalogue Specification

**Version:** 1.0  
**Status:** Proposed implementation baseline  
**Product:** DeliverX — Supervised AI Workforce Platform  
**Catalogue:** 150 specialist roles across 15 departments  
**Architecture principle:** Shared execution infrastructure, capability-based orchestration, evidence-backed delivery and controlled activation.

---

# Part 1. The Workforce Operating Model

## 1.1 What DeliverX is building

DeliverX is not simply an application containing 150 chatbots. It is a system that receives a user's objective, identifies the work required, assembles the appropriate capabilities, executes authorised tasks, evaluates the resulting work and presents a transparent outcome.

The operating model has five layers:

1. **Command layer:** Understands the user, establishes the objective and manages the mission.
2. **Department layer:** Coordinates related specialist capabilities.
3. **Execution layer:** Performs bounded tasks using models, tools and deterministic services.
4. **Quality and evidence layer:** Checks the work against requirements and available evidence.
5. **Governance layer:** Enforces permissions, budgets, isolation, approvals and auditability across every layer.

The governance layer must operate across the entire architecture, not merely as a final review step.

## 1.2 Four types of workforce capability

Not every role should be implemented as an autonomous AI agent.

| Implementation type | Description | Example |
|---|---|---|
| Deterministic service | Executes predictable logic in application code | Budget enforcement |
| Model workflow | Uses a model for a bounded transformation | Classifying a product request |
| Tool-using specialist | Uses a model and authorised tools to complete a task | Competitive research |
| Coordinated agent workflow | Uses several bounded tasks with dependencies and shared state | Building and testing a prototype |

The catalogue defines the responsibility and expected outcome. Engineering determines the safest and most efficient implementation type for each capability.

## 1.3 Standard agent contract

Every role must use a common contract.

**Identity**
- Unique capability ID.
- Role name and department.
- Version and lifecycle status.
- Owner and implementation type.

**Inputs**
- Task objective.
- Relevant project context.
- Required source material or data.
- Constraints and acceptance criteria.
- Permitted tools and execution limits.

**Outputs**
- Structured result.
- Deliverable or artefact references.
- Evidence references.
- Assumptions and limitations.
- Status, errors and unresolved questions.
- Usage and execution metadata.

**Controls**
- Explicit permission scope.
- Runtime and usage limits.
- Allowed data sources and destinations.
- Retry policy.
- Escalation rules.
- Applicable evaluation suite.

**Lifecycle statuses**

`Draft → Implementing → Testing → Available → Suspended → Retired`

A role must not be selectable for customer missions until its implementation, permissions, evaluations and supported workflows meet the applicable release criteria.

---

# Part 2. The Complete 150-Role Catalogue

The following catalogue defines each role's primary responsibility and expected deliverable. Detailed tool permissions, schemas and test cases should be maintained in the versioned capability registry.

## Department 01 — Executive Intelligence

**Purpose:** Turn broad objectives into prioritised, coordinated work.

| ID | Role | Responsibility and expected output |
|---|---|---|
| DX-001 | Chief of Staff Agent | Coordinates the mission, maintains the executive summary and surfaces blockers and decisions requiring user attention. |
| DX-002 | Problem-Framing Agent | Converts vague requests into a problem statement, desired outcome, constraints and unresolved questions. |
| DX-003 | Strategic Planning Agent | Develops strategic options, trade-offs, assumptions and recommended direction. |
| DX-004 | Decision Intelligence Agent | Structures alternatives, evaluation criteria and decision rationale into a decision record. |
| DX-005 | Project Portfolio Agent | Organises multiple projects, dependencies, priorities and portfolio-level status. |
| DX-006 | Prioritisation Agent | Ranks work against agreed value, effort, risk and urgency criteria. |
| DX-007 | Risk Assessment Agent | Identifies material delivery, commercial, operational and technical risks with proposed mitigations. |
| DX-008 | Resource Allocation Agent | Recommends appropriate capabilities, budgets and execution capacity for planned work. |
| DX-009 | Stakeholder Alignment Agent | Identifies stakeholder interests, conflicting requirements and decisions needing alignment. |
| DX-010 | Executive Reporting Agent | Produces concise status reports, decisions, risks, milestones and outstanding actions. |

## Department 02 — Research and Intelligence

**Purpose:** Acquire, organise and assess information relevant to user decisions.

| ID | Role | Responsibility and expected output |
|---|---|---|
| DX-011 | Research Planning Agent | Defines research questions, methods, scope, source requirements and completion criteria. |
| DX-012 | Web Research Agent | Collects relevant online material and returns source-linked findings. |
| DX-013 | Literature Review Agent | Synthesises academic and technical literature with citations and identified evidence gaps. |
| DX-014 | Competitive Intelligence Agent | Compares competitors' documented offerings, positioning, features and publicly available evidence. |
| DX-015 | Market Research Agent | Investigates market segments, trends, demand indicators and available market evidence. |
| DX-016 | Customer Insights Agent | Synthesises supplied interviews, surveys, feedback and behavioural evidence without inventing customer input. |
| DX-017 | Data Collection Agent | Collects authorised data, validates its structure and documents provenance and missing values. |
| DX-018 | Evidence Verification Agent | Checks whether evidence is authentic, relevant, sufficiently current and suitable for the intended claim. |
| DX-019 | Fact-Checking Agent | Identifies material factual claims and checks them against available reliable sources. |
| DX-020 | Research Synthesis Agent | Combines findings into a structured report, separating facts, interpretations and assumptions. |

## Department 03 — Product Management

**Purpose:** Translate user problems and business objectives into clear product decisions and specifications.

| ID | Role | Responsibility and expected output |
|---|---|---|
| DX-021 | Product Discovery Agent | Identifies user problems, hypotheses, discovery questions and validation opportunities. |
| DX-022 | Product Strategy Agent | Develops product positioning, target users, value propositions and strategic choices. |
| DX-023 | PRD Agent | Produces structured product requirements, scope, constraints and release criteria. |
| DX-024 | Requirements Engineering Agent | Converts stakeholder needs into traceable functional and non-functional requirements. |
| DX-025 | Roadmap Planning Agent | Creates dependency-aware product roadmaps with milestones and assumptions. |
| DX-026 | Product Prioritisation Agent | Compares feature opportunities using explicit prioritisation criteria. |
| DX-027 | User Story Agent | Writes user stories with actors, objectives, context and expected outcomes. |
| DX-028 | Acceptance Criteria Agent | Defines observable conditions for determining whether requirements are satisfied. |
| DX-029 | Product Analytics Agent | Defines product metrics and analyses supplied product usage data. |
| DX-030 | Product Launch Planning Agent | Produces launch plans, readiness criteria, stakeholder responsibilities and follow-up metrics. |

## Department 04 — Design and UX

**Purpose:** Create usable, accessible and coherent product experiences.

| ID | Role | Responsibility and expected output |
|---|---|---|
| DX-031 | UX Research Agent | Plans and synthesises user research based on genuine observations and supplied evidence. |
| DX-032 | User Journey Agent | Maps user goals, actions, touchpoints, friction and potential improvements. |
| DX-033 | Information Architecture Agent | Structures navigation, content hierarchy and information relationships. |
| DX-034 | UX Writing Agent | Produces interface copy, instructions, labels, errors and onboarding text. |
| DX-035 | Wireframing Agent | Creates wireframes or implementation-ready layout specifications. |
| DX-036 | UI Design Agent | Defines screen layouts, visual hierarchy, components and interaction states. |
| DX-037 | Design System Agent | Defines reusable design tokens, components, variants and usage rules. |
| DX-038 | Accessibility Agent | Identifies accessibility barriers and recommends improvements against defined standards. |
| DX-039 | Usability Evaluation Agent | Evaluates observed usability evidence or performs clearly labelled heuristic reviews. |
| DX-040 | Design QA Agent | Checks visual and interaction consistency against approved designs and requirements. |

## Department 05 — Software Engineering

**Purpose:** Implement, modify, review and document software within authorised environments.

| ID | Role | Responsibility and expected output |
|---|---|---|
| DX-041 | Software Architect Agent | Produces architecture decisions, component boundaries, dependencies and trade-offs. |
| DX-042 | Frontend Engineering Agent | Implements client-side interfaces and interaction behaviour. |
| DX-043 | Backend Engineering Agent | Implements server-side business logic, APIs and application services. |
| DX-044 | Full-Stack Engineering Agent | Implements coordinated frontend and backend changes for bounded features. |
| DX-045 | API Engineering Agent | Designs and implements API contracts, validation, errors and compatibility behaviour. |
| DX-046 | Database Engineering Agent | Designs schemas, queries, indexes, migrations and integrity constraints. |
| DX-047 | Integration Engineering Agent | Connects approved external services and validates integration behaviour. |
| DX-048 | Code Refactoring Agent | Improves code structure while preserving required behaviour and passing regression checks. |
| DX-049 | Code Review Agent | Reviews changes for correctness, maintainability, security concerns and requirement coverage. |
| DX-050 | Technical Documentation Agent | Documents architecture, APIs, setup, operational procedures and implementation decisions. |

## Department 06 — AI and Data Engineering

**Purpose:** Build and evaluate AI capabilities, data pipelines and knowledge systems.

| ID | Role | Responsibility and expected output |
|---|---|---|
| DX-051 | AI Solution Architect Agent | Defines AI system architecture, model choices, dependencies and evaluation strategy. |
| DX-052 | LLM Engineering Agent | Implements bounded LLM workflows, structured generation and model integrations. |
| DX-053 | RAG Engineering Agent | Implements retrieval-augmented generation with source retrieval and citation traceability. |
| DX-054 | AI Agent Engineering Agent | Implements tool-using agent workflows, state handling and bounded delegation. |
| DX-055 | Data Engineering Agent | Designs data pipelines, transformations, validation and lineage. |
| DX-056 | Data Analytics Agent | Analyses authorised datasets and produces reproducible summaries or visualisations. |
| DX-057 | Machine Learning Agent | Develops and evaluates suitable predictive or classification models when justified by data. |
| DX-058 | Model Evaluation Agent | Runs defined model evaluations and reports performance, limitations and regressions. |
| DX-059 | Knowledge Graph Agent | Structures entities and relationships with provenance and schema validation. |
| DX-060 | AI Optimisation Agent | Investigates latency, quality and cost trade-offs using measured results. |

## Department 07 — Security, Privacy and Governance

**Purpose:** Identify and mitigate security and governance risks across DeliverX and its outputs.

| ID | Role | Responsibility and expected output |
|---|---|---|
| DX-061 | Security Architecture Agent | Reviews trust boundaries, security architecture and defence-in-depth requirements. |
| DX-062 | Threat Modelling Agent | Produces threat models, attack scenarios and proposed mitigations. |
| DX-063 | Application Security Agent | Reviews application code and configuration for security weaknesses. |
| DX-064 | Vulnerability Assessment Agent | Performs authorised vulnerability checks and reports reproducible findings. |
| DX-065 | Privacy Engineering Agent | Reviews data flows, minimisation, retention and privacy control requirements. |
| DX-066 | Identity and Access Agent | Reviews authentication, authorisation, roles and permission boundaries. |
| DX-067 | AI Safety Agent | Assesses model behaviour, misuse risks, prompt injection and failure modes. |
| DX-068 | Compliance Mapping Agent | Maps supplied requirements to relevant controls and identifies gaps requiring expert review. |
| DX-069 | Incident Response Agent | Organises incident evidence, containment steps and recovery actions under authorised procedures. |
| DX-070 | Security Review Agent | Consolidates security findings and determines whether release criteria have been met. |

## Department 08 — QA and Reliability

**Purpose:** Verify that deliverables meet defined requirements and that failures are reported honestly.

| ID | Role | Responsibility and expected output |
|---|---|---|
| DX-071 | Test Strategy Agent | Defines test scope, risk coverage, test levels and exit criteria. |
| DX-072 | Unit Testing Agent | Creates or executes unit tests for defined software behaviour. |
| DX-073 | Integration Testing Agent | Tests interactions between services, databases and integrations. |
| DX-074 | End-to-End Testing Agent | Validates complete user journeys against agreed expected outcomes. |
| DX-075 | Regression Testing Agent | Detects unintended changes to previously supported behaviour. |
| DX-076 | Performance Testing Agent | Measures performance against defined workloads and thresholds. |
| DX-077 | Accessibility Testing Agent | Executes available automated and manual accessibility checks. |
| DX-078 | AI Evaluation Agent | Evaluates AI outputs against labelled datasets, rubrics and task-specific acceptance tests. |
| DX-079 | Defect Triage Agent | Groups failures, assesses severity and proposes reproducible defect records. |
| DX-080 | Release Readiness Agent | Consolidates test evidence, unresolved defects, risks and release-gate status. |

## Department 09 — Infrastructure and Delivery

**Purpose:** Operate and deliver software systems safely and reliably.

| ID | Role | Responsibility and expected output |
|---|---|---|
| DX-081 | Cloud Architecture Agent | Designs cloud resources, trust boundaries and deployment topology. |
| DX-082 | DevOps Agent | Defines development-to-operations workflows and automation. |
| DX-083 | CI/CD Agent | Implements and maintains build, test and deployment pipelines. |
| DX-084 | Infrastructure-as-Code Agent | Produces reviewable infrastructure definitions and configuration changes. |
| DX-085 | Database Operations Agent | Supports database operations, migration execution and recovery procedures. |
| DX-086 | Observability Agent | Defines logs, metrics, traces, dashboards and alerts. |
| DX-087 | Reliability Engineering Agent | Assesses service reliability, failure handling and operational readiness. |
| DX-088 | Deployment Agent | Prepares and executes authorised deployments with explicit release gates. |
| DX-089 | Disaster Recovery Agent | Defines recovery procedures and evaluates backup and restoration readiness. |
| DX-090 | Cost Optimisation Agent | Identifies infrastructure cost drivers and proposes measured optimisations. |

## Department 10 — Healthcare and Life Sciences

**Purpose:** Support biomedical research, healthcare software and scientific workflows with evidence and appropriate boundaries.

| ID | Role | Responsibility and expected output |
|---|---|---|
| DX-091 | Clinical Literature Agent | Retrieves and summarises relevant clinical literature with source references. |
| DX-092 | Biomedical Research Agent | Supports biomedical research questions, experimental rationale and evidence synthesis. |
| DX-093 | Clinical Data Analysis Agent | Analyses authorised clinical or research datasets with appropriate statistical caveats. |
| DX-094 | Healthcare Workflow Agent | Maps healthcare processes, operational bottlenecks and workflow requirements. |
| DX-095 | Clinical Documentation Agent | Drafts or structures clinical documentation from authorised inputs for human review. |
| DX-096 | Health Informatics Agent | Supports health data models, interoperability and health information workflows. |
| DX-097 | Biomedical Knowledge Graph Agent | Represents biomedical entities and relationships with evidence provenance. |
| DX-098 | Scientific Evidence Appraisal Agent | Evaluates study design, evidence strength, limitations and potential bias. |
| DX-099 | Healthcare Privacy Agent | Reviews healthcare data flows and privacy safeguards against specified requirements. |
| DX-100 | Clinical Safety Review Agent | Identifies potential clinical safety hazards and required escalation or review. |

These roles support research and healthcare technology work. They do not replace qualified clinicians or authorise autonomous high-stakes clinical decisions.

## Department 11 — Growth and Marketing

**Purpose:** Develop and evaluate customer acquisition, positioning and growth activities.

| ID | Role | Responsibility and expected output |
|---|---|---|
| DX-101 | Positioning Agent | Defines target audiences, value propositions, differentiation and messaging hypotheses. |
| DX-102 | Brand Strategy Agent | Develops brand architecture, identity principles and communication guidelines. |
| DX-103 | Content Strategy Agent | Creates content themes, editorial plans and distribution priorities. |
| DX-104 | SEO Agent | Audits discoverability and proposes search optimisation improvements. |
| DX-105 | Social Media Agent | Produces channel-specific content and publishing recommendations. |
| DX-106 | Campaign Planning Agent | Defines campaign objectives, audiences, assets, schedules and measures. |
| DX-107 | Conversion Optimisation Agent | Identifies and prioritises conversion improvements using available evidence. |
| DX-108 | Growth Experimentation Agent | Designs experiments with hypotheses, success metrics and stopping rules. |
| DX-109 | Marketing Analytics Agent | Analyses authorised campaign and funnel data. |
| DX-110 | Marketing Automation Agent | Designs and configures approved marketing automation workflows. |

## Department 12 — Sales and Commercial Operations

**Purpose:** Support prospect research, sales preparation, customer relationships and commercial operations.

| ID | Role | Responsibility and expected output |
|---|---|---|
| DX-111 | Lead Research Agent | Identifies potential prospects from permitted sources and records provenance. |
| DX-112 | Lead Qualification Agent | Evaluates prospects against explicit qualification criteria. |
| DX-113 | Account Intelligence Agent | Summarises relevant, appropriately sourced account information. |
| DX-114 | Sales Strategy Agent | Develops sales approaches, qualification plans and opportunity strategies. |
| DX-115 | Proposal Writing Agent | Drafts proposals from approved scope, pricing and customer requirements. |
| DX-116 | RFP Response Agent | Maps requests for proposal to documented capabilities, evidence and gaps. |
| DX-117 | CRM Operations Agent | Updates authorised CRM records and validates data quality. |
| DX-118 | Sales Forecasting Agent | Analyses supplied pipeline data and documents forecasting assumptions. |
| DX-119 | Customer Success Agent | Organises onboarding, adoption, feedback and renewal support. |
| DX-120 | Partnership Development Agent | Researches partnership opportunities and drafts proposals or outreach for approval. |

## Department 13 — Books, Education and Publishing

**Purpose:** Produce structured educational, editorial and publishing deliverables.

| ID | Role | Responsibility and expected output |
|---|---|---|
| DX-121 | Book Research Agent | Collects source material and creates a traceable research pack. |
| DX-122 | Book Architecture Agent | Designs book structure, chapter sequence, audience and learning objectives. |
| DX-123 | Long-Form Writing Agent | Drafts chapters or long-form content against a defined brief. |
| DX-124 | Editorial Review Agent | Reviews structure, consistency, clarity, tone and repetition. |
| DX-125 | Citation and Reference Agent | Validates bibliographic details and citation consistency against available sources. |
| DX-126 | Curriculum Design Agent | Structures learning programmes, modules, objectives and progression. |
| DX-127 | Instructional Design Agent | Designs learning experiences, practice activities and assessment alignment. |
| DX-128 | Assessment Creation Agent | Creates questions, rubrics and answer criteria for a specified learning objective. |
| DX-129 | Course Production Agent | Organises scripts, lesson assets, production instructions and course materials. |
| DX-130 | Publishing Operations Agent | Prepares publishing checklists, metadata and production files for review. |

## Department 14 — Finance, Legal and Governance

**Purpose:** Support financial planning, commercial decisions, documentation and governance.

| ID | Role | Responsibility and expected output |
|---|---|---|
| DX-131 | Financial Modelling Agent | Builds transparent financial models from specified assumptions and supplied data. |
| DX-132 | Budget Planning Agent | Creates budgets, scenarios, allocations and variance reports. |
| DX-133 | Unit Economics Agent | Calculates unit economics and identifies key drivers of contribution margin. |
| DX-134 | Pricing Strategy Agent | Evaluates pricing options and produces testable pricing hypotheses. |
| DX-135 | Business Model Agent | Structures customer value, revenue streams, costs and business model assumptions. |
| DX-136 | Contract Review Support Agent | Summarises contract clauses, obligations and questions for qualified legal review. |
| DX-137 | Regulatory Research Agent | Researches relevant regulatory requirements and records authoritative sources and uncertainty. |
| DX-138 | Risk and Controls Agent | Maps risks to proposed controls, owners and evidence requirements. |
| DX-139 | Procurement Support Agent | Compares supplied vendor information and prepares procurement assessments. |
| DX-140 | Governance Documentation Agent | Drafts policies, decision records, control descriptions and governance documentation. |

These roles provide decision support, not a substitute for professional legal, tax, financial or regulatory advice where required.

## Department 15 — Agent Operations and Orchestration

**Purpose:** Manage capability selection, mission coordination, execution state and workforce performance.

| ID | Role | Responsibility and expected output |
|---|---|---|
| DX-141 | Intent Routing Agent | Classifies the request and routes it to a supported mission workflow. |
| DX-142 | Mission Planning Agent | Produces the execution plan, deliverables, task dependencies and proposed team. |
| DX-143 | Task Decomposition Agent | Breaks approved work into bounded, testable tasks. |
| DX-144 | Capability Matching Agent | Matches tasks to registered capabilities, tools and evaluation history. |
| DX-145 | Context Management Agent | Selects relevant project context and prepares task-specific context packages. |
| DX-146 | Dependency Coordination Agent | Identifies prerequisites and coordinates execution order and parallel work. |
| DX-147 | Conflict Resolution Agent | Detects incompatible outputs or decisions and presents options for resolution. |
| DX-148 | Execution Monitoring Agent | Detects stalled tasks, repeated failures and unexpected status transitions. |
| DX-149 | Cost and Budget Control Agent | Forecasts usage and recommends cost-aware execution plans within enforced limits. |
| DX-150 | Workforce Evaluation Agent | Analyses capability performance using measured outcomes, evaluations and customer feedback. |

**Important implementation rule:** DX-148 and DX-149 can provide recommendations and monitoring, but cancellation, permission enforcement and spending ceilings must be enforced by deterministic application services. An AI agent must not be the sole mechanism protecting a budget or security boundary.

---

# Part 3. Shared Execution Infrastructure

The workforce should share one execution platform. Do not create a separate backend, database or permission system for every agent.

## 3.1 Core infrastructure components

| Component | Responsibility | Must be implemented as |
|---|---|---|
| Identity and workspace service | Authentication, membership and workspace isolation | Deterministic application service |
| Mission service | Mission lifecycle, plans and acceptance criteria | Deterministic application service |
| Capability registry | Role definitions, versions, tools and evaluation status | Versioned application service |
| Planner | Proposes task graphs and capability assignments | Model-assisted planning with schema validation |
| Orchestrator | Schedules tasks, enforces dependencies and manages retries | Deterministic workflow engine |
| Agent runtime | Executes bounded model and tool workflows | Controlled execution service |
| Tool gateway | Validates tool permissions and arguments | Policy-enforcing application service |
| Sandbox manager | Isolates code and potentially unsafe execution | Isolated runtime infrastructure |
| Context service | Retrieves relevant project context and source references | Retrieval service with access checks |
| Artefact service | Stores, versions and exposes deliverables | Private object storage plus metadata |
| Evidence service | Records sources, claims and supporting references | Structured evidence store |
| Evaluation service | Runs task-specific checks and records results | Deterministic checks plus bounded evaluators |
| Usage service | Records consumption and applies hard ceilings | Deterministic metering and enforcement |
| Approval service | Records user decisions and validates authorisation | Authenticated application service |
| Audit service | Records important events and state changes | Durable event logging |
| Observability service | Monitors latency, failures and operational health | Metrics, logs and traces |

## 3.2 Mission execution lifecycle

Every mission must follow a consistent lifecycle:

1. **Intake:** Capture the user's objective and constraints.
2. **Assessment:** Identify missing information, risk and supported capabilities.
3. **Planning:** Generate tasks, dependencies, deliverables and acceptance criteria.
4. **Estimation:** Estimate usage and establish a hard spending ceiling.
5. **Approval:** Obtain user approval of the plan and relevant permissions.
6. **Execution:** Run authorised tasks through the orchestrator.
7. **Intermediate evaluation:** Check task outputs and resolve failures.
8. **Integration:** Combine outputs into coherent deliverables.
9. **Final evaluation:** Check requirements, evidence, limitations and test results.
10. **Delivery:** Present outputs, actual execution status, usage and outstanding work.
11. **Feedback:** Record customer acceptance, revisions and measured outcomes.

Long-running work must remain recoverable after browser refreshes or worker restarts.

## 3.3 Execution state machine

Mission and task statuses must be enforced by code, not merely generated by an agent.

`Draft → Planned → Awaiting Approval → Queued → Running → Reviewing → Completed`

Additional states include:

- Needs clarification
- Blocked
- Failed
- Cancelled
- Partially completed

Each transition must have defined preconditions, authorised actors and audit events.

## 3.4 Tool execution contract

Every tool invocation must pass through a controlled gateway.

The gateway must validate:

- The calling workspace and mission.
- The identity of the invoking capability.
- The permitted tool and operation.
- The specific resource or destination.
- The active approval or permission grant.
- The task's budget and execution limits.
- Input schema and argument validity.
- Whether the operation is safe to retry.
- The result, error and audit record.

Agents must never be allowed to bypass this gateway with unrestricted credentials.

## 3.5 Recommended persistence model

The core database should store:

- Users and workspace memberships.
- Projects and approved project context.
- Missions and versioned plans.
- Capability and agent definitions.
- Tasks, dependencies and execution attempts.
- Tool permissions and approvals.
- Artefact metadata and versions.
- Evidence references and evaluations.
- Usage records and subscriptions.
- Audit events and customer feedback.

Large artefacts should generally reside in private object storage rather than being embedded in ordinary database rows.

---

# Part 4. Shared Evaluation Infrastructure

DeliverX must evaluate both individual capabilities and complete missions.

## 4.1 Four levels of evaluation

**Level 1 — Contract validation**

Does the output conform to the required schema? Are required fields present? Are identifiers and references valid?

**Level 2 — Task evaluation**

Does the output meet the specific task requirements? Are citations present? Did the code compile? Did the calculation reproduce? Did the requested document get created?

**Level 3 — Workflow evaluation**

Did the handoffs work? Were dependencies respected? Did the assembled deliverable satisfy the approved plan?

**Level 4 — Customer outcome evaluation**

Was the deliverable useful? Did the customer accept it? How much revision was required? Would the customer use the workflow again?

Passing one level does not automatically imply passing the others.

## 4.2 Evaluation methods

Use the strongest suitable method for each requirement:

1. Deterministic tests for permissions, schemas, calculations and state transitions.
2. Automated tool-based checks for code, links, files and configuration.
3. Source verification for factual claims.
4. Rubric-based model evaluation for qualitative work, calibrated against human-reviewed examples.
5. Human review for high-impact or ambiguous decisions.
6. Customer acceptance to measure practical usefulness.

AI-generated self-assessments may be recorded, but must not be treated as independent proof.

## 4.3 Quality labels

DeliverX must distinguish:

- **Generated:** An output was produced.
- **Agent-reviewed:** An AI review was completed.
- **Automatically tested:** Defined automated checks were executed.
- **Human-reviewed:** A person reviewed the work.
- **Externally attested:** An appropriate external party provided attestation.

These labels must correspond to actual recorded events. The platform must not display a stronger label than the evidence supports.

## 4.4 Capability evaluation record

Each capability version must have:

- Defined supported tasks.
- A representative evaluation dataset.
- Positive and negative test cases.
- Output-schema tests.
- Permission and tool-use tests.
- Failure and timeout tests.
- Cost and latency measurements.
- Quality results.
- Known limitations.
- Approval status and evaluation date.

Changes to prompts, models, tools or configuration that could materially affect behaviour must trigger appropriate regression testing.

---

# Part 5. Activation Strategy

The registry can contain all 150 roles from the beginning. Their operational status must reflect what has actually been built and tested.

## Wave 0 — Shared infrastructure

**Build first**

- Identity and workspace isolation.
- Mission and task state machine.
- Capability registry.
- Orchestrator and durable execution state.
- Tool gateway and permissions.
- Budget enforcement.
- Artefact and evidence storage.
- Evaluation and audit services.

**Exit gate:** The system can execute a small, controlled test mission, preserve state, enforce limits and report the outcome accurately.

## Wave 1 — Core product workforce

Activate these 12 initial capabilities:

- DX-001 Chief of Staff
- DX-002 Problem Framing
- DX-011 Research Planning
- DX-012 Web Research
- DX-018 Evidence Verification
- DX-020 Research Synthesis
- DX-021 Product Discovery
- DX-023 PRD
- DX-035 Wireframing
- DX-041 Software Architect
- DX-049 Code Review
- DX-071 Test Strategy

Also implement deterministic services for task scheduling, budget enforcement, permissions, artefact management and audit logging.

**Exit gate:** A bounded research or product-definition mission can complete with traceable evidence, visible failures and an accurate delivery report.

## Wave 2 — Prototype delivery

Prioritise:

- DX-027 User Story
- DX-028 Acceptance Criteria
- DX-036 UI Design
- DX-042 Frontend Engineering
- DX-043 Backend Engineering
- DX-045 API Engineering
- DX-046 Database Engineering
- DX-048 Code Refactoring
- DX-072 Unit Testing
- DX-073 Integration Testing
- DX-074 End-to-End Testing
- DX-078 AI Evaluation

**Exit gate:** A user-approved brief can produce an inspectable prototype with recorded tests, known limitations and no unauthorised external action.

## Wave 3 — Reliability, security and operations

Prioritise:

- DX-050 Technical Documentation
- DX-061 Security Architecture
- DX-062 Threat Modelling
- DX-066 Identity and Access
- DX-067 AI Safety
- DX-075 Regression Testing
- DX-079 Defect Triage
- DX-080 Release Readiness
- DX-086 Observability
- DX-087 Reliability Engineering
- DX-148 Execution Monitoring
- DX-150 Workforce Evaluation

**Exit gate:** The platform demonstrates acceptable failure recovery, security boundaries, cost control and repeatable workflow evaluation.

## Wave 4 — Commercial workflows

Activate selected capabilities from:

- Growth and Marketing.
- Sales and Commercial Operations.
- Finance and Business Models.
- Books, Education and Publishing.

Prioritise based on observed demand from pilot customers.

**Exit gate:** Each advertised workflow has documented inputs, outputs, permissions, evaluation results and sustainable delivery economics.

## Wave 5 — Specialist expansion

Expand into healthcare, advanced AI engineering, enterprise operations and additional domains where customer demand justifies investment.

Specialist workflows must have domain-specific acceptance tests and governance. Healthcare, legal, financial and other high-impact work must have suitable professional oversight and risk controls.

**Exit gate:** The new capability has passed its domain-specific evaluation, security review and operational readiness checks.

---

# Part 6. Capability Registry and Versioning

Every role should be stored as a structured, version-controlled record rather than an informal list.

Minimum registry fields:

| Field | Purpose |
|---|---|
| `capability_id` | Stable identifier such as DX-041 |
| `name` | Human-readable role name |
| `department` | Organisational category |
| `description` | Responsibility and boundaries |
| `implementation_type` | Service, model workflow, tool-using agent or coordinated workflow |
| `input_schema` | Accepted inputs and validation rules |
| `output_schema` | Expected outputs |
| `tool_allowlist` | Permitted integrations and operations |
| `permission_profile` | Required access scope |
| `dependencies` | Required capabilities and services |
| `evaluation_suite` | Tests and evaluation criteria |
| `version` | Configuration and implementation version |
| `lifecycle_status` | Draft, testing, available, suspended or retired |
| `limits` | Runtime, retries, concurrency and usage |
| `performance_history` | Measured quality, cost and reliability |
| `owner` | Accountable maintainer |
| `last_evaluated_at` | Most recent successful evaluation date |

Only capabilities in the approved available state may be routed to production missions.

## Capability matching rules

The routing engine should consider:

1. Whether the task falls within the capability's documented scope.
2. Whether required inputs and tools are available.
3. Whether the permission profile is sufficient.
4. Whether dependencies are satisfied.
5. Whether evaluation evidence supports using that capability.
6. Expected quality, cost, latency and failure risk.
7. Whether a simpler deterministic workflow is preferable.

If no capability meets the minimum requirements, DeliverX should ask for missing inputs, offer a bounded alternative or explain that it cannot complete the task.

---

# Part 7. Performance and Governance

## Workforce metrics

Measure performance at both role and mission level.

**Capability metrics**
- Task success rate.
- Acceptance rate.
- Material error rate.
- Rework required.
- Cost per accepted output.
- Latency and timeout rate.
- Evaluation regression rate.

**Mission metrics**
- Time to useful deliverable.
- First-pass acceptance.
- Total cost per accepted mission.
- Partial completion and failure rates.
- Human intervention time.
- Budget adherence.
- Repeat customer usage.

**Governance metrics**
- Permission violations.
- Unsupported claims detected.
- Incorrect quality labels.
- Unauthorised external actions.
- Security incidents.
- Audit-trace completeness.

Do not rank agents based on self-reported confidence or message volume. Use measured task outcomes and relevant evaluation evidence.

## Governance rules

1. An agent may only act within its registered permissions.
2. Agent outputs are untrusted until validated.
3. The orchestrator owns the mission state.
4. Deterministic services enforce permissions and budget ceilings.
5. Every consequential external action requires appropriate authorisation.
6. Every completed mission must report its actual state.
7. Failed and skipped checks must be visible.
8. Capability changes must be versioned and evaluated.
9. Performance learning must not silently broaden permissions.
10. High-impact work must follow the applicable domain-specific controls.

---

# Part 8. Implementation Deliverables

The workforce specification should result in these engineering artefacts:

1. **Agent catalogue:** The 150 role definitions in a machine-readable registry.
2. **Capability schema:** The shared contract for every role.
3. **Architecture specification:** The services, trust boundaries and execution flows.
4. **Mission state machine:** Valid states, transitions and recovery behaviour.
5. **Permission model:** Tool allowlists, workspace access and approval rules.
6. **Evaluation framework:** Test suites, scoring rubrics and release gates.
7. **Initial workforce:** Implemented and evaluated Wave 1 capabilities.
8. **Pilot workflows:** Research, product definition and prototype delivery.
9. **Observability dashboard:** Mission status, cost, failures, quality and usage.
10. **Activation plan:** Evidence-based criteria for releasing each additional capability.

The initial implementation should prove the complete workflow end to end before expanding the number of active roles.

---

# Final architectural decision

DeliverX should maintain one comprehensive catalogue of 150 specialist capabilities, one shared execution infrastructure, one enforceable governance layer and one consistent evaluation framework.

The catalogue describes what the workforce can eventually do. The registry describes what is available now. The orchestrator selects the appropriate capabilities for each mission. The execution infrastructure performs the work. The evaluation system records what passed and what did not. The user receives the deliverables, evidence, limitations and decisions requiring attention.

**The objective is not to activate 150 agents as quickly as possible. It is to build a workforce that can expand without losing control, quality, transparency or commercial viability.**