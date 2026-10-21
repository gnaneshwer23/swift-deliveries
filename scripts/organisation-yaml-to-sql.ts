/**
 * Turns an organisation YAML file (content/organisations/*.yaml) into
 * idempotent SQL for the scenario engine tables. The SQL is applied through
 * the database tools — authors never touch the database directly.
 *
 * Usage: bun scripts/organisation-yaml-to-sql.ts content/organisations/quillbase.yaml
 */
import { readFileSync } from "node:fs";
import YAML from "yaml";

const path = process.argv[2];
if (!path) throw new Error("Usage: bun scripts/organisation-yaml-to-sql.ts <file.yaml>");

interface OrgYaml {
  organisation: {
    id: string;
    name: string;
    sector: string;
    stage: string;
    entry_level: string;
    simulated: boolean;
    brief: string;
  };
  stakeholders: Array<{ name: string; wants: string; starting_trust: string }>;
  phases: Array<{
    phase: number;
    title: string;
    artefact_type: string;
    brief: string;
    rubric_dimensions: string[];
    unlock_after: number | null;
  }>;
  signature_dilemma: string;
  event_cards: string[];
  framework_version: string;
}

const doc = YAML.parse(readFileSync(path, "utf8")) as OrgYaml;
const org = doc.organisation;

if (org.simulated !== true) throw new Error("simulated must always be true");
if (doc.phases.length === 0) throw new Error("at least one phase is required");
for (const p of doc.phases) {
  if (!p.brief?.trim()) throw new Error(`phase ${p.phase} is missing a brief`);
}

const q = (s: string) => `'${s.replace(/'/g, "''")}'`;
const arr = (xs: string[]) => `ARRAY[${xs.map(q).join(", ")}]::text[]`;

const lines: string[] = [
  `-- Generated from ${path} — do not edit by hand.`,
  `INSERT INTO experience_scenarios (key, name, summary, company_name, company_stage, company_mark, role_title, duration_label, enabled, sector, entry_level, signature_dilemma, framework_version, framework_id)`,
  `SELECT ${q(org.id)}, ${q(org.name)}, ${q(org.brief.trim())}, ${q(org.name)}, ${q(org.stage)}, ${q(org.sector)}, ${q(org.entry_level.replace(/_/g, " "))}, '4 weeks', true, ${q(org.sector)}, ${q(org.entry_level)}, ${q(doc.signature_dilemma.trim())}, ${q(doc.framework_version)}, id`,
  `FROM capability_frameworks WHERE key = 'pm-core' AND version = '2026.1'`,
  `ON CONFLICT (key) DO UPDATE SET summary = EXCLUDED.summary, sector = EXCLUDED.sector, entry_level = EXCLUDED.entry_level, signature_dilemma = EXCLUDED.signature_dilemma, framework_version = EXCLUDED.framework_version;`,
  ``,
  `DELETE FROM scenario_stakeholders WHERE scenario_id = (SELECT id FROM experience_scenarios WHERE key = ${q(org.id)});`,
  `DELETE FROM scenario_phases WHERE scenario_id = (SELECT id FROM experience_scenarios WHERE key = ${q(org.id)});`,
  `DELETE FROM scenario_event_cards WHERE scenario_id = (SELECT id FROM experience_scenarios WHERE key = ${q(org.id)});`,
  ``,
];

doc.stakeholders.forEach((s, i) => {
  lines.push(
    `INSERT INTO scenario_stakeholders (scenario_id, name, wants, starting_trust, sort_order)`,
    `SELECT id, ${q(s.name)}, ${q(s.wants)}, ${q(s.starting_trust)}, ${i} FROM experience_scenarios WHERE key = ${q(org.id)};`,
  );
});

lines.push(``);
for (const p of doc.phases) {
  lines.push(
    `INSERT INTO scenario_phases (scenario_id, phase_number, title, artefact_type, brief, rubric_dimensions, unlock_after)`,
    `SELECT id, ${p.phase}, ${q(p.title)}, ${q(p.artefact_type)}, ${q(p.brief.trim())}, ${arr(p.rubric_dimensions)}, ${p.unlock_after ?? "NULL"} FROM experience_scenarios WHERE key = ${q(org.id)};`,
  );
}

// The Experience screens render experience_tasks rows. Derive one task per
// phase so an authored organisation is playable end to end with no hand-written
// task content. Upserted by key so re-running never breaks existing
// submissions that reference task ids.
const SECTIONS_BY_ARTEFACT: Record<string, string[]> = {
  discovery_report: [
    "Problem statement — what is the core problem, distinct from any solution?",
    "Evidence of need — what data, signals or behaviour support this?",
    "Who is affected — who specifically, and what are they trying to do?",
    "Scope decision — which direction do you recommend, and what did you rule out?",
  ],
  options_paper: [
    "The realistic options, including the one you do not favour",
    "Trade-offs of each option, stated honestly",
    "Your recommendation and the reasoning behind it",
    "What you are explicitly choosing not to do",
  ],
  readiness_assessment: [
    "The smallest change or experiment that would prove or kill the recommendation",
    "Success measures agreed before it runs",
    "Risks and how you will know early if it is failing",
    "Rollout approach — who is affected and how they are brought along",
  ],
  decision_memo: [
    "The decision being made and why now",
    "The evidence it rests on — reference your earlier artefacts",
    "The options you rejected and why",
    "What happens next, and how you will know it worked",
  ],
};
const DEFAULT_SECTIONS = [
  "Your response, structured as you see fit",
  "The evidence or reasoning behind it",
  "What you decided not to do",
];

const HINTS_BY_DIMENSION: Record<string, string> = {
  discovery: "Is the problem clearly named, distinct from a solution, and grounded in evidence?",
  prioritisation: "Are trade-offs stated honestly, with a clear recommendation and rejected options?",
  delivery: "Is the plan small enough to run, with success measures agreed before it starts?",
  stakeholders: "Are decision rights, motivations and conflicts named rather than smoothed over?",
  data: "Are claims tied to numbers or observed behaviour, not anecdote?",
  communication: "Could the intended reader act on this without a follow-up meeting?",
};

const initials = (name: string) =>
  name
    .replace(/\(.*?\)/g, "")
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const json = (value: unknown) => q(JSON.stringify(value));

lines.push(``);
const total = doc.phases.length;
for (const p of doc.phases) {
  const taskKey = `${org.id}-phase-${p.phase}`;
  const stakeholdersJson = doc.stakeholders.map((s) => ({
    initials: initials(s.name),
    name: s.name,
    role: s.wants,
    trust: s.starting_trust,
  }));
  const sectionsJson = SECTIONS_BY_ARTEFACT[p.artefact_type] ?? DEFAULT_SECTIONS;
  const guidanceJson = p.rubric_dimensions.map((d) => ({
    dimension: d[0].toUpperCase() + d.slice(1),
    hint: HINTS_BY_DIMENSION[d] ?? "Does this meet the bar for the dimension?",
  }));
  const context = `${org.brief.trim()} ${doc.signature_dilemma.trim()}`;
  lines.push(
    `INSERT INTO experience_tasks (scenario_id, key, week, sort_order, title, phase_label, brief, context, stakeholders, sections, guidance, capability_key, min_words)`,
    `SELECT id, ${q(taskKey)}, ${p.phase}, ${p.phase}, ${q(p.title)}, ${q(`Phase ${p.phase} of ${total}`)}, ${q(p.brief.trim())}, ${q(context)}, ${json(stakeholdersJson)}::jsonb, ${json(sectionsJson)}::jsonb, ${json(guidanceJson)}::jsonb, ${q(p.rubric_dimensions[0])}, 250 FROM experience_scenarios WHERE key = ${q(org.id)}`,
    `ON CONFLICT (scenario_id, key) DO UPDATE SET title = EXCLUDED.title, phase_label = EXCLUDED.phase_label, brief = EXCLUDED.brief, context = EXCLUDED.context, stakeholders = EXCLUDED.stakeholders, sections = EXCLUDED.sections, guidance = EXCLUDED.guidance, capability_key = EXCLUDED.capability_key;`,
  );
}

lines.push(``);
for (const key of doc.event_cards) {
  lines.push(
    `INSERT INTO scenario_event_cards (scenario_id, event_card_id)`,
    `SELECT s.id, e.id FROM experience_scenarios s, event_cards e WHERE s.key = ${q(org.id)} AND e.key = ${q(key)};`,
  );
}

console.log(lines.join("\n"));
