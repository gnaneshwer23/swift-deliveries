import { describe, expect, it } from "vitest";
import { maxPermission, permissionAllows, requiresExternalApproval } from "./permissions";

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
