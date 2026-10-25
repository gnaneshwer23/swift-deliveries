/**
 * Live flow over the Product Brain artwork: work moving through each layer,
 * drawn in the artwork's own coordinates (viewBox 490 0 1046 1024).
 * Handoff into delivery only flows once the example approval is given.
 */
type Layer = "evidence" | "judgement" | "delivery" | "feedback";

const SEGMENTS: Array<{
  id: string;
  layer: Layer;
  d: string;
  dur: number;
  gated?: boolean;
}> = [
  { id: "collect", layer: "evidence", d: "M 705 793 L 850 814 L 1000 819 L 1175 832", dur: 3.6 },
  { id: "to-judgement", layer: "evidence", d: "M 690 780 C 510 760 510 550 720 490", dur: 3.2 },
  {
    id: "compare",
    layer: "judgement",
    d: "M 760 490 C 825 425 900 445 970 505 L 1160 505",
    dur: 3.4,
  },
  {
    id: "approval",
    layer: "judgement",
    d: "M 1195 470 L 1195 330 L 1192 240",
    dur: 2.4,
    gated: true,
  },
  { id: "build", layer: "delivery", d: "M 700 180 L 865 188 L 1025 185 L 1190 190", dur: 3.8 },
  { id: "observe", layer: "feedback", d: "M 1285 220 C 1510 250 1510 790 1300 850", dur: 4.6 },
];

export function LiveFlow({
  layer,
  live,
  approved,
  waiting,
  boost,
}: {
  layer: Layer;
  live: boolean;
  approved: boolean;
  waiting: boolean;
  boost: boolean;
}) {
  return (
    <g className="brain-live" data-boost={boost || undefined}>
      {SEGMENTS.map((seg) => {
        const focus = seg.layer === layer || (layer === "feedback" && seg.id === "observe");
        const open = !seg.gated || approved;
        return (
          <g
            key={seg.id}
            className="brain-live-seg"
            data-focus={focus || undefined}
            data-held={!open || undefined}
          >
            <path d={seg.d} className="brain-live-track" />
            {open && <path d={seg.d} className="brain-live-dash" pathLength={100} />}
            {live &&
              open &&
              [0, 1, 2].map((i) => (
                <circle key={i} r={focus ? 6 : 4} className="brain-live-dot">
                  <animateMotion
                    dur={`${seg.dur}s`}
                    begin={`${(-seg.dur / 3) * i}s`}
                    repeatCount="indefinite"
                    path={seg.d}
                    keyPoints="0;1"
                    keyTimes="0;1"
                    calcMode="linear"
                  />
                  <animate
                    attributeName="opacity"
                    values="0;1;1;0"
                    keyTimes="0;0.12;0.85;1"
                    dur={`${seg.dur}s`}
                    begin={`${(-seg.dur / 3) * i}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              ))}
          </g>
        );
      })}
      {/* The approval gate holds work until the owner decides. */}
      <g
        className="brain-gate"
        data-waiting={waiting || undefined}
        data-open={approved || undefined}
      >
        <circle cx="1185" cy="505" r="26" className="brain-gate-ring" />
        {live && !approved && (
          <circle cx="1185" cy="505" r="26" className="brain-gate-pulse">
            <animate attributeName="r" values="26;44" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.7;0" dur="2s" repeatCount="indefinite" />
          </circle>
        )}
      </g>
    </g>
  );
}
