import { describe, expect, it } from "vitest";
import { STAGE_FIXTURES } from "./registry/eval-fixtures";
import type { WfEvidence } from "./evidence";
import { contextScopesFor, roleGuidance } from "./worker.server";

const prd = STAGE_FIXTURES.find((f) => f.stage === "prd")!;
const research = STAGE_FIXTURES.find((f) => f.stage === "research")!;

const evidence = (title: string, content: string): WfEvidence => ({
  id: crypto.randomUUID(),
  missionId: "m",
  kind: "note",
  title,
  status: "readable",
  unreadableReason: null,
  content,
  fileName: null,
  mediaType: null,
  byteSize: null,
  contentSha256: null,
  containsIdentifiers: false,
  suppliedBy: "owner",
  createdAt: new Date().toISOString(),
});

describe("role guidance for a running task", () => {
  it("gives the lead role's instructions and rejects output that breaks its rules", () => {
    const g = roleGuidance({ key: "prd", capabilityIds: ["DX-023", "DX-021"] }, []);
    expect("extraInstructions" in g && g.extraInstructions).toMatch(/DX-023/);
    if (!("extraCheck" in g)) throw new Error("expected a check");
    expect(g.extraCheck(prd.good)).toBeNull();
    expect(
      g.extraCheck(prd.bad.find((b) => b.name === "requirement without an ID")!.output),
    ).toMatch(/must start with its ID/);
    expect(
      g.extraCheck(prd.bad.find((b) => b.name === "states an unsourced claim as fact")!.output),
    ).toMatch(/without an evidence label/);
  });

  it("adds nothing for a stage no defined role leads", () => {
    expect(roleGuidance({ key: "architecture", capabilityIds: [] }, [])).toEqual({});
    expect(roleGuidance({ key: "gate_scope", capabilityIds: ["DX-001"] }, [])).toEqual({});
  });

  it("lets a role cite the founder's evidence, but not evidence withheld from the model", () => {
    const cite = (title: string) =>
      research.good.replace("(Source: mission request)", `(Source: ${title})`);
    const check = (items: WfEvidence[]) => {
      const g = roleGuidance({ key: "research", capabilityIds: ["DX-018"] }, [], {}, items);
      if (!("extraCheck" in g)) throw new Error("expected a check");
      return g.extraCheck;
    };
    const notes = evidence("Tutor call notes", "Tutors reschedule on Sunday nights.");
    const patients = evidence("Patient list", "NHS 943 476 5919");
    expect(check([notes])(cite("Tutor call notes"))).toBeNull();
    expect(check([])(cite("Tutor call notes"))).toMatch(/cite a source that was not given/);
    expect(check([patients])(cite("Patient list"))).toMatch(/cite a source that was not given/);
  });

  it("accepts research the founder supplied, and only then", () => {
    const interview = research.good.replace(
      "## Evidence quality",
      "We interviewed 12 tutors.\n\n## Evidence quality",
    );
    const check = (items: WfEvidence[]) => {
      const g = roleGuidance({ key: "research", capabilityIds: ["DX-018"] }, [], {}, items);
      if (!("extraCheck" in g)) throw new Error("expected a check");
      return g.extraCheck(interview);
    };
    expect(check([])).toMatch(/interviews or survey results/);
    // An unrelated note does not excuse a claim of research.
    expect(check([evidence("Pricing page copy", "Plans start at £10.")])).toMatch(
      /interviews or survey results/,
    );
    expect(check([evidence("Interview notes", "12 tutor calls, Oct")])).toBeNull();
  });

  it("requires output to state conflicting evidence it was shown", () => {
    const g = roleGuidance({ key: "research", capabilityIds: ["DX-018"] }, [], {}, [], [], 1);
    if (!("extraCheck" in g)) throw new Error("expected a check");
    expect(g.extraCheck(research.good)).toMatch(/does not state the conflicting evidence/);
    const stated = research.good.replace(
      "## Evidence quality",
      "- [Inference] Earlier missions conflict on which day tutors book; both are kept.\n\n## Evidence quality",
    );
    expect(g.extraCheck(stated)).toBeNull();
  });

  it("gives each role only the context its definition allows", () => {
    expect(contextScopesFor({ key: "research", capabilityIds: ["DX-018"] })).toContain(
      "founder_evidence",
    );
    // UX works from the requirements: no founder evidence, no product memory.
    expect(contextScopesFor({ key: "ux", capabilityIds: ["DX-035"] })).toEqual([
      "mission_request",
      "upstream_artefacts",
    ]);
    // A stage no defined role leads gets the default: everything but founder evidence.
    expect(contextScopesFor({ key: "architecture", capabilityIds: [] })).not.toContain(
      "founder_evidence",
    );
  });
});
