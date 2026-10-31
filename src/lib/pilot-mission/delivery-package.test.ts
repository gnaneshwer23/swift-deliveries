import { describe, expect, it } from "vitest";
import { buildDeliveryPackage } from "./delivery-package";
import { deliveryBundle } from "./delivery-test-fixtures";
import { buildSupervisedZip, supervisedZipInventory } from "./supervised-zip";
import { baseMission } from "./test-fixtures";

const done = { charter: "completed", market: "completed", research: "running" } as const;

describe("buildDeliveryPackage", () => {
  it("bundles only saved outputs, each opening with who made it and how", () => {
    const pack = buildDeliveryPackage(
      deliveryBundle(done, { artefactsFor: ["charter", "market"], modelFor: ["market"] }),
    );
    const paths = pack.files.map((f) => f.path);
    expect(paths).toEqual([
      "delivery/README.md",
      "delivery/01-charter.md",
      "delivery/02-market.md",
      "delivery/team-record.md",
    ]);
    const charter = pack.files.find((f) => f.path === "delivery/01-charter.md")!.content;
    expect(charter).toContain("Made by: Aria · ");
    expect(charter).toContain("How it was made: Simulated draft");
    expect(charter).toContain("Quality: Agent-reviewed");
    expect(pack.manifest.outputs.map((o) => o.simulated)).toEqual([true, false]);
    expect(pack.manifest.progress).toEqual({ done: 2, total: 14 });
  });

  it("records who did what and the owner's gate decisions in the team record", () => {
    const pack = buildDeliveryPackage(deliveryBundle(done, { artefactsFor: ["charter"] }));
    const record = pack.files.find((f) => f.path === "delivery/team-record.md")!.content;
    expect(record).toContain("## Aria");
    expect(record).toContain("01-charter.md");
    expect(record).toMatch(/## Your decisions[\s\S]*approve product scope/i);
  });
});

describe("supervised ZIP with a build", () => {
  const delivered = baseMission({
    delivery: {
      wfMissionId: "m",
      planVersion: 1,
      planHash: "h",
      optionId: "o1",
      approvedAt: "2026-10-31T13:00:00Z",
      approvedBy: "u",
    },
  });

  it("adds the build folder and marks the export simulated when any output is", () => {
    const zip = buildSupervisedZip(
      delivered,
      "2026-10-31T14:00:00Z",
      deliveryBundle(done, { artefactsFor: ["charter"] }),
    );
    expect(zip.files.some((f) => f.path.endsWith("/delivery/01-charter.md"))).toBe(true);
    const manifest = JSON.parse(
      zip.files.find((f) => f.path.endsWith("project-manifest.json"))!.content,
    );
    expect(manifest.simulated).toBe(true);
    expect(manifest.delivery.outputs).toHaveLength(1);
  });

  it("says plainly when the build could not be read", () => {
    const inventory = supervisedZipInventory(delivered);
    expect(inventory.find((i) => i.path === "delivery/README.md")).toMatchObject({
      bundled: false,
    });
  });
});
