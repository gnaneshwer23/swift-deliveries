import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { saveSupervisedWatchtower } from "@/lib/pilot-mission.functions";
import {
  emptyWatchtowerConfig,
  type WatchtowerFrequency,
  WATCHTOWER_HONESTY,
} from "@/lib/pilot-mission/watchtower";
import type { SupervisedMission } from "@/lib/pilot-mission/types";

/** PT-6 — optional monitoring preferences; never claims continuous agent work. */
export function WatchtowerPanel({
  mission,
  recordVersion,
  missionId,
  onDone,
  onError,
}: {
  mission: SupervisedMission;
  recordVersion: number;
  missionId: string;
  onDone: () => Promise<void>;
  onError: (error: unknown) => void;
}) {
  const existing = mission.watchtower ?? emptyWatchtowerConfig(new Date().toISOString());
  const [enabled, setEnabled] = useState(existing.enabled);
  const [topics, setTopics] = useState(existing.topics.join(", "));
  const [competitors, setCompetitors] = useState(existing.competitors.join(", "));
  const [sourcesNote, setSourcesNote] = useState(existing.sourcesNote);
  const [frequency, setFrequency] = useState<WatchtowerFrequency>(existing.frequency);
  const [geography, setGeography] = useState(existing.geography);
  const [budget, setBudget] = useState(String(existing.budgetCeilingUnits));
  const [notify, setNotify] = useState(existing.notify);

  const save = useMutation({
    mutationFn: () =>
      saveSupervisedWatchtower({
        data: {
          id: missionId,
          expectedVersion: recordVersion,
          enabled,
          topics: topics.split(",").map((t) => t.trim()).filter(Boolean),
          competitors: competitors.split(",").map((t) => t.trim()).filter(Boolean),
          sourcesNote,
          frequency,
          geography,
          budgetCeilingUnits: Number(budget) || 0,
          notify,
          pauseUntil: null,
        },
      }),
    onSuccess: onDone,
    onError,
  });

  return (
    <section className="cc-panel" id="pr-monitoring" aria-label="Watchtower">
      <h2 className="cc-panel-title">Watchtower</h2>
      <p className="cc-muted text-sm">{WATCHTOWER_HONESTY}</p>
      <p className="cc-muted mt-1 text-xs">
        Last successful check: {existing.lastSuccessfulCheckAt ?? "none"} · Next scheduled:{" "}
        {existing.nextScheduledCheckAt ?? "none"} · Failures: {existing.lastFailure ?? "none"}
      </p>
      <form
        className="mt-3 grid gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          save.mutate();
        }}
      >
        <label className="cc-label">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />{" "}
          Enable preferences (does not start a runner)
        </label>
        <label className="cc-label" htmlFor="wt-topics">
          Topics
        </label>
        <input
          id="wt-topics"
          className="cc-input"
          value={topics}
          onChange={(e) => setTopics(e.target.value)}
          placeholder="pricing, feature launches"
        />
        <label className="cc-label" htmlFor="wt-competitors">
          Competitors
        </label>
        <input
          id="wt-competitors"
          className="cc-input"
          value={competitors}
          onChange={(e) => setCompetitors(e.target.value)}
          placeholder="Competitor A, Competitor B"
        />
        <label className="cc-label" htmlFor="wt-sources">
          Sources note
        </label>
        <textarea
          id="wt-sources"
          className="cc-input cc-textarea"
          rows={2}
          value={sourcesNote}
          onChange={(e) => setSourcesNote(e.target.value)}
        />
        <label className="cc-label" htmlFor="wt-freq">
          Frequency
        </label>
        <select
          id="wt-freq"
          className="cc-input"
          value={frequency}
          onChange={(e) => setFrequency(e.target.value as WatchtowerFrequency)}
        >
          <option value="off">Off</option>
          <option value="weekly">Weekly (when runner exists)</option>
          <option value="monthly">Monthly (when runner exists)</option>
        </select>
        <label className="cc-label" htmlFor="wt-geo">
          Geography
        </label>
        <input
          id="wt-geo"
          className="cc-input"
          value={geography}
          onChange={(e) => setGeography(e.target.value)}
        />
        <label className="cc-label" htmlFor="wt-budget">
          Budget ceiling (units)
        </label>
        <input
          id="wt-budget"
          className="cc-input"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
        />
        <label className="cc-label" htmlFor="wt-notify">
          Notifications
        </label>
        <select
          id="wt-notify"
          className="cc-input"
          value={notify}
          onChange={(e) => setNotify(e.target.value as typeof notify)}
        >
          <option value="off">Off</option>
          <option value="digest">Digest</option>
          <option value="important">Important only</option>
        </select>
        <div>
          <button type="submit" className="cc-btn cc-btn-secondary" disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save Watchtower preferences"}
          </button>
        </div>
      </form>
    </section>
  );
}
