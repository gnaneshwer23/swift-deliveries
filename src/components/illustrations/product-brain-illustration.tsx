import { useId } from "react";
import { Agent, Card, Cube, FloatIcon, Glass, IsoDefs, Label, Plate } from "./iso";
import { iso, type P3 } from "./iso-geometry";
import {
  A,
  BRAIN_VIEWBOX,
  H,
  POD,
  POD_H,
  SATELLITES,
  TH,
  TIERS,
  TIER_K,
  add,
  tierAt,
  type BrainObject,
  type BrainTier,
} from "./product-brain-layout";

export function ProductBrainIllustration({
  layer,
  selected,
  waiting = false,
  approved = false,
  showLabels = false,
}: {
  layer: BrainTier | "feedback";
  selected: BrainObject;
  waiting?: boolean;
  approved?: boolean;
  showLabels?: boolean;
}) {
  const id = `pb${useId().replaceAll(":", "")}`;
  const t0 = tierAt(0);
  const t1 = tierAt(1);
  const t2 = tierAt(2);

  const conduit = (from: P3, k: number) => {
    const base: P3 = add(from, [86, -86, 0]);
    const [x, y0] = iso(base);
    const [, y1] = iso(add(base, [0, 0, H - TH]));
    return (
      <g className="ix-conduit" key={`c${k}`}>
        <rect x={x - 9} y={y1} width={18} height={y0 - y1} rx={9} className="ix-conduit-tube" />
        <line x1={x} y1={y0 - 4} x2={x} y2={y1 + 4} className="ix-conduit-core" />
        <line x1={x} y1={y0 - 4} x2={x} y2={y1 + 4} className="ix-conduit-pulse" />
      </g>
    );
  };

  // Observed feedback returns from delivery to evidence along the right side.
  const fbStart = iso(add(t2, [A + 6, 30, -TH / 2]));
  const fbEnd = iso(add(t0, [A + 6, 30, -TH / 2]));
  const feedback = `M${fbStart[0]} ${fbStart[1]} C${fbStart[0] + 170} ${fbStart[1] + 60} ${fbEnd[0] + 260} ${fbEnd[1] - 120} ${fbEnd[0] + 4} ${fbEnd[1]}`;

  const tierState = (tier: BrainTier) =>
    layer === "feedback" ? (tier === "judgement" ? "dim" : "on") : layer === tier ? "on" : "dim";

  const pods = (tier: BrainTier) =>
    SATELLITES.filter((s) => s.tier === tier).map((s) => {
      const base = tierAt(TIER_K[tier]);
      const at = add(base, [s.at[0], s.at[1], 0]);
      const on = s.id === selected;
      const gate = s.id === "human";
      return (
        <g
          key={s.id}
          className="ix-pod"
          data-on={on || undefined}
          data-gate={gate || undefined}
          data-waiting={(gate && waiting) || undefined}
          data-approved={(gate && approved) || undefined}
        >
          <Plate
            id={id}
            at={add(at, [0, 0, POD_H])}
            size={POD}
            height={POD_H}
            radius={7}
            glow={on}
          />
          <FloatIcon at={add(at, [0, 0, POD_H + 4])} icon={s.icon} />
        </g>
      );
    });

  const labelFor = (k: number) => {
    const [x, y] = iso(add(tierAt(k), [-A, A, -TH]));
    const tier = TIERS[k]!;
    return (
      <g className="ix-tier-label" data-on={layer === tier.id || undefined}>
        <line x1={x - 24} y1={y - 22} x2={x - 120} y2={y - 22} className="ix-tick" />
        <circle cx={x - 22} cy={y - 22} r={3} className="ix-tick-dot" />
        <Label x={x - 130} y={y - 26} anchor="end" size={15}>
          {tier.title}
        </Label>
        <Label x={x - 130} y={y - 6} anchor="end" tone="muted" size={11}>
          {tier.caption}
        </Label>
      </g>
    );
  };

  return (
    <svg
      viewBox={`${BRAIN_VIEWBOX.x} ${BRAIN_VIEWBOX.y} ${BRAIN_VIEWBOX.w} ${BRAIN_VIEWBOX.h}`}
      role="img"
      aria-label="Three connected tiers. Evidence and memory holds sources, notes, research and observed results. Judgement holds specialist agents comparing options and an owner approval gate. Delivery holds design, engineering, quality review and release. Observed feedback returns from delivery to evidence."
    >
      <IsoDefs id={id} />

      {/* Evidence */}
      <g data-tier="evidence" data-dim={tierState("evidence") === "dim" || undefined}>
        <Plate id={id} at={t0} size={A} height={TH} radius={30} glow={layer === "evidence"} />
        <Glass id={id} at={add(t0, [-8, -34, 0])} r={58} h={128}>
          <g className="ix-float">
            <Card at={add(t0, [-26, -44, 64])} w={30} d={22} />
          </g>
          <g className="ix-float" data-delay="1">
            <Card at={add(t0, [4, -26, 44])} w={30} d={22} />
          </g>
          <g className="ix-float" data-delay="2">
            <Card at={add(t0, [-14, -20, 88])} w={26} d={18} lines={2} />
          </g>
          <Cube at={add(t0, [-30, -6, 2])} s={12} tone="dim" />
          <Cube at={add(t0, [12, -50, 2])} s={10} tone="mid" />
        </Glass>
        {pods("evidence")}
      </g>
      {conduit(t0, 0)}

      {/* Judgement */}
      <g data-tier="judgement" data-dim={tierState("judgement") === "dim" || undefined}>
        <Plate id={id} at={t1} size={A} height={TH} radius={30} glow={layer === "judgement"} />
        <Glass id={id} at={add(t1, [-8, -34, 0])} r={58} h={128}>
          <Agent id={id} at={add(t1, [-30, -48, 4])} scale={1.1} />
          <Agent id={id} at={add(t1, [8, -62, 4])} scale={1.1} />
          <Agent id={id} at={add(t1, [-42, -14, 4])} scale={1.1} />
          <Agent id={id} at={add(t1, [16, -20, 4])} scale={1.1} lit={layer === "judgement"} />
          <Agent id={id} at={add(t1, [-14, 6, 4])} scale={1.1} />
          <g className="ix-float" data-delay="1">
            <Card at={add(t1, [-8, -34, 104])} w={26} d={18} lines={2} />
          </g>
        </Glass>
        {pods("judgement")}
      </g>
      {conduit(t1, 1)}

      {/* Delivery */}
      <g data-tier="delivery" data-dim={tierState("delivery") === "dim" || undefined}>
        <Plate id={id} at={t2} size={A} height={TH} radius={30} glow={layer === "delivery"} />
        <Glass id={id} at={add(t2, [-8, -34, 0])} r={58} h={128}>
          {(
            [
              [-26, -34, 0, "mid"],
              [-8, -52, 0, "mid"],
              [-8, -34, 0, "mid"],
              [10, -34, 0, "dim"],
              [-8, -16, 0, "mid"],
              [-26, -16, 0, "dim"],
              [-8, -34, 18, "lit"],
              [-26, -34, 18, "mid"],
              [-8, -16, 18, "mid"],
            ] as Array<[number, number, number, "lit" | "mid" | "dim"]>
          )
            .sort((a, b) => a[2] - b[2] || a[0] + a[1] - (b[0] + b[1]))
            .map(([x, y, z, tone], i) => (
              <Cube key={i} at={add(t2, [x, y, z + 2])} s={17} tone={tone} />
            ))}
          <g className="ix-float" data-delay="2">
            <Cube at={add(t2, [10, -16, 66])} s={13} tone="lit" />
          </g>
          <Agent id={id} at={add(t2, [24, 4, 4])} scale={0.8} />
          <Agent id={id} at={add(t2, [-40, 6, 4])} scale={0.8} />
        </Glass>
        {pods("delivery")}
      </g>

      {/* Observed feedback */}
      <g className="ix-feedback" data-on={layer === "feedback" || undefined}>
        <path d={feedback} className="ix-feedback-base" />
        <path d={feedback} className="ix-feedback-pulse" />
        <circle cx={fbEnd[0] + 4} cy={fbEnd[1]} r={4} className="ix-tick-dot" />
        <circle cx={fbStart[0]} cy={fbStart[1]} r={4} className="ix-tick-dot" />
        <Label
          x={fbEnd[0] + 230}
          y={(fbStart[1] + fbEnd[1]) / 2 + 10}
          anchor="start"
          tone="muted"
          size={11}
        >
          Observed feedback
        </Label>
      </g>

      {showLabels && TIERS.map((t) => <g key={t.id}>{labelFor(t.k)}</g>)}
    </svg>
  );
}
