import { describe, expect, it } from "vitest";
import { median, percentile, summarise, wordChange, type VoiceMetric } from "./voice-metrics";

const turn = (over: Partial<VoiceMetric> = {}): VoiceMetric => ({
  kind: "turn",
  transcriptMs: 800,
  replyMs: 300,
  corrected: false,
  wordChange: null,
  ...over,
});

describe("word change from a correction", () => {
  it("counts words substituted, added or dropped, against the words heard", () => {
    expect(wordChange("find out whether thirty tutors pay", "find out whether 13 tutors pay")).toBe(
      1 / 6,
    );
    expect(wordChange("pause the mission", "pause the mission")).toBe(0);
    expect(wordChange("cancel", "do not cancel the mission")).toBe(1);
    expect(wordChange("", "anything")).toBe(1);
  });

  it("treats curly and straight apostrophes as the same word", () => {
    expect(wordChange("don’t cancel it", "don't cancel it")).toBe(0);
  });
});

describe("percentiles", () => {
  it("uses the nearest rank", () => {
    const xs = Array.from({ length: 20 }, (_, i) => (i + 1) * 100);
    expect(percentile(xs, 50)).toBe(1000);
    expect(percentile(xs, 95)).toBe(1900);
    expect(percentile([], 50)).toBeNull();
  });

  it("takes the mean of the two middle values for an even-length median", () => {
    expect(median([400, 200])).toBe(300);
    expect(median([200, 300, 900])).toBe(300);
    expect(median([])).toBeNull();
  });
});

describe("summary", () => {
  it("reports timings, corrections and interruptions without inventing anything", () => {
    const s = summarise([
      turn({ transcriptMs: 600, replyMs: 200 }),
      turn({ transcriptMs: 900, replyMs: 400, corrected: true, wordChange: 0.25 }),
      turn({ transcriptMs: 1200, replyMs: null }),
      {
        kind: "interruption",
        transcriptMs: null,
        replyMs: null,
        corrected: false,
        wordChange: null,
      },
      { kind: "drop", transcriptMs: null, replyMs: null, corrected: false, wordChange: null },
      { kind: "reconnect", transcriptMs: null, replyMs: null, corrected: false, wordChange: null },
      {
        kind: "reconnect_failed",
        transcriptMs: null,
        replyMs: null,
        corrected: false,
        wordChange: null,
      },
    ]);
    expect(s).toEqual({
      turns: 3,
      transcriptMs: { median: 900, p95: 1200 },
      replyMs: { median: 300, p95: 400 },
      correctedShare: 1 / 3,
      wordChangeWhenCorrected: 0.25,
      interruptions: 1,
      drops: 1,
      reconnects: 1,
      reconnectsFailed: 1,
    });
  });

  it("says nothing it has no data for", () => {
    expect(summarise([])).toMatchObject({
      turns: 0,
      transcriptMs: { median: null, p95: null },
      correctedShare: null,
      wordChangeWhenCorrected: null,
    });
  });
});
