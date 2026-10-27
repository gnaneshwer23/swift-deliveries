import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { FileText, StickyNote, Trash2, TriangleAlert } from "lucide-react";
import {
  addMissionEvidence,
  getMissionEvidence,
  removeMissionEvidence,
} from "@/lib/workforce.functions";
import {
  MAX_EVIDENCE_FILE_BYTES,
  MAX_EVIDENCE_NOTE_CHARS,
  type WfEvidence,
} from "@/lib/workforce/evidence";

/** Base64 of a file's bytes, in chunks so large files do not overflow the call stack. */
async function toBase64(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000)
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

function titleFromFile(name: string): string {
  return (
    name
      .replace(/\.[^.]+$/, "")
      .replace(/[_-]+/g, " ")
      .trim() || name
  );
}

/**
 * Founder-supplied evidence for one mission: notes and text files. Roles cite
 * an item by its title. Files the server cannot read are listed with the
 * reason instead of disappearing.
 */
export function MissionEvidence({ missionId, editable }: { missionId: string; editable: boolean }) {
  const queryClient = useQueryClient();
  const key = ["command", "mission", missionId, "evidence"];
  const query = useQuery({
    queryKey: key,
    queryFn: () => getMissionEvidence({ data: { missionId } }),
  });
  const [mode, setMode] = useState<"note" | "file" | null>(null);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const reset = () => {
    setMode(null);
    setTitle("");
    setText("");
    setFile(null);
    setError(null);
    if (fileInput.current) fileInput.current.value = "";
  };

  const add = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error("Give the evidence a title.");
      if (mode === "note")
        return addMissionEvidence({ data: { missionId, kind: "note", title, text } });
      if (!file) throw new Error("Choose a file.");
      // Over-limit files are recorded as unreadable without sending their content.
      const base64 = file.size <= MAX_EVIDENCE_FILE_BYTES ? await toBase64(file) : undefined;
      return addMissionEvidence({
        data: {
          missionId,
          kind: "file",
          title,
          fileName: file.name,
          mediaType: file.type,
          byteSize: file.size,
          ...(base64 === undefined ? {} : { base64 }),
        },
      });
    },
    onSuccess: (list) => {
      queryClient.setQueryData(key, list);
      reset();
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Could not add the evidence."),
  });

  const remove = useMutation({
    mutationFn: (evidenceId: string) => removeMissionEvidence({ data: { missionId, evidenceId } }),
    onMutate: () => setError(null),
    // Refetched rather than taken from the response, so overlapping removals cannot undo each other.
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
    onError: (e) => setError(e instanceof Error ? e.message : "Could not remove the evidence."),
  });

  const list = query.data;
  const items = list?.items ?? [];

  return (
    <section className="cc-panel" aria-labelledby="mission-evidence-title">
      <h2 id="mission-evidence-title" className="cc-panel-title">
        Your evidence ({items.length})
      </h2>
      <p className="text-sm text-slate-600 mb-3">
        Research notes and text files you supply. Roles can cite them by title as sourced facts;
        anything without a source stays labelled as an assumption. Changes apply to steps that have
        not started yet.
      </p>

      {query.isError && !list ? (
        <p className="cc-error" role="alert">
          Your evidence could not be loaded.
        </p>
      ) : list && !list.available ? (
        <p className="text-sm text-slate-600">
          Evidence becomes available once its database update is applied.
        </p>
      ) : items.length ? (
        <ul className="cc-bullets mb-3">
          {items.map((e) => (
            <EvidenceRow
              key={e.id}
              evidence={e}
              {...(editable ? { onRemove: () => remove.mutate(e.id) } : {})}
              removing={remove.isPending && remove.variables === e.id}
              disabled={remove.isPending}
            />
          ))}
        </ul>
      ) : query.isPending ? null : (
        <p className="text-sm text-slate-600 mb-3">No evidence yet.</p>
      )}

      {editable && list?.available ? (
        mode ? (
          <form
            className="space-y-2"
            onSubmit={(ev) => {
              ev.preventDefault();
              setError(null);
              add.mutate();
            }}
          >
            <label className="block text-sm font-medium" htmlFor="evidence-title">
              Title <span className="font-normal text-slate-500">(how roles will cite it)</span>
            </label>
            <input
              id="evidence-title"
              className="cc-input"
              required
              minLength={3}
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Tutor call notes, 12 Oct"
            />
            {mode === "note" ? (
              <>
                <label className="block text-sm font-medium" htmlFor="evidence-text">
                  Note
                </label>
                <textarea
                  id="evidence-text"
                  className="cc-input cc-textarea"
                  rows={6}
                  required
                  maxLength={MAX_EVIDENCE_NOTE_CHARS}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              </>
            ) : (
              <>
                <label className="block text-sm font-medium" htmlFor="evidence-file">
                  File{" "}
                  <span className="font-normal text-slate-500">
                    (plain text: .txt, .md, .csv, .tsv or .json, up to{" "}
                    {MAX_EVIDENCE_FILE_BYTES / 1024} KB)
                  </span>
                </label>
                <input
                  id="evidence-file"
                  ref={fileInput}
                  type="file"
                  required
                  className="block text-sm"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setFile(f);
                    if (f && !title) setTitle(titleFromFile(f.name).slice(0, 120));
                  }}
                />
              </>
            )}
            <p className="text-xs text-slate-500">
              Text that looks like it holds personal details (such as NHS or National Insurance
              numbers) is kept here but never sent to a model.
            </p>
            {error ? (
              <p className="cc-error" role="alert">
                {error}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <button type="submit" className="cc-btn cc-btn-primary" disabled={add.isPending}>
                {add.isPending ? "Adding…" : "Add evidence"}
              </button>
              <button type="button" className="cc-btn" onClick={reset} disabled={add.isPending}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button type="button" className="cc-btn" onClick={() => setMode("note")}>
              <StickyNote className="size-4" aria-hidden /> Add a note
            </button>
            <button type="button" className="cc-btn" onClick={() => setMode("file")}>
              <FileText className="size-4" aria-hidden /> Upload a text file
            </button>
          </div>
        )
      ) : null}
      {!mode && error ? (
        <p className="cc-error" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}

function EvidenceRow({
  evidence: e,
  onRemove,
  removing,
  disabled,
}: {
  evidence: WfEvidence;
  onRemove?: () => void;
  removing: boolean;
  disabled: boolean;
}) {
  const added = new Date(e.createdAt).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <li className="flex flex-wrap items-start justify-between gap-2">
      <div className="min-w-0">
        <strong>{e.title}</strong>{" "}
        <span className="text-xs text-slate-500">
          {e.kind === "file" ? (e.fileName ?? "file") : "note"} · added {added}
        </span>
        {e.status === "unreadable" ? (
          <p className="text-sm text-amber-700 flex items-start gap-1">
            <TriangleAlert className="size-4 shrink-0 mt-0.5" aria-hidden />
            Not read: {e.unreadableReason}
          </p>
        ) : e.containsIdentifiers ? (
          <p className="text-sm text-amber-700 flex items-start gap-1">
            <TriangleAlert className="size-4 shrink-0 mt-0.5" aria-hidden />
            May hold personal details, so it is not sent to a model.
          </p>
        ) : null}
      </div>
      {onRemove ? (
        <button
          type="button"
          className="cc-btn"
          onClick={onRemove}
          disabled={disabled}
          aria-label={`Remove ${e.title}`}
        >
          <Trash2 className="size-4" aria-hidden />
          {removing ? "Removing…" : "Remove"}
        </button>
      ) : null}
    </li>
  );
}
