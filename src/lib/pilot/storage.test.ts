import { afterEach, describe, expect, it, vi } from "vitest";
import { EMPTY_BRIEF } from "@/lib/marketing/product-resources";
import {
  clearPilotBrief,
  loadPilotBrief,
  loadPilotPlan,
  savePilotBrief,
  savePilotPlan,
} from "./storage";
afterEach(() => vi.unstubAllGlobals());
describe("pilot browser draft storage", () => {
  it("keeps edited content and selected plan across reads; clear removes the draft", () => {
    const rows = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => rows.get(k) ?? null,
      setItem: (k: string, v: string) => rows.set(k, v),
      removeItem: (k: string) => rows.delete(k),
    });
    const edited = { ...EMPTY_BRIEF, problem: "My edited product question" };
    savePilotBrief(edited);
    savePilotPlan("builder");
    expect(loadPilotBrief()).toEqual(edited);
    expect(loadPilotPlan()).toBe("builder");
    clearPilotBrief();
    expect(loadPilotBrief()).toBeNull();
  });
  it("does not break editing when browser persistence throws", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("quota");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    });
    expect(() => savePilotBrief(EMPTY_BRIEF)).not.toThrow();
    expect(() => savePilotPlan("builder")).not.toThrow();
    expect(loadPilotBrief()).toBeNull();
    expect(() => clearPilotBrief()).not.toThrow();
  });
});
