/**
 * Phase 5 — one authorised export snapshot for Markdown, PDF, and ZIP.
 * After exportMission, persisted exportBody/exportPdfBase64 are the source of truth.
 */
import { buildDecisionPackMarkdown, buildDecisionPackPdf, pdfToBase64 } from "./decision-pack";
import type { SupervisedMission } from "./types";

export function authorisedDecisionPackMarkdown(mission: SupervisedMission): string {
  return mission.exportBody ?? buildDecisionPackMarkdown(mission);
}

export function authorisedDecisionPackPdfBytes(mission: SupervisedMission): Uint8Array {
  if (mission.exportPdfBase64) {
    const binary = atob(mission.exportPdfBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)!;
    return bytes;
  }
  return buildDecisionPackPdf(authorisedDecisionPackMarkdown(mission));
}

export function authorisedDecisionPackPdfBase64(mission: SupervisedMission): string {
  if (mission.exportPdfBase64) return mission.exportPdfBase64;
  return pdfToBase64(authorisedDecisionPackPdfBytes(mission));
}
