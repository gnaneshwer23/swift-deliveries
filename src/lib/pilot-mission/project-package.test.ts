import { describe, expect, it } from "vitest";
import { deliveryBundle } from "./delivery-test-fixtures";
import { buildFullArchiveZip } from "./executive-pack";
import { baseMission } from "./test-fixtures";

describe("project package index", () => {
  it("links a saved charter and lists an unsaved PRD as not produced", () => {
    const { files } = buildFullArchiveZip(
      baseMission({ stage: "exported", exportBody: "# Pack\n" }),
      "2026-11-03T00:00:00Z",
      deliveryBundle({ charter: "completed" }, { artefactsFor: ["charter"] }),
    );
    const index = files.find((file) => file.path.endsWith("/PROJECT.md"))!.content;
    expect(index).toMatch(/\[delivery\/\d+-charter\.md\]\(delivery\/\d+-charter\.md\)/);
    expect(index).toContain("| PRD and success metrics | Not produced on this case |");
    expect(index).not.toContain("## prd");
    expect(index).not.toMatch(/\bVerified\b/);
    expect(index).toContain("Status: Completed. The decision pack is saved.");
  });

  it("does not claim delivery documents when the build could not be read", () => {
    const { files } = buildFullArchiveZip(
      baseMission({
        stage: "exported",
        exportBody: "# Pack\n",
        delivery: {
          wfMissionId: "wf",
          planVersion: 1,
          planHash: "h",
          optionId: "o1",
          approvedAt: "2026-10-31T13:00:00Z",
          approvedBy: "u",
        },
      }),
      "2026-11-03T00:00:00Z",
      null,
    );
    const index = files.find((file) => file.path.endsWith("/PROJECT.md"))!.content;
    expect(index).toContain("The build record could not be read.");
    expect(index).not.toContain("| Project charter | On this case |");
  });
});
