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
        <figure className="psi-walk-art">
          <WorkforceScene role={role.id} released={approved && role.id === "export"} />
          <figcaption className="psi-example-tag">
            {approved && role.id === "export"
              ? "The latch is open after your approval."
              : role.scene}
          </figcaption>
        </figure>
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

function WorkforceScene({ role, released }: { role: RoleId; released: boolean }) {
  return (
    <svg viewBox="0 0 640 420" className="psi-workforce-scene" aria-hidden="true">
      <ellipse cx="320" cy="372" rx="176" ry="14" fill="#d5e3f6" />
      {role === "evidence" && <EvidenceScene />}
      {role === "options" && <OptionsScene />}
      {role === "challenge" && <ChallengeScene />}
      {role === "decision" && <DecisionScene />}
      {role === "builder" && <BuilderScene />}
      {role === "export" && <ExportScene released={released} />}
    </svg>
  );
}

function EvidenceScene() {
  return (
    <g>
      <g transform="rotate(-8 150 210)">
        <rect x="78" y="128" width="132" height="168" rx="16" fill="#d5e3f6" />
        <rect x="68" y="116" width="132" height="168" rx="16" fill="#fff" />
        <rect x="88" y="148" width="72" height="8" rx="4" fill="#b7c9e6" />
        <rect x="88" y="168" width="48" height="8" rx="4" fill="#e1e9f5" />
        <rect x="88" y="196" width="88" height="44" rx="8" fill="#eef3fb" />
      </g>
      <rect x="236" y="86" width="268" height="250" rx="20" fill="#c9daf3" />
      <rect x="220" y="72" width="268" height="250" rx="20" fill="#fff" />
      <rect x="248" y="104" width="120" height="10" rx="5" fill="#1c2b45" />
      <rect x="248" y="132" width="196" height="8" rx="4" fill="#d5e0ef" />
      <rect x="248" y="152" width="168" height="8" rx="4" fill="#e6edf6" />
      <rect x="248" y="180" width="196" height="8" rx="4" fill="#d5e0ef" />
      <rect x="248" y="200" width="140" height="8" rx="4" fill="#e6edf6" />
      <rect
        x="248"
        y="236"
        width="168"
        height="42"
        rx="10"
        fill="#f7f9fc"
        stroke="#7f9ed4"
        strokeDasharray="5 4"
      />
      <circle cx="268" cy="257" r="5" fill="none" stroke="#4d6fe3" strokeWidth="1.5" />
    </g>
  );
}

function OptionsScene() {
  return (
    <g>
      <rect x="118" y="318" width="404" height="3" rx="1.5" fill="#b7c9e6" />
      <rect x="148" y="206" width="108" height="112" rx="16" fill="#d5e3f6" />
      <rect x="136" y="194" width="108" height="112" rx="16" fill="#fff" />
      <rect x="156" y="222" width="64" height="8" rx="4" fill="#c5d4ea" />
      <rect x="156" y="242" width="44" height="8" rx="4" fill="#e6edf6" />
      <rect x="292" y="132" width="124" height="186" rx="18" fill="#c9daf3" />
      <rect x="276" y="116" width="124" height="186" rx="18" fill="#fff" />
      <rect x="298" y="148" width="78" height="10" rx="5" fill="#1c2b45" />
      <rect x="298" y="174" width="80" height="8" rx="4" fill="#d5e0ef" />
      <rect x="298" y="194" width="56" height="8" rx="4" fill="#e6edf6" />
      <rect x="298" y="222" width="80" height="36" rx="8" fill="#e8e4f8" />
      <rect x="430" y="176" width="108" height="142" rx="16" fill="#ddd6f4" />
      <rect x="418" y="164" width="108" height="142" rx="16" fill="#f7f4ff" />
      <rect x="438" y="194" width="64" height="8" rx="4" fill="#c9c0ee" />
      <rect x="438" y="214" width="44" height="8" rx="4" fill="#e4dff8" />
      <path d="M190 168 C240 120 400 120 472 150" fill="none" stroke="#8aa4d4" strokeWidth="1.5" />
    </g>
  );
}

function ChallengeScene() {
  return (
    <g>
      <rect x="168" y="98" width="280" height="220" rx="20" fill="#d5e3f6" />
      <rect x="152" y="84" width="280" height="220" rx="20" fill="#fff" />
      <rect x="180" y="116" width="140" height="10" rx="5" fill="#1c2b45" />
      <rect x="180" y="146" width="196" height="8" rx="4" fill="#d5e0ef" />
      <rect x="180" y="166" width="160" height="8" rx="4" fill="#e6edf6" />
      <rect x="180" y="194" width="196" height="8" rx="4" fill="#d5e0ef" />
      <g transform="rotate(8 430 210)">
        <rect
          x="330"
          y="128"
          width="176"
          height="168"
          rx="18"
          fill="none"
          stroke="#4d6fe3"
          strokeWidth="2"
        />
        <rect x="354" y="164" width="96" height="8" rx="4" fill="#c9c0ee" />
        <rect x="354" y="184" width="72" height="8" rx="4" fill="#e4dff8" />
        <rect x="354" y="214" width="28" height="28" rx="6" fill="#e8e4f8" />
      </g>
    </g>
  );
}

function DecisionScene() {
  return (
    <g>
      <rect x="96" y="124" width="300" height="196" rx="20" fill="#c9daf3" />
      <rect x="80" y="108" width="300" height="196" rx="20" fill="#fff" />
      <rect x="120" y="140" width="150" height="10" rx="5" fill="#1c2b45" />
      <rect x="120" y="168" width="180" height="8" rx="4" fill="#d5e0ef" />
      <rect x="120" y="188" width="150" height="8" rx="4" fill="#e6edf6" />
      <rect x="120" y="216" width="180" height="8" rx="4" fill="#d5e0ef" />
      <rect x="120" y="244" width="96" height="24" rx="8" fill="#eef3fb" />
      <circle cx="478" cy="202" r="46" fill="#f4f7fc" stroke="#4d6fe3" strokeWidth="2" />
      <circle cx="478" cy="202" r="30" fill="none" stroke="#c5d4ea" strokeWidth="1.5" />
    </g>
  );
}

function BuilderScene() {
  return (
    <g>
      <rect x="196" y="86" width="292" height="236" rx="22" fill="#c9daf3" />
      <rect x="180" y="70" width="292" height="236" rx="22" fill="#fff" />
      <rect x="180" y="70" width="292" height="36" rx="22" fill="#f4f7fc" />
      <rect x="180" y="90" width="292" height="16" fill="#f4f7fc" />
      <circle cx="204" cy="88" r="5" fill="#d5e0ef" />
      <circle cx="222" cy="88" r="5" fill="#c9c0ee" />
      <circle cx="240" cy="88" r="5" fill="#b7c9e6" />
      <rect x="204" y="124" width="116" height="140" rx="12" fill="#eef3fb" />
      <rect x="336" y="124" width="112" height="64" rx="12" fill="#e8e4f8" />
      <rect x="336" y="200" width="112" height="64" rx="12" fill="#f7f4ff" />
      <rect x="86" y="168" width="72" height="88" rx="12" fill="#d5e3f6" />
      <rect x="74" y="156" width="72" height="88" rx="12" fill="#fff" />
      <rect x="90" y="178" width="40" height="6" rx="3" fill="#1c2b45" />
      <rect x="90" y="194" width="40" height="6" rx="3" fill="#d5e0ef" />
      <path d="M146 200 H180" fill="none" stroke="#8aa4d4" strokeWidth="1.5" />
    </g>
  );
}

function ExportScene({ released }: { released: boolean }) {
  return (
    <g>
      <rect x="214" y="168" width="230" height="160" rx="16" fill="#d5e3f6" />
      <rect x="198" y="152" width="230" height="160" rx="16" fill="#e8e4f8" />
      <g className={released ? "psi-export-sheet is-released" : "psi-export-sheet"}>
        <rect x="186" y="112" width="230" height="160" rx="16" fill="#c9daf3" />
        <rect x="170" y="96" width="230" height="160" rx="16" fill="#fff" />
        <rect x="196" y="124" width="110" height="10" rx="5" fill="#1c2b45" />
        <rect x="196" y="148" width="160" height="8" rx="4" fill="#d5e0ef" />
        <rect x="196" y="168" width="128" height="8" rx="4" fill="#e6edf6" />
        <rect x="196" y="196" width="84" height="24" rx="8" fill="#eef3fb" />
      </g>
      <g className={released ? "psi-export-latch is-released" : "psi-export-latch"}>
        <rect x="292" y="78" width="56" height="16" rx="8" fill="#4d6fe3" />
        <rect x="308" y="78" width="24" height="70" rx="8" fill="#1c2b45" />
      </g>
    </g>
  );
}
