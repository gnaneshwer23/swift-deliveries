/** Browser-local continuity. Plan ids and brief text stay out of the URL. */
import { EMPTY_BRIEF, type ProductBrief } from "@/lib/marketing/product-resources";
import { isPilotPlan, type PilotPlan } from "./model";

const BRIEF_KEY = "dx-psi-brief";
const PLAN_KEY = "dx-psi-plan";
const CLAIM_KEY = "dx-psi-claim";

export type PilotClaim = { token: string; reference: string; plan: PilotPlan };

function read(key: string): string | null {
  try {
    return store()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}
function write(key: string, value: string): boolean {
  try {
    const storage = store();
    if (!storage) return false;
    storage.setItem(key, value);
    return true;
  } catch {
    return false; // Editing and downloads still work without persistence.
  }
}
function remove(key: string): void {
  try {
    store()?.removeItem(key);
  } catch {
    /* Storage is unavailable. */
  }
}
function store(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function savePilotBrief(brief: ProductBrief): boolean {
  return write(BRIEF_KEY, JSON.stringify(brief));
}

export function loadPilotBrief(): ProductBrief | null {
  const raw = read(BRIEF_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ProductBrief>;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return {
      product: typeof parsed.product === "string" ? parsed.product.slice(0, 200) : "",
      audience: typeof parsed.audience === "string" ? parsed.audience.slice(0, 2000) : "",
      problem: typeof parsed.problem === "string" ? parsed.problem.slice(0, 2000) : "",
      objective: typeof parsed.objective === "string" ? parsed.objective.slice(0, 2000) : "",
      constraints: typeof parsed.constraints === "string" ? parsed.constraints.slice(0, 2000) : "",
      evidence: typeof parsed.evidence === "string" ? parsed.evidence.slice(0, 2000) : "",
    };
  } catch {
    return null;
  }
}

export function clearPilotBrief(): void {
  remove(BRIEF_KEY);
}

export function hasPilotBrief(brief: ProductBrief): boolean {
  return Object.values(brief).some((value) => value.trim().length > 0);
}

export function savePilotPlan(plan: PilotPlan): void {
  write(PLAN_KEY, plan);
}

export function loadPilotPlan(): PilotPlan | null {
  const value = read(PLAN_KEY) ?? "";
  return isPilotPlan(value) ? value : null;
}

export function savePilotClaim(claim: PilotClaim): void {
  write(CLAIM_KEY, JSON.stringify(claim));
}

export function loadPilotClaim(): PilotClaim | null {
  const raw = read(CLAIM_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<PilotClaim>;
    if (typeof parsed.token !== "string" || typeof parsed.reference !== "string") return null;
    if (!parsed.plan || !isPilotPlan(parsed.plan)) return null;
    return { token: parsed.token, reference: parsed.reference, plan: parsed.plan };
  } catch {
    return null;
  }
}

export function clearPilotClaim(): void {
  remove(CLAIM_KEY);
}

export function blankBrief(): ProductBrief {
  return { ...EMPTY_BRIEF };
}
