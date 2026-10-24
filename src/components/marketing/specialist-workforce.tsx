import { useId, useRef, useState, type KeyboardEvent } from "react";
import { downloadText } from "@/lib/marketing/product-resources";

const ROLES = [
  {
    id: "evidence",
    label: "Evidence",
    task: "Evidence brief finished from the sources you supplied.",
    reason: "The mission needs one shared starting point before anyone chooses a direction.",
    evidence: "Your sources, with gaps left open rather than filled in.",
    artefact: "Evidence brief handed to Options.",
    scene: "Sources arranged into a brief, with one gap left open.",
  },
  {
    id: "options",
    label: "Options",
    task: "Compared options finished against that brief.",
    reason: "A direction needs the trade-offs in view, not a single draft.",
    evidence: "Constraints and open gaps carried forward from the brief.",
    artefact: "Options note handed to Challenge.",
    scene: "Three directions compared on one baseline.",
  },
  {
    id: "challenge",
    label: "Challenge",
    task: "Challenge of the leading option finished.",
    reason: "One draft is not an independent check.",
    evidence: "Objections and the questions that are still unresolved.",
    artefact: "Challenge note handed to Decision.",
    scene: "A recommendation crossed by an independent objection.",
  },
  {
    id: "decision",
    label: "Decision",
    task: "Decision record finished, stating the recommendation and why.",
    reason: "The record explains the choice. It does not approve the export.",
    evidence: "The options, the objections, and the uncertainty that remains.",
    artefact: "Decision record handed to Builder.",
    scene: "A record of why, with the approval seal left empty.",
  },
  {
    id: "builder",
    label: "Builder",
    task: "Bounded draft finished from the decision record.",
    reason: "The build stays inside the scope the record already states.",
    evidence: "The decision record and the limitations written on it.",
    artefact: "Draft pack handed to Export.",
    scene: "A draft assembled inside the recorded scope.",
  },
  {
    id: "export",
    label: "Export",
    task: "Pack assembled and held.",
    reason: "This specialist cannot approve the step that lets the pack leave.",
    evidence: "The decision record and the versions of each artefact.",
    artefact: "Pack held until you approve the export.",
    scene: "A bound pack with the latch closed.",
  },
] as const;

type RoleId = (typeof ROLES)[number]["id"];

function packMarkdown(approvedAt: string) {
  const handoffs = ROLES.map(
    (role, index) =>
      `## ${index + 1}. ${role.label}\n\nTask finished: ${role.task}\nReason: ${role.reason}\nEvidence: ${role.evidence}\nArtefact: ${role.artefact}`,
  ).join("\n\n");
  return [
    "# Specialist workforce pack",
    "",
    "Simulated walkthrough exported from the DeliverX specialists page.",
    "Production: simulated draft assembled in the browser. No model call was made.",
    "No product was observed, no customer evidence was collected, and no live agent ran this pack.",
    "",
    `Owner approval: recorded in this browser session at ${approvedAt}.`,
    "A specialist did not approve this step. This approval is not a stored mission decision and does not authorise external action.",
    "",
    handoffs,
    "",
    "## Export",
    "",
    "The Export specialist assembled the pack and held it. The file left only after the owner approved.",
  ].join("\n");
}

export function SpecialistWorkforce() {
  const baseId = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [selected, setSelected] = useState(0);
  const [approvedAt, setApprovedAt] = useState<string | null>(null);
  const [exported, setExported] = useState(false);
  const role = ROLES[selected] ?? ROLES[0];
  const approved = approvedAt !== null;
  const panelId = `${baseId}-panel`;
  const hintId = `${baseId}-hint`;
  const statusId = `${baseId}-status`;

  function selectRole(index: number) {
    const next = (index + ROLES.length) % ROLES.length;
    setSelected(next);
    tabRefs.current[next]?.focus();
  }

  function onTabsKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const last = ROLES.length - 1;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") selectRole(selected + 1);
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") selectRole(selected - 1);
    else if (event.key === "Home") selectRole(0);
    else if (event.key === "End") selectRole(last);
    else return;
    event.preventDefault();
  }

  function onApprove() {
    if (approved) return;
    if (role.id !== "export") {
      setSelected(ROLES.length - 1);
      return;
    }
    setApprovedAt(new Date().toISOString());
  }

  function onExport() {
    if (!approvedAt) return;
    downloadText("deliverx-specialist-workforce-pack.md", packMarkdown(approvedAt));
    setExported(true);
  }

  const artefact =
    role.id === "export" && approved ? "Pack released after your approval." : role.artefact;
  const hint = approved
    ? "You approved this export. The Export specialist could not approve it."
    : role.id === "export"
      ? "The pack is held. Your approval is what releases the export."
      : "Open Export when you are ready. Approval stays with you.";
  const status = exported
    ? "Sample pack exported. It is a simulated walkthrough, not an observed product."
    : approved
      ? "You approved the export. The pack can leave."
      : "Export is held until you approve it.";

  return (
    <div className="psi-walkthrough psi-workforce">
      <div
        className="psi-step-selector"
        role="tablist"
        aria-label="Working specialist roles. Arrow keys move between roles."
        onKeyDown={onTabsKeyDown}
      >
        {ROLES.map((item, index) => {
          const tabId = `${baseId}-tab-${item.id}`;
          const isSelected = item.id === role.id;
          return (
            <button
              key={item.id}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              id={tabId}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-controls={panelId}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => setSelected(index)}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              {item.label}
            </button>
          );
        })}
      </div>
      <div className="psi-walk-panel">
        <SpecialistScene role={role.id} released={approved && role.id === "export"} />
        <div
          className="psi-walk-copy"
          role="tabpanel"
          id={panelId}
          aria-labelledby={`${baseId}-tab-${role.id}`}
          tabIndex={0}
        >
          <p className="psi-label">Task finished</p>
          <h2>{role.task}</h2>
          <dl className="psi-workforce-facts">
            <div>
              <dt>Reason</dt>
              <dd>{role.reason}</dd>
            </div>
            <div>
              <dt>Evidence</dt>
              <dd>{role.evidence}</dd>
            </div>
            <div>
              <dt>Artefact handed on</dt>
              <dd>{artefact}</dd>
            </div>
          </dl>
        </div>
      </div>
      <div className="psi-workforce-gate">
        <p id={hintId}>{hint}</p>
        <div className="psi-workforce-actions">
          <button
            type="button"
            className="dxl-btn dxl-btn-primary"
            onClick={onApprove}
            disabled={approved}
          >
            {approved
              ? "Approved by you"
              : role.id === "export"
                ? "Approve as owner"
                : "Review the held export"}
          </button>
          <button
            type="button"
            className="dxl-btn dxl-btn-ghost"
            onClick={onExport}
            disabled={!approved}
            aria-describedby={hintId}
          >
            Export the pack
          </button>
        </div>
        <p id={statusId} role="status">
          {status}
        </p>
      </div>
    </div>
  );
}

const SCENE_ART: Record<RoleId, { src: string; alt: string }> = {
  evidence: {
    src: "/illustrations/role-evidence.webp",
    alt: "Source cards under a magnifying glass, with one empty card left open.",
  },
  options: {
    src: "/illustrations/role-options.webp",
    alt: "Three option cards compared on one shared platform.",
  },
  challenge: {
    src: "/illustrations/role-challenge.webp",
    alt: "A recommendation crossed by a clipboard and a flag.",
  },
  decision: {
    src: "/illustrations/role-decision.webp",
    alt: "A decision dossier beside an empty approval seal.",
  },
  builder: {
    src: "/illustrations/role-builder.webp",
    alt: "Blocks assembled inside a frame, next to a blank interface.",
  },
  export: {
    src: "/illustrations/role-export-held.webp",
    alt: "A bound pack with the latch closed.",
  },
};

const RELEASED_EXPORT = {
  src: "/illustrations/role-export-released.webp",
  alt: "The pack latch is open after the owner approved the export.",
};

function sceneCaption(role: RoleId, released = false) {
  if (role === "export" && released) return "The latch is open after your approval.";
  return ROLES.find((item) => item.id === role)?.scene ?? "";
}

/** Same clay workbench family as the homepage, product, and example-mission scenes. */
export function SpecialistScene({ role, released = false }: { role: RoleId; released?: boolean }) {
  const art = role === "export" && released ? RELEASED_EXPORT : SCENE_ART[role];
  return (
    <figure className="psi-walk-art">
      <img
        key={art.src}
        className="psi-workforce-scene"
        src={art.src}
        width={1152}
        height={864}
        alt={art.alt}
      />
      <figcaption className="psi-example-tag">{sceneCaption(role, released)}</figcaption>
    </figure>
  );
}
