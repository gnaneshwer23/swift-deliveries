import { Link } from "@tanstack/react-router";

export const INDIGO_CASE_TABS = [
  { id: "indigo-briefing", label: "Briefing & Vision" },
  { id: "indigo-evidence", label: "Evidence & Research" },
  { id: "indigo-communication", label: "Communication Kit" },
  { id: "indigo-team", label: "Team & Work" },
  { id: "indigo-decisions", label: "Decisions" },
  { id: "indigo-roadmap", label: "Roadmap" },
  { id: "indigo-outcomes", label: "Outcomes" },
  { id: "indigo-downloads", label: "Downloads" },
] as const;

export type IndigoCaseTabId = (typeof INDIGO_CASE_TABS)[number]["id"];

export function IndigoCaseTabs({ missionId, activeId }: { missionId: string; activeId?: string }) {
  return (
    <nav className="ps-indigo-case-tabs" aria-label="Project sections">
      {INDIGO_CASE_TABS.map((tab) => {
        const active = activeId === tab.id;
        return (
          <Link
            key={tab.id}
            to="/command/supervised/$missionId"
            params={{ missionId }}
            hash={tab.id}
            className={active ? "is-active" : undefined}
            aria-current={active ? "location" : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
