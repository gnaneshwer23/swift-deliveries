/**
 * The build's part of the project download: every saved stage output, the team record and
 * the gates the owner decided — read from the delivery engine's rows via `buildDeliveryRoom`.
 *
 * Each output file opens with who made it, their catalogue role, how it was made (model id
 * or simulated draft) and its quality labels. Nothing is added that the build did not save.
 */
import { buildDeliveryRoom, BUILD_STATUS_LABEL, type BuildStage } from "./delivery-room";
import type { MissionBundle } from "@/lib/workforce/types";

export type DeliveryPackageOutput = {
  path: string;
  stage: string;
  owner: string;
  role: string;
  production: string;
  quality: string[];
  /** True for a simulated draft, false for a model output, null when not recorded. */
  simulated: boolean | null;
};

export type DeliveryPackage = {
  files: Array<{ path: string; content: string; note: string }>;
  manifest: {
    wfMissionId: string;
    state: string;
    progress: { done: number; total: number };
    outputs: DeliveryPackageOutput[];
    personaNote: string;
  };
};

const EXT = { markdown: "md", html: "html", json: "json" } as const;

function outputPath(stage: BuildStage, index: number): string | null {
  if (!stage.output) return null;
  const n = String(index + 1).padStart(2, "0");
  return `delivery/${n}-${stage.key.replace(/[^a-z0-9_-]/gi, "-")}.${EXT[stage.output.format]}`;
}

function simulatedFlag(production: string): boolean | null {
  if (production === "Simulated draft") return true;
  if (production.startsWith("Model:")) return false;
  return null;
}

function provenanceLines(stage: BuildStage): string[] {
  const out = stage.output!;
  return [
    `Stage: ${stage.title} (${BUILD_STATUS_LABEL[stage.status]})`,
    `Made by: ${stage.owner} · ${stage.role}`,
    `How it was made: ${out.production}`,
    `Quality: ${out.quality.length ? out.quality.join(", ") : "No quality label recorded"}`,
  ];
}

function withProvenance(stage: BuildStage): string {
  const out = stage.output!;
  const lines = provenanceLines(stage);
  if (out.format === "html") {
    return `<!--\n${lines.join("\n")}\n-->\n${out.content}`;
  }
  if (out.format === "json") return out.content;
  return `# ${out.title}\n\n${lines.map((l) => `- ${l}`).join("\n")}\n\n---\n\n${out.content}\n`;
}

const PERSONA_NOTE =
  "Agent names (Aria, Scout, Lumen…) are display names for catalogue roles; each file names the real role.";

export function buildDeliveryPackage(bundle: MissionBundle): DeliveryPackage {
  const room = buildDeliveryRoom(bundle);
  const paths = room.stages.map((s, i) => outputPath(s, i));
  const files: DeliveryPackage["files"] = [];
  const outputs: DeliveryPackageOutput[] = [];

  room.stages.forEach((stage, i) => {
    const path = paths[i];
    if (!path || !stage.output) return;
    files.push({
      path,
      content: withProvenance(stage),
      note: `${stage.title} · ${stage.owner} (${stage.role}) · ${stage.output.production}`,
    });
    outputs.push({
      path,
      stage: stage.title,
      owner: stage.owner,
      role: stage.role,
      production: stage.output.production,
      quality: stage.output.quality,
      simulated: simulatedFlag(stage.output.production),
    });
  });

  const rows = room.stages
    .map(
      (s, i) =>
        `| ${i + 1} | ${s.title} | ${s.gate ? "You" : `${s.owner} · ${s.role}`} | ${BUILD_STATUS_LABEL[s.status]} | ${paths[i] ? `\`${paths[i]!.replace("delivery/", "")}\`` : "—"} | ${s.output?.production ?? "—"} |`,
    )
    .join("\n");
  const simulatedCount = outputs.filter((o) => o.simulated === true).length;
  files.unshift({
    path: "delivery/README.md",
    note: "Build summary: every stage, owner, status and output",
    content: `# The build

- **State:** ${room.state.replace(/_/g, " ")}
- **Progress:** ${room.progress.done} of ${room.progress.total} steps done (completed tasks over all tasks)
- **Outputs in this folder:** ${outputs.length}${simulatedCount ? ` — ${simulatedCount} are simulated drafts (deterministic templates, no model call)` : ""}

| # | Stage | Owner | Status | File | How it was made |
| --- | --- | --- | --- | --- | --- |
${rows}

${PERSONA_NOTE} Stages after a gate run only once you approve that gate. Nothing in this folder claims a test, launch or outcome that the build did not record.
`,
  });

  const memberLines = room.team
    .map((m) => {
      const owned = room.stages
        .map((s, i) => ({ s, path: paths[i] }))
        .filter(({ s }) => !s.gate && s.owner === m.name)
        .map(
          ({ s, path }) =>
            `  - ${s.title} — ${BUILD_STATUS_LABEL[s.status]}${path ? ` — \`${path.replace("delivery/", "")}\` (${s.output!.production})` : ""}`,
        )
        .join("\n");
      return `## ${m.name} · ${m.role}\n\n${owned}`;
    })
    .join("\n\n");
  const gates = room.stages
    .filter((s) => s.gate)
    .map((s) => `- ${s.title} — ${BUILD_STATUS_LABEL[s.status]}`)
    .join("\n");
  files.push({
    path: "delivery/team-record.md",
    note: "Who did what on the build, with how each output was made",
    content: `# Team record\n\n${PERSONA_NOTE}\n\n${memberLines || "No specialist work recorded yet."}\n\n## Your decisions\n\n${gates || "- No gates on this build."}\n`,
  });

  return {
    files,
    manifest: {
      wfMissionId: bundle.mission.id,
      state: room.state,
      progress: room.progress,
      outputs,
      personaNote: PERSONA_NOTE,
    },
  };
}
