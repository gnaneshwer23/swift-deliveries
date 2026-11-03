/**
 * Browser downloads that survive Safari and Chrome: the link has to be in the
 * document, and the object URL has to outlive the click. Two files in the same
 * turn are staggered so the second is not dropped.
 */
import { assembleDeliveryDownload } from "@/lib/pilot-mission/delivery-package";
import type { DeliveryRoom } from "@/lib/pilot-mission/delivery-room";
import { createZip } from "@/lib/programme/zip";

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function downloadText(
  content: string,
  filename: string,
  type = "text/markdown;charset=utf-8",
): void {
  downloadBlob(new Blob([content], { type }), filename);
}

export async function downloadBlobs(items: Array<{ blob: Blob; filename: string }>): Promise<void> {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item) continue;
    downloadBlob(item.blob, item.filename);
    if (i < items.length - 1) await new Promise((resolve) => window.setTimeout(resolve, 400));
  }
}

export function downloadZip(
  files: Array<{ path: string; content: string }>,
  filename: string,
): void {
  const archive = createZip(files).slice();
  downloadBlob(new Blob([archive], { type: "application/zip" }), filename);
}

/** Download a saved artefact. Markdown and HTML state how they were produced. */
export function downloadProducedDocument(input: {
  title: string;
  content: string;
  format: "markdown" | "html" | "json";
  production: string;
}): void {
  if (!input.content.trim()) return;
  const ext = input.format === "html" ? "html" : input.format === "json" ? "json" : "md";
  const filename = `${fileSlug(input.title)}.${ext}`;
  if (input.format === "html") {
    downloadText(
      `<!-- How it was made: ${input.production} -->\n${input.content}`,
      filename,
      "text/html;charset=utf-8",
    );
    return;
  }
  if (input.format === "json") {
    downloadText(input.content, filename, "application/json");
    return;
  }
  downloadText(
    `# ${input.title}\n\n- How it was made: ${input.production}\n\n---\n\n${input.content}\n`,
    filename,
  );
}

/** ZIP of documents the build has actually saved. Returns false when none exist. */
export function downloadSavedDocuments(room: DeliveryRoom, missionId: string): boolean {
  const { files, outputs } = assembleDeliveryDownload(room);
  if (!outputs.length) return false;
  downloadZip(
    files.map((file) => ({ path: file.path, content: file.content })),
    `deliverx-documents-${missionId.slice(0, 8)}.zip`,
  );
  return true;
}

export function fileSlug(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "document"
  );
}
