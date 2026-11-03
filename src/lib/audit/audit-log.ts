/**
 * Settings → Audit log: every saved event across the owner's projects, newest first, with
 * who did it and what, filters, and a CSV export. Read only from each project's own activity
 * record. Each project keeps its latest ACTIVITY_KEPT events, so a project at that limit may
 * have older events that are no longer stored; the log says so instead of implying it is
 * complete.
 */
import { ACTIVITY_KEPT, describeEvent, HIDDEN_KINDS } from "@/lib/pilot-mission/activity-feed";

export { ACTIVITY_KEPT };

export type AuditEventSource = {
  id: string;
  at: string;
  kind: string;
  actor: string;
  summary: string;
};

export type AuditProjectSource = {
  id: string;
  name: string;
  activity: AuditEventSource[];
};

export type AuditCategory = "decision" | "work" | "evidence" | "download" | "settings" | "other";

export const AUDIT_CATEGORY_LABEL: Record<AuditCategory, string> = {
  decision: "Approvals and decisions",
  work: "Team work",
  evidence: "Evidence and notes",
  download: "Downloads",
  settings: "Project settings",
  other: "Other",
};

export type AuditEntry = {
  key: string;
  projectId: string;
  projectName: string;
  at: string;
  kind: string;
  actor: string;
  who: string;
  by: "you" | "team";
  what: string;
  summary: string;
  category: AuditCategory;
};

export type AuditLog = {
  entries: AuditEntry[];
  /** Projects whose record is at the kept limit, so older events may be gone. */
  truncatedProjects: string[];
};

export function categoryOf(kind: string): AuditCategory {
  if (HIDDEN_KINDS.has(kind)) return "settings";
  if (kind === "pack.exported") return "download";
  if (
    /approv|step_gate|proposal_(accepted|dismissed|proposed)|decision|research_mode\.set/.test(kind)
  ) {
    return "decision";
  }
  if (/^evidence\.|^meeting\.notes|cited|external_gap|provided_only/.test(kind)) return "evidence";
  if (
    /^(research|task|options|pm_brief|plan|prototype|continuation|case_room|mission)\./.test(kind)
  ) {
    return "work";
  }
  return "other";
}

export function buildAuditLog(projects: AuditProjectSource[]): AuditLog {
  const entries: AuditEntry[] = [];
  const truncatedProjects: string[] = [];
  for (const p of projects) {
    if (p.activity.length >= ACTIVITY_KEPT) truncatedProjects.push(p.name);
    for (const e of p.activity) {
      if (!Number.isFinite(Date.parse(e.at))) continue;
      const d = describeEvent(e);
      const category = categoryOf(e.kind);
      entries.push({
        key: `${p.id}:${e.id}`,
        projectId: p.id,
        projectName: p.name,
        at: e.at,
        kind: e.kind,
        actor: e.actor,
        who: d.who,
        by: d.by,
        // Settings saves say what changed (deleted, archived, restored…) in their summary.
        what: d.what || (category === "settings" ? "updated project settings" : e.kind),
        summary: e.summary,
        category,
      });
    }
  }
  entries.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  return { entries, truncatedProjects };
}

export type AuditFilters = {
  projectId: string | null;
  by: "you" | "team" | null;
  category: AuditCategory | null;
  /** Inclusive day bounds, YYYY-MM-DD in the viewer's local time. */
  from: string | null;
  to: string | null;
  query: string;
};

export const NO_FILTERS: AuditFilters = {
  projectId: null,
  by: null,
  category: null,
  from: null,
  to: null,
  query: "",
};

function localDay(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function filterAudit(entries: AuditEntry[], f: AuditFilters): AuditEntry[] {
  const q = f.query.trim().toLowerCase();
  return entries.filter((e) => {
    if (f.projectId && e.projectId !== f.projectId) return false;
    if (f.by && e.by !== f.by) return false;
    if (f.category && e.category !== f.category) return false;
    if (f.from || f.to) {
      const day = localDay(e.at);
      if (f.from && day < f.from) return false;
      if (f.to && day > f.to) return false;
    }
    if (q) {
      const hay = `${e.projectName} ${e.who} ${e.what} ${e.summary} ${e.kind}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

/**
 * One CSV cell. Quotes every value, doubles inner quotes, and prefixes a leading = + - @
 * (or tab/CR) with an apostrophe so a spreadsheet never runs it as a formula.
 */
export function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

/** Byte-order mark: tells spreadsheet apps the file is UTF-8. */
const BOM = "\uFEFF";

export const AUDIT_CSV_HEADER = [
  "Time (UTC)",
  "Project",
  "Who",
  "Actor id",
  "Category",
  "Event",
  "What happened",
  "Saved summary",
];

export function auditCsv(entries: AuditEntry[]): string {
  const rows = entries.map((e) =>
    [
      new Date(e.at).toISOString(),
      e.projectName,
      e.who,
      e.actor,
      AUDIT_CATEGORY_LABEL[e.category],
      e.kind,
      e.what,
      e.summary,
    ]
      .map(csvCell)
      .join(","),
  );
  // CRLF line ends and a byte-order mark so spreadsheet apps read UTF-8 correctly.
  return `${BOM}${[AUDIT_CSV_HEADER.map(csvCell).join(","), ...rows].join("\r\n")}\r\n`;
}
