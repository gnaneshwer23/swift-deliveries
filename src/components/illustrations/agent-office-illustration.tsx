import { useId } from "react";
import type { OfficeDepartment } from "@/lib/agent-office";
import { Agent, Glass, IsoDefs, Particles, Plate } from "./iso";
import { iso, pathOf, prism, roundRect, topMatrix, type P3 } from "./iso-geometry";
import { OFFICE_VIEWBOX, POD_D, POD_W, deskSpots, podAt } from "./agent-office-layout";

const add = (a: P3, b: P3): P3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const BRAIN: P3 = [0, 0, 0];

function Desk({
  pid,
  at,
  name,
  state,
  selected,
  onSelect,
}: {
  pid: string;
  at: P3;
  name: string;
  state: string;
  selected: boolean;
  onSelect: (() => void) | undefined;
}) {
  const top = add(at, [0, 0, 10]);
  const screen = prism(roundRect(at[0], at[1] - 6, 11, 1.6, 1), top[2], top[2] + 15);
  const [nx, ny] = iso(add(at, [0, 0, 46]));
  const w = name.length * 5.3 + 16;
  return (
    <g
      className="ix-desk"
      data-state={state}
      data-selected={selected || undefined}
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      aria-label={onSelect ? `${name}: ${state}` : undefined}
      aria-pressed={onSelect ? selected : undefined}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (onSelect && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      <ellipse
        cx={iso(add(at, [0, 8, 0]))[0]}
        cy={iso(add(at, [0, 8, 0]))[1]}
        rx={34}
        ry={17}
        className="ix-desk-ring"
      />
      <Plate id={pid} at={top} size={20} depth={12} height={10} radius={3} />
      <path d={screen.side} className="ix-monitor" />
      <path d={screen.top} className="ix-monitor-top" />
      <Agent id={pid} at={add(at, [0, 18, 0])} scale={0.78} lit={state === "doing"} />
      <g className="ix-desk-name" transform={`translate(${nx - w / 2} ${ny - 10})`}>
        <rect width={w} height={17} rx={8.5} />
        <text x={w / 2} y={12} textAnchor="middle" fontSize={9.5}>
          {name}
        </text>
      </g>
    </g>
  );
}

export function AgentOfficeIllustration({
  departments,
  selected,
  onSelect,
  live = true,
}: {
  departments: readonly OfficeDepartment[];
  selected: string | null;
  onSelect?: (specialistId: string | null) => void;
  live?: boolean;
}) {
  const pid = `ao${useId().replaceAll(":", "")}`;
  const n = departments.length;
  const [bx, by] = iso(BRAIN);
  const floors = departments.map((d, k) => ({ d, k, at: podAt(k, n) }));
  // paint back to front; the Brain sits at depth 0
  const order = [
    ...floors.map((f) => ({ ...f, depth: f.at[0] + f.at[1] })),
    { brain: true, depth: 0 },
  ].sort((a, b) => a.depth - b.depth);
  const brainNodes: P3[] = [
    [-14, -10, 22],
    [12, -14, 34],
    [-6, 12, 44],
    [16, 8, 18],
    [0, 0, 56],
  ];

  return (
    <svg
      viewBox={`${OFFICE_VIEWBOX.x} ${OFFICE_VIEWBOX.y} ${OFFICE_VIEWBOX.w} ${OFFICE_VIEWBOX.h}`}
      role="group"
      aria-label={`Your agents office: ${n} departments with specialists you can assign today, around the Product Brain. Desks glow while a specialist is working and turn amber while work waits for you.`}
    >
      <IsoDefs id={pid} />
      <g className="ix-office-lanes">
        {floors.map(({ d, at }) => {
          const [px, py] = iso(at);
          const path = pathOf(
            [
              [px, py],
              [bx, by],
            ],
            false,
          );
          return (
            <g key={d.n} data-busy={d.counts.doing > 0 || undefined}>
              <path d={path} className="ix-office-lane" />
              {live && d.counts.doing > 0 && <Particles d={path} count={3} dur={3.4} />}
            </g>
          );
        })}
      </g>
      {order.map((item) => {
        if ("brain" in item) {
          return (
            <g key="brain" className="ix-office-brain">
              <Plate id={pid} at={BRAIN} size={96} depth={96} height={16} radius={62} glow />
              <Glass id={pid} at={[0, 0, 0]} r={40} h={72}>
                {brainNodes.map((p, i) => {
                  const [x, y] = iso(p);
                  return <circle key={i} cx={x} cy={y} r={3.2} className="ix-brain-node" />;
                })}
                <path d={pathOf(brainNodes.map(iso), false)} className="ix-brain-links" />
              </Glass>
              <text transform={topMatrix([-58, 74, 0.5])} className="ix-deck-title" fontSize={11}>
                PRODUCT BRAIN
              </text>
            </g>
          );
        }
        const { d, at } = item;
        const spots = deskSpots(d.specialists.length);
        return (
          <g
            key={d.n}
            className="ix-office-floor"
            data-busy={d.counts.doing > 0 || undefined}
            data-waiting={d.counts.waiting > 0 || undefined}
          >
            <Plate id={pid} at={at} size={POD_W} depth={POD_D} height={14} radius={22} />
            <text
              transform={topMatrix(add(at, [-POD_W + 16, POD_D - 10, 0.5]))}
              className="ix-deck-title"
              fontSize={10.5}
            >
              {String(d.n).padStart(2, "0")} {d.short.toUpperCase()}
            </text>
            {d.specialists.map((s, i) => {
              const [dx, dy] = spots[i] ?? [0, 0];
              return (
                <Desk
                  key={s.id}
                  pid={pid}
                  at={add(at, [dx, dy - 10, 0])}
                  name={s.name}
                  state={s.state}
                  selected={selected === s.id}
                  onSelect={onSelect ? () => onSelect(selected === s.id ? null : s.id) : undefined}
                />
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}
