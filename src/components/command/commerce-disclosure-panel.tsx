import { commerceSnapshot } from "@/lib/pilot-mission/commerce";
import type { SupervisedMission } from "@/lib/pilot-mission/types";

/** P-commerce — customer disclosure of units, billable events, and remedies (paid availability off). */
export function CommerceDisclosurePanel({ mission }: { mission: SupervisedMission }) {
  const snap = commerceSnapshot(mission);

  return (
    <section className="cc-panel" id="commerce-disclosure" aria-label="Commerce disclosure">
      <h2 className="cc-panel-title">Allowance &amp; unit rules</h2>
      <p className="cc-muted text-sm">
        {snap.unitLabel} · {snap.consumed}/{snap.ceiling} used · paid availability off
      </p>
      {snap.hardStopped ? (
        <p className="cc-error mt-2 text-sm" role="status">
          {snap.hardStopDetail}
        </p>
      ) : null}
      <ul className="mt-3 grid gap-1 text-sm cc-muted">
        {snap.disclosureLines.map((line) => (
          <li key={line.slice(0, 48)}>{line}</li>
        ))}
      </ul>
      <details className="mt-3">
        <summary className="cursor-pointer text-sm font-medium">What consumes allowance</summary>
        <ul className="mt-2 grid gap-2 text-sm">
          {snap.events.map((event) => (
            <li key={event.kind}>
              <span className="cc-chip">
                {event.billable ? "Billable" : "Free"} · {event.label}
              </span>
              <p className="cc-muted mt-1">{event.note}</p>
            </li>
          ))}
        </ul>
      </details>
      <details className="mt-2">
        <summary className="cursor-pointer text-sm font-medium">Failure vs pause remedies</summary>
        <ul className="mt-2 grid gap-2 text-sm cc-muted">
          {snap.remedies.map((remedy) => (
            <li key={remedy.id}>
              <strong>{remedy.situation}.</strong> {remedy.treatment}
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
