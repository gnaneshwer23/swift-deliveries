import { Check, Hourglass, Lock } from "lucide-react";
import { useId, type ReactNode } from "react";
import { Agent, Card, Cube, FloatIcon, Glass, IsoDefs, Particles, Plate } from "./iso";
import { iso, pathOf, topMatrix, type P3, type Pt } from "./iso-geometry";
import {
  A,
  AD,
  BRAIN_VIEWBOX,
  POD,
  POD_H,
  ROW_Y,
  STATIONS,
  TH,
  add,
  stationAt,
  stationById,
  tierAt,
  type BrainObject,
  type BrainTier,
} from "./product-brain-layout";

const LANE = ROW_Y + 58;
const TITLES: Record<BrainTier, string> = {
  evidence: "01  EVIDENCE & MEMORY",
  judgement: "02  JUDGEMENT",
  delivery: "03  DELIVERY",
};

/** The object that stands on each station's pedestal. */
function StationArt({ id, at, pid, on }: { id: BrainObject; at: P3; pid: string; on: boolean }) {
  const top = add(at, [0, 0, POD_H]);
  const lift = (dx: number, dy: number, dz: number) => add(top, [dx, dy, dz]);
  const art: Record<BrainObject, ReactNode> = {
    sources: (
      <>
        <Card at={lift(0, 0, 2)} w={30} d={22} lines={2} />
        <Card at={lift(-2, -2, 6)} w={30} d={22} lines={2} />
        <g className="ix-float">
          <Card at={lift(-4, -4, 12)} w={30} d={22} lines={3} />
        </g>
      </>
    ),
    notes: (
      <>
        <Card at={lift(0, 0, 4)} w={28} d={30} lines={4} />
        <Agent id={pid} at={lift(10, -14, 4)} scale={0.62} />
      </>
    ),
    research: (
      <Glass id={pid} at={top} r={16} h={36}>
        <g className="ix-float" data-delay="1">
          <Card at={lift(0, 0, 18)} w={16} d={12} lines={2} />
        </g>
      </Glass>
    ),
    results: (
      <>
        <Cube at={lift(-9, 6, 0)} s={10} tone="mid" />
        <Cube at={lift(0, 0, 0)} s={10} tone="mid" />
        <Cube at={lift(0, 0, 10)} s={10} tone="mid" />
        <Cube at={lift(9, -6, 0)} s={10} tone="mid" />
        <Cube at={lift(9, -6, 10)} s={10} tone="mid" />
        <Cube at={lift(9, -6, 20)} s={10} tone={on ? "lit" : "mid"} />
      </>
    ),
    strategy: (
      <>
        <Agent id={pid} at={lift(-10, -8, 0)} scale={0.72} />
        <Agent id={pid} at={lift(10, -8, 0)} scale={0.72} />
        <Agent id={pid} at={lift(0, 8, 0)} scale={0.72} lit={on} />
      </>
    ),
    review: (
      <Glass id={pid} at={top} r={18} h={38}>
        <Agent id={pid} at={lift(-5, -4, 1)} scale={0.62} />
        <Agent id={pid} at={lift(6, 5, 1)} scale={0.62} lit={on} />
      </Glass>
    ),
    human: (
      <g className="ix-learner">
        <Agent id={pid} at={lift(0, 2, 0)} scale={1.05} lit />
      </g>
    ),
    design: (
      <>
        <Card at={lift(0, 0, 3)} w={32} d={26} lines={0} />
        <path
          d={pathOf(
            [
              [-10, -7],
              [4, -7],
              [4, 1],
              [-10, 1],
            ].map(([x, y]) => iso(lift(x!, y!, 3.1))),
          )}
          className="ix-wire"
        />
        <path
          d={pathOf(
            [
              [-10, 4],
              [10, 4],
              [10, 8],
              [-10, 8],
            ].map(([x, y]) => iso(lift(x!, y!, 3.1))),
          )}
          className="ix-wire"
        />
        <Cube at={lift(9, -6, 3)} s={7} tone={on ? "lit" : "mid"} />
      </>
    ),
    engineering: (
      <>
        {(
          [
            [-6, -6, 0],
            [6, -6, 0],
            [-6, 6, 0],
            [6, 6, 0],
            [-6, -6, 12],
            [6, -6, 12],
            [-6, 6, 12],
          ] as Array<[number, number, number]>
        ).map(([x, y, z], i) => (
          <Cube key={i} at={lift(x, y, z)} s={12} tone="mid" />
        ))}
        <g className="ix-float" data-delay="2">
          <Cube at={lift(6, 6, 18)} s={12} tone={on ? "lit" : "mid"} />
        </g>
      </>
    ),
    qa: (
      <Glass id={pid} at={top} r={16} h={36}>
        <Cube at={lift(0, 0, 1)} s={12} tone={on ? "lit" : "mid"} />
      </Glass>
    ),
    export: (
      <>
        <Card at={lift(0, 0, 2)} w={30} d={24} lines={0} />
        <Card at={lift(0, 0, 5)} w={30} d={24} lines={0} />
        <Card at={lift(0, 0, 8)} w={30} d={24} lines={3} />
      </>
    ),
  };
  return <>{art[id]}</>;
}

export function ProductBrainIllustration({
  layer,
  selected,
  waiting = false,
  approved = false,
  hold = false,
  live = true,
}: {
  layer: BrainTier | "feedback";
  selected: BrainObject;
  waiting?: boolean;
  approved?: boolean;
  /** Stop work past the owner gate; the loop runs end to end otherwise. */
  hold?: boolean;
  live?: boolean;
}) {
  const pid = `pb${useId().replaceAll(":", "")}`;
  void A;
  const lane = (k: number, from: number, to: number): [Pt, Pt] => [
    iso(add(tierAt(k), [from, LANE, 1])),
    iso(add(tierAt(k), [to, LANE, 1])),
  ];
  const [e0, e1] = lane(0, -122, 122);
  const [j1, j0] = lane(1, -112, 122);
  const [d0, d1] = lane(2, -122, 122);
  const results = iso(add(stationAt(stationById("results")), [POD + 4, 0, -2]));
  const paths = {
    evidence: `M${e0[0]} ${e0[1]} L${e1[0]} ${e1[1]}`,
    toJudgement: `M${e1[0]} ${e1[1]} C${e1[0] + 90} ${e1[1] - 10} ${j0[0] + 40} ${j0[1] + 90} ${j0[0]} ${j0[1]}`,
    judgement: `M${j0[0]} ${j0[1]} L${j1[0]} ${j1[1]}`,
    toDelivery: `M${j1[0]} ${j1[1]} C${j1[0] - 90} ${j1[1] - 10} ${d0[0] - 70} ${d0[1] + 80} ${d0[0]} ${d0[1]}`,
    delivery: `M${d0[0]} ${d0[1]} L${d1[0]} ${d1[1]}`,
    feedback: `M${d1[0]} ${d1[1]} C${d1[0] + 150} ${d1[1] + 40} ${results[0] + 330} ${results[1] - 90} ${results[0]} ${results[1]}`,
  };
  const cp = [j1, [j1[0] - 90, j1[1] - 10], [d0[0] - 70, d0[1] + 80], d0] as const;
  // the checkpoint sits on the open stretch of the handoff, clear of both decks
  const bez = (t: number, i: 0 | 1) =>
    (1 - t) ** 3 * cp[0][i] +
    3 * (1 - t) ** 2 * t * cp[1][i] +
    3 * (1 - t) * t ** 2 * cp[2][i] +
    t ** 3 * cp[3][i];
  const onLine: Pt = [bez(0.62, 0), bez(0.62, 1)];
  const gateAt: Pt = [onLine[0] + 18, onLine[1] - 92];
  const gateState = waiting ? "waiting" : hold ? "locked" : "approved";
  const GATE = {
    locked: { icon: Lock, text: "Needs your approval", w: 150 },
    waiting: { icon: Hourglass, text: "Waiting for you", w: 124 },
    approved: { icon: Check, text: "Approved by you", w: 128 },
  }[gateState];
  const segs: Array<{
    key: keyof typeof paths;
    layer: BrainTier | "feedback";
    gated?: boolean;
    dur: number;
  }> = [
    { key: "evidence", layer: "evidence", dur: 4.2 },
    { key: "toJudgement", layer: "evidence", dur: 3.2 },
    { key: "judgement", layer: "judgement", dur: 3.8 },
    { key: "toDelivery", layer: "judgement", gated: true, dur: 3.2 },
    { key: "delivery", layer: "delivery", gated: true, dur: 4.2 },
    { key: "feedback", layer: "feedback", gated: true, dur: 5 },
  ];
  const dim = (tier: BrainTier) => (layer === "feedback" ? tier === "judgement" : layer !== tier);

  const tier = (k: number, id: BrainTier) => (
    <g data-tier={id} data-dim={dim(id) || undefined}>
      <Plate
        id={pid}
        at={tierAt(k)}
        size={A}
        depth={AD}
        height={TH}
        radius={24}
        glow={layer === id}
      />
      <text
        transform={topMatrix(add(tierAt(k), [-A + 18, AD - 12, 0.5]))}
        className="ix-deck-title"
        fontSize={11}
      >
        {TITLES[id]}
      </text>
      {STATIONS.filter((s) => s.tier === id)
        .slice()
        .sort((a, b) => a.x - b.x)
        .map((s) => {
          const at = stationAt(s);
          const on = s.id === selected;
          const gate = s.id === "human";
          return (
            <g
              key={s.id}
              className="ix-pod"
              data-on={on || undefined}
              data-gate={gate || undefined}
              data-waiting={(gate && waiting) || undefined}
              data-approved={(gate && (approved || gateState === "approved")) || undefined}
            >
              <Plate
                id={pid}
                at={add(at, [0, 0, POD_H])}
                size={POD}
                height={POD_H}
                radius={8}
                glow={on}
              />
              {gate && (
                <ellipse
                  cx={iso(add(at, [0, 0, POD_H]))[0]}
                  cy={iso(add(at, [0, 0, POD_H]))[1]}
                  rx={POD * 1.5}
                  ry={POD * 0.86}
                  className="ix-gate-ring"
                />
              )}
              <StationArt id={s.id} at={at} pid={pid} on={on} />
              <FloatIcon
                at={add(at, [0, 0, POD_H + (s.id === "human" ? 36 : 46)])}
                icon={s.icon}
                size={15}
              />
              <text
                transform={topMatrix(add(at, [-POD - 2, POD + 12, 0.5]))}
                className="ix-deck-label"
                fontSize={9.5}
              >
                {s.label}
              </text>
            </g>
          );
        })}
    </g>
  );

  return (
    <svg
      viewBox={`${BRAIN_VIEWBOX.x} ${BRAIN_VIEWBOX.y} ${BRAIN_VIEWBOX.w} ${BRAIN_VIEWBOX.h}`}
      role="img"
      aria-label="Three connected tiers. Evidence and memory holds sources, interview notes, research and observed results. Judgement holds the strategy panel, independent review and your approval gate. Delivery holds design, engineering, quality checks and reviewable artefacts. Work flows through each tier, waits at your gate, and observed results flow back to evidence."
    >
      <IsoDefs id={pid} />
      {tier(0, "evidence")}
      {tier(1, "judgement")}
      {tier(2, "delivery")}
      <g className="ix-brain-flow">
        {segs.map((seg) => {
          const open = !seg.gated || !hold;
          const focus = seg.layer === layer;
          return (
            <g
              key={seg.key}
              data-focus={focus || undefined}
              data-held={!open || undefined}
              data-gate={seg.key === "toDelivery" || undefined}
              data-cleared={(seg.key === "toDelivery" && open) || undefined}
            >
              <path d={paths[seg.key]} className="ix-lane" />
              {live && open && (
                <Particles
                  d={paths[seg.key]}
                  count={seg.key.startsWith("to") ? 2 : 4}
                  dur={seg.dur}
                  r={focus ? 4 : 3.2}
                />
              )}
            </g>
          );
        })}
        <circle cx={results[0]} cy={results[1]} r={4} className="ix-lane-end" />
      </g>
      <g
        className="ix-gate-badge"
        data-state={gateState}
        transform={`translate(${gateAt[0] - GATE.w / 2} ${gateAt[1] - 14})`}
      >
        <line
          x1={GATE.w / 2}
          y1={28}
          x2={onLine[0] - gateAt[0] + GATE.w / 2}
          y2={onLine[1] - gateAt[1] + 14}
          className="ix-gate-badge-stem"
        />
        <circle
          cx={onLine[0] - gateAt[0] + GATE.w / 2}
          cy={onLine[1] - gateAt[1] + 14}
          r={3.5}
          className="ix-gate-badge-dot"
        />
        <rect width={GATE.w} height={28} rx={14} />
        <circle cx={14} cy={14} r={9} className="ix-gate-badge-dot" />
        <GATE.icon x={8} y={8} width={12} height={12} strokeWidth={2.6} aria-hidden="true" />
        <text x={30} y={18} fontSize={11}>
          {GATE.text}
        </text>
      </g>
      <text
        x={results[0] + 250}
        y={results[1] - 70}
        className="ix-label"
        data-tone="muted"
        fontSize={11}
      >
        Observed feedback
      </text>
    </svg>
  );
}
