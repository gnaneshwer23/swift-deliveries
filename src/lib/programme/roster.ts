/**
 * Workforce roster and judgement lenses.
 *
 * Each department judges options through a different lens (criterion weights),
 * mirroring how real team members weigh trade-offs differently. Vetoes are
 * hard rules held by specific departments — deterministic, never model output.
 */
import { listCapabilities } from "@/lib/workforce/registry";
import type { Criterion } from "./types";

export type RosterEntry = {
  id: string;
  name: string;
  department: string;
  departmentNumber: number;
};

let cache: Map<string, RosterEntry> | null = null;

export function roster(): Map<string, RosterEntry> {
  if (!cache) {
    cache = new Map(
      listCapabilities().map((c) => [
        c.capability_id,
        {
          id: c.capability_id,
          name: c.name.replace(/ Agent$/, ""),
          department: c.department,
          departmentNumber: c.department_number,
        },
      ]),
    );
  }
  return cache;
}

export function member(id: string): RosterEntry {
  const m = roster().get(id);
  if (!m) throw new Error(`Unknown capability ${id}`);
  return m;
}

export function displayName(id: string): string {
  const m = roster().get(id);
  return m ? `${m.name} (${id})` : id;
}

type Lens = Record<Criterion, number>;
const lens = (w: Partial<Lens>): Lens => {
  const base: Lens = {
    customer_value: 0,
    business_value: 0,
    cost: 0,
    risk: 0,
    time_to_market: 0,
    evidence: 0,
    feasibility: 0,
    ...w,
  };
  const total = Object.values(base).reduce((a, b) => a + b, 0);
  return Object.fromEntries(Object.entries(base).map(([k, v]) => [k, v / total])) as Lens;
};

/** Criterion weights per department number. */
export const DEPARTMENT_LENSES: Record<number, Lens> = {
  1: lens({ business_value: 3, risk: 2, time_to_market: 2, customer_value: 2, evidence: 1 }),
  2: lens({ evidence: 5, customer_value: 2.5, risk: 1, business_value: 1.5 }),
  3: lens({
    customer_value: 3.5,
    business_value: 2.5,
    time_to_market: 2,
    feasibility: 1,
    evidence: 1,
  }),
  4: lens({ customer_value: 5, feasibility: 2, evidence: 1.5, time_to_market: 1.5 }),
  5: lens({ feasibility: 4.5, time_to_market: 2, risk: 2, cost: 1.5 }),
  6: lens({ feasibility: 3.5, evidence: 2.5, risk: 2, customer_value: 2 }),
  7: lens({ risk: 6, feasibility: 2, evidence: 2 }),
  8: lens({ risk: 4, feasibility: 3, evidence: 3 }),
  9: lens({ feasibility: 3.5, cost: 3, risk: 3.5 }),
  10: lens({
    business_value: 3,
    customer_value: 2,
    evidence: 2,
    time_to_market: 1,
    feasibility: 2,
  }),
  11: lens({ customer_value: 3, business_value: 3.5, time_to_market: 3.5 }),
  12: lens({ business_value: 5, customer_value: 3, time_to_market: 2 }),
  13: lens({ evidence: 5, customer_value: 2.5, business_value: 2.5 }),
  14: lens({ cost: 4.5, business_value: 3, risk: 2.5 }),
  15: lens({ time_to_market: 3.5, feasibility: 3.5, cost: 3 }),
};

export type VetoRule = {
  departmentNumber: number;
  criterion: Criterion;
  /** Veto when the option scores below this on the criterion. */
  below: number;
  reason: string;
};

/** Hard vetoes: a department on the panel blocks options that breach its red line. */
export const VETO_RULES: VetoRule[] = [
  {
    departmentNumber: 7,
    criterion: "risk",
    below: 0.3,
    reason: "unacceptable security or privacy risk without mitigation",
  },
  {
    departmentNumber: 14,
    criterion: "cost",
    below: 0.25,
    reason: "cost exceeds what the budget and business case can support",
  },
  {
    departmentNumber: 8,
    criterion: "feasibility",
    below: 0.25,
    reason: "cannot be verified to release quality in the available time",
  },
];
