/**
 * Versioned department mapping. Role IDs are never renumbered; when a
 * department's scope changes, the IDs it held keep their numbers and this
 * file records what they meant before, so older documents still resolve.
 *
 * Version 2 (27 Oct 2026) settles the department 10 and 13 mismatch: the
 * product moved healthcare and publishing out of scope (AGENTS.md), and the
 * code re-scoped those departments to Foresight and Product Analytics. The
 * catalogue document and registry export described version 1.
 */
export type DepartmentMappingEntry = {
  department: number;
  name: string;
  /** IDs whose meaning changed between versions; empty when nothing changed. */
  reassigned: Array<{ id: string; previously: string }>;
};

export const DEPARTMENT_MAPPING_VERSION = 2;

export const DEPARTMENT_MAPPING_HISTORY: ReadonlyArray<{
  version: number;
  effective: string;
  changes: DepartmentMappingEntry[];
  reason: string;
}> = [
  {
    version: 2,
    effective: "2026-10-27",
    reason:
      "Healthcare and publishing are out of scope for DeliverX. Departments 10 and 13 keep their numbers and IDs with the scopes the product uses.",
    changes: [
      {
        department: 10,
        name: "Future Technology and Foresight",
        reassigned: [
          { id: "DX-091", previously: "Clinical Literature Agent" },
          { id: "DX-092", previously: "Biomedical Research Agent" },
          { id: "DX-093", previously: "Clinical Data Analysis Agent" },
          { id: "DX-094", previously: "Healthcare Workflow Agent" },
          { id: "DX-095", previously: "Clinical Documentation Agent" },
          { id: "DX-096", previously: "Health Informatics Agent" },
          { id: "DX-097", previously: "Biomedical Knowledge Graph Agent" },
          { id: "DX-098", previously: "Scientific Evidence Appraisal Agent" },
          { id: "DX-099", previously: "Healthcare Privacy Agent" },
          { id: "DX-100", previously: "Clinical Safety Review Agent" },
        ],
      },
      {
        department: 13,
        name: "Product Analytics and Continuous Improvement",
        reassigned: [
          { id: "DX-121", previously: "Book Research Agent" },
          { id: "DX-122", previously: "Book Architecture Agent" },
          { id: "DX-123", previously: "Long-Form Writing Agent" },
          { id: "DX-124", previously: "Editorial Review Agent" },
          { id: "DX-125", previously: "Citation and Reference Agent" },
          { id: "DX-126", previously: "Curriculum Design Agent" },
          { id: "DX-127", previously: "Instructional Design Agent" },
          { id: "DX-128", previously: "Assessment Creation Agent" },
          { id: "DX-129", previously: "Course Production Agent" },
          { id: "DX-130", previously: "Publishing Operations Agent" },
        ],
      },
    ],
  },
  {
    version: 1,
    effective: "2026-10-01",
    reason: "Original catalogue.",
    changes: [
      { department: 10, name: "Healthcare and Life Sciences", reassigned: [] },
      { department: 13, name: "Books, Education and Publishing", reassigned: [] },
    ],
  },
];
