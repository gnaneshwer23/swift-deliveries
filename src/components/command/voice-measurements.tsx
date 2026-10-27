import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getVoiceMeasurements } from "@/lib/conversation.functions";
import type { VoiceSummary } from "@/lib/conversation/voice-metrics";

const secs = (ms: number | null) => (ms === null ? "–" : `${(ms / 1000).toFixed(1)} s`);
const pct = (share: number | null) => (share === null ? "–" : `${Math.round(share * 100)}%`);

/**
 * How voice has performed in this workspace over the last 30 days: speed,
 * corrections and interruptions. Read only when opened. Each line says what
 * was measured and what is assumed.
 */
export function VoiceMeasurements() {
  const [open, setOpen] = useState(false);
  return (
    <details className="text-sm" onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary className="cursor-pointer">Voice measurements</summary>
      {open ? <MeasurementsBody /> : null}
    </details>
  );
}

function MeasurementsBody() {
  const q = useQuery({
    queryKey: ["command", "voice", "measurements"],
    queryFn: () => getVoiceMeasurements(),
  });
  if (q.isPending) return <p className="text-slate-600 mt-1">Loading…</p>;
  if (q.isError) return <p className="cc-error mt-1">Measurements could not be loaded.</p>;
  if (!q.data.available)
    return (
      <p className="text-slate-600 mt-1">
        Measurements start once their database update (migration 0031) is applied. Until then,
        nothing is recorded.
      </p>
    );
  const s = q.data.summary as VoiceSummary;
  if (!s.turns && !s.interruptions && !s.drops && !s.reconnects && !s.reconnectsFailed)
    return <p className="text-slate-600 mt-1">Nothing measured in the last {q.data.days} days.</p>;
  return (
    <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
      <dt className="font-medium">Spoken lines</dt>
      <dd>
        {s.turns} in the last {q.data.days} days
      </dd>
      <dt className="font-medium">Send → transcript</dt>
      <dd>
        typical {secs(s.transcriptMs.median)}, slowest 5% {secs(s.transcriptMs.p95)}
      </dd>
      <dt className="font-medium">Transcript → reply</dt>
      <dd>
        typical {secs(s.replyMs.median)}, slowest 5% {secs(s.replyMs.p95)}
      </dd>
      <dt className="font-medium">Recognition</dt>
      <dd>
        {pct(s.correctedShare)} of spoken lines were corrected
        {s.wordChangeWhenCorrected !== null
          ? `; a correction changed ${pct(s.wordChangeWhenCorrected)} of the words on average`
          : ""}
        . Lines you didn't correct are counted as heard right; that is an assumption, not a check.
      </dd>
      <dt className="font-medium">Interruptions</dt>
      <dd>{s.interruptions} times a spoken reply was stopped or talked over; no mission changed</dd>
      <dt className="font-medium">Connection</dt>
      <dd>
        {s.drops} dropped, {s.reconnects} reconnected, {s.reconnectsFailed} couldn't reconnect
      </dd>
    </dl>
  );
}
