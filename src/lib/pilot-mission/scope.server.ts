import { createHash } from "node:crypto";
import type { Brief, EvidenceItem } from "./types";

export function scopeHash(brief: Brief, evidence: EvidenceItem[]): string {
  const payload = JSON.stringify({
    question: brief.question,
    audience: brief.audience,
    outcome: brief.outcome,
    constraints: brief.constraints,
    evidence: evidence.map((item) => ({
      id: item.id,
      statement: item.statement,
      source: item.source,
      classification: item.classification,
    })),
  });
  return createHash("sha256").update(payload).digest("hex");
}
