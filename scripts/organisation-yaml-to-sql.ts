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

lines.push(``);
for (const key of doc.event_cards) {
  lines.push(
    `INSERT INTO scenario_event_cards (scenario_id, event_card_id)`,
    `SELECT s.id, e.id FROM experience_scenarios s, event_cards e WHERE s.key = ${q(org.id)} AND e.key = ${q(key)};`,
  );
}

console.log(lines.join("\n"));
