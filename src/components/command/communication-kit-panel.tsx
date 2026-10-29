import { useState } from "react";
import {
  buildCommunicationKit,
  type CommunicationAudience,
} from "@/lib/pilot-mission/communication-kit";
import type { SupervisedMission } from "@/lib/pilot-mission/types";

const AUDIENCES: { id: CommunicationAudience; label: string }[] = [
  { id: "internal", label: "Internal" },
  { id: "investor", label: "Investor" },
  { id: "customer", label: "Customer" },
  { id: "partner", label: "Partner" },
];

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function CopyBlock({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="ps-indigo-copy-block">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="ps-exec-section-kicker mb-0">{label}</p>
        <button
          type="button"
          className="cc-btn cc-btn-ghost"
          onClick={() => {
            void copyText(text).then((ok) => {
              if (ok) {
                setCopied(true);
                window.setTimeout(() => setCopied(false), 2000);
              }
            });
          }}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="text-sm whitespace-pre-wrap mb-0">{text}</p>
    </div>
  );
}

export function CommunicationKitPanel({ mission }: { mission: SupervisedMission }) {
  const [audience, setAudience] = useState<CommunicationAudience>("internal");
  const kit = buildCommunicationKit(mission, audience);

  return (
    <section className="ps-indigo-kit" aria-label="Communication kit">
      <header className="mb-3">
        <p className="ps-exec-section-kicker">Communication kit</p>
        <p className="cc-muted text-sm mb-0">
          Copy is derived from your brief and evidence register — not empirically anchored unless
          cited ids are on the record.
        </p>
      </header>

      <div className="ps-exec-segment-tabs mb-4" role="tablist" aria-label="Audience">
        {AUDIENCES.map((a) => (
          <button
            key={a.id}
            type="button"
            role="tab"
            aria-selected={audience === a.id}
            className={audience === a.id ? "is-active" : undefined}
            onClick={() => setAudience(a.id)}
          >
            {a.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        <CopyBlock label="One sentence" text={kit.oneSentence} />
        <CopyBlock label="Problem statement" text={kit.problem} />
        <CopyBlock label="30-second pitch" text={kit.pitch30s} />
        <CopyBlock label="Stakeholder brief" text={kit.stakeholderBrief} />
      </div>

      <section className="ps-exec-card mt-4" aria-label="Claims boundary">
        <p className="ps-exec-section-kicker">Claims boundary</p>
        <ul className="cc-muted text-sm ps-indigo-list">
          {[...kit.claimsBoundary.onRecord, ...kit.claimsBoundary.notClaimed].map((line) => (
            <li key={line.slice(0, 48)}>{line}</li>
          ))}
        </ul>
        <p className="ps-exec-meta mt-2 mb-0">
          Production labels on this case: {kit.productionLabels.join(" · ")}
        </p>
      </section>

      <section className="ps-exec-card mt-4" aria-label="Objection radar">
        <p className="ps-exec-section-kicker">Objection radar</p>
        <ul className="cc-muted text-sm ps-indigo-list mb-0">
          {kit.objectionRadar.map((line) => (
            <li key={line.slice(0, 48)}>{line}</li>
          ))}
        </ul>
      </section>
    </section>
  );
}
