import { describe, expect, it } from "vitest";
import {
  awaitsExternalApproval,
  maxPermission,
  permissionAllows,
  requiresExternalApproval,
  rerunsAfterExternalApproval,
} from "./permissions";

describe("permission ladder", () => {
  it("allows lower work under a higher ceiling", () => {
    expect(permissionAllows("execute_internally", "create")).toBe(true);
    expect(permissionAllows("create", "execute_internally")).toBe(false);
  });

  it("requires explicit approval for act_externally", () => {
    expect(requiresExternalApproval("act_externally", false)).toBe(true);
    expect(requiresExternalApproval("act_externally", true)).toBe(false);
    expect(requiresExternalApproval("execute_internally", false)).toBe(false);
  });

  it("computes the max required permission", () => {
    expect(maxPermission(["plan", "create", "act_externally", "execute_internally"])).toBe(
      "act_externally",
    );
  });
});

describe("outside actions", () => {
  it("wait on the owner when flagged external or at the act-externally level, until approved", () => {
    const internal = { isExternal: false, permissionRequired: "create" as const };
    const flagged = { isExternal: true, permissionRequired: "create" as const };
    const levelled = { isExternal: false, permissionRequired: "act_externally" as const };
    expect(awaitsExternalApproval(internal, false)).toBe(false);
    expect(awaitsExternalApproval(flagged, false)).toBe(true);
    expect(awaitsExternalApproval(levelled, false)).toBe(true);
    expect(awaitsExternalApproval(flagged, true)).toBe(false);
    expect(awaitsExternalApproval(levelled, true)).toBe(false);
  });

  it("re-enter the schedule only when blocked, flagged external and approved", () => {
    expect(rerunsAfterExternalApproval({ status: "blocked", isExternal: true }, true)).toBe(true);
    expect(rerunsAfterExternalApproval({ status: "blocked", isExternal: true }, false)).toBe(false);
    expect(rerunsAfterExternalApproval({ status: "blocked", isExternal: false }, true)).toBe(false);
    expect(rerunsAfterExternalApproval({ status: "pending", isExternal: true }, true)).toBe(false);
  });
});
