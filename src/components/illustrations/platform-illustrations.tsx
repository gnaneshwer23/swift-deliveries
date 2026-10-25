import type { LucideIcon } from "lucide-react";
import { useId } from "react";
import { Agent, Card, Cube, FloatIcon, Glass, IsoDefs, Plate } from "./iso";
import { iso, pathOf, type P3 } from "./iso-geometry";

const useIxId = (prefix: string) => `${prefix}${useId().replaceAll(":", "")}`;
const add = (a: P3, b: P3): P3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

/** Lay agents out on a small disc inside a vessel, back to front. */
function agentSpots(n: number, r: number): Array<[number, number]> {
  if (n <= 0) return [];
  if (n === 1) return [[0, 0]];
  const spots: Array<[number, number]> = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + 0.6;
    spots.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  return spots.sort((p, q) => p[0] + p[1] - (q[0] + q[1]));
}

// ---------------------------------------------------------------------------
// Workforce: fifteen departments, the ones a mission needs light up
// ---------------------------------------------------------------------------
export function WorkforceIllustration({
  departments,
  active,
}: {
  departments: ReadonlyArray<{ n: number; short: string }>;
  /** department number -> how many specialists from it are on the mission */
  active: Map<number, number>;
}) {
  const id = useIxId("wf");
  const G = 104;
  const cells = departments.map((d, i) => {
    const col = i % 5;
    const row = Math.floor(i / 5);
    return { ...d, at: [col * G, row * G, 0] as P3 };
  });
  // paint back to front
  const order = [...cells].sort((a, b) => a.at[0] + a.at[1] - (b.at[0] + b.at[1]));
  const hub: P3 = [2 * G, G, 0];
  return (
    <svg
      viewBox="-250 -110 680 470"
      role="img"
      aria-label="Fifteen department pedestals. Departments with specialists on the selected mission glow and hold glass vessels with their agents."
    >
      <IsoDefs id={id} />
      {order.map((c) => {
        const n = active.get(c.n) ?? 0;
        if (!n) return null;
        return (
          <path
            key={`l${c.n}`}
            d={pathOf([iso(add(c.at, [0, 0, 2])), iso(add(hub, [0, 0, 2]))], false)}
            className="ix-wf-link"
          />
        );
      })}
      {order.map((c) => {
        const n = active.get(c.n) ?? 0;
        return (
          <g key={c.n} className="ix-wf-cell" data-on={n > 0 || undefined}>
            <Plate id={id} at={c.at} size={34} height={10} radius={10} glow={n > 0} />
            {n > 0 ? (
              <Glass id={id} at={add(c.at, [-2, -2, 0])} r={22} h={46}>
                {agentSpots(Math.min(n, 4), n > 1 ? 9 : 0).map(([x, y], i) => (
                  <Agent
                    key={i}
                    id={id}
                    at={add(c.at, [x - 2, y - 2, 2])}
                    scale={0.62}
                    lit={i === 0}
                  />
                ))}
              </Glass>
            ) : (
              <g className="ix-wf-idle">
                <Cube at={add(c.at, [-6, -6, 0])} s={10} tone="dim" />
                <Cube at={add(c.at, [6, -2, 0])} s={8} tone="dim" />
              </g>
            )}
          </g>
        );
      })}
      {order.map((c) => {
        if (!active.get(c.n)) return null;
        const [lx, ly] = iso(add(c.at, [0, 0, 64]));
        return (
          <g key={`t${c.n}`} className="ix-wf-tag">
            <rect
              x={lx - c.short.length * 3.6 - 8}
              y={ly - 13}
              width={c.short.length * 7.2 + 16}
              height={18}
              rx={5}
            />
            <text x={lx} y={ly} textAnchor="middle" className="ix-label" fontSize={10}>
              {c.short}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// One option vessel for the deliberation panel
// ---------------------------------------------------------------------------
export function OptionVessel({
  votes,
  vetoed,
  chosen,
}: {
  votes: number;
  vetoed: boolean;
  chosen: boolean;
}) {
  const id = useIxId("ov");
  const at: P3 = [0, 0, 0];
  const ring =
    votes > 5
      ? [...agentSpots(votes - 3, 28), ...agentSpots(3, 9)].sort(
          (p, q) => p[0] + p[1] - (q[0] + q[1]),
        )
      : agentSpots(votes, votes > 1 ? 16 : 0);
  return (
    <svg
      viewBox="-120 -170 240 230"
      role="img"
      aria-label={`${votes} specialist votes${vetoed ? ", vetoed" : ""}${chosen ? ", leading option" : ""}`}
    >
      <IsoDefs id={id} />
      <g className="ix-option" data-vetoed={vetoed || undefined} data-chosen={chosen || undefined}>
        <Plate id={id} at={at} size={62} height={14} radius={18} glow={chosen} />
        <Glass id={id} at={add(at, [0, 0, 0])} r={46} h={104}>
          {ring.map(([x, y], i) => (
            <Agent
              key={i}
              id={id}
              at={[x, y, 2]}
              scale={votes > 5 ? 0.8 : 0.95}
              lit={chosen && i === ring.length - 1}
            />
          ))}
          {vetoed && (
            <g className="ix-veto">
              <ellipse cx={0} cy={iso([0, 0, 64])[1]} rx={46 * 0.866 * 1.42} ry={46 * 0.5 * 1.42} />
            </g>
          )}
        </Glass>
      </g>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Build record: the pathway a product took, one pedestal per step
// ---------------------------------------------------------------------------
export function BuildPathIllustration({
  steps,
  selected,
  onSelect,
}: {
  steps: ReadonlyArray<{ id: string; icon: LucideIcon; label: string }>;
  selected: string;
  onSelect: (id: string) => void;
}) {
  const id = useIxId("bp");
  const D = 84;
  const pts = steps.map((_, i) => [i * D, -i * D + (i % 2 ? 30 : -30), i * 10] as P3);
  return (
    <svg
      viewBox="-70 -150 1010 250"
      role="img"
      aria-label="A pathway of connected pedestals, one for each step the product took from prompt to release."
    >
      <IsoDefs id={id} />
      <path
        d={pathOf(
          pts.map((p) => iso(add(p, [0, 0, 1]))),
          false,
        )}
        className="ix-flow-base"
      />
      <path
        d={pathOf(
          pts.map((p) => iso(add(p, [0, 0, 1]))),
          false,
        )}
        className="ix-flow-pulse ix-path-pulse"
      />
      {steps.map((s, i) => {
        const at = pts[i]!;
        const on = s.id === selected;
        const [lx, ly] = iso(add(at, [0, 0, -16]));
        return (
          <g
            key={s.id}
            className="ix-step"
            data-on={on || undefined}
            role="button"
            tabIndex={0}
            aria-pressed={on}
            aria-label={`${i + 1}. ${s.label}`}
            onClick={() => onSelect(s.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(s.id);
              }
            }}
          >
            <Plate id={id} at={at} size={30} height={12} radius={9} glow={on} />
            <FloatIcon at={add(at, [0, 0, 8])} icon={s.icon} size={20} />
            <text
              x={lx}
              y={ly + 34}
              textAnchor="middle"
              className="ix-label ix-step-label"
              fontSize={11}
            >
              {String(i + 1).padStart(2, "0")} {s.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Control: a permission ladder, a usage ceiling and an approval gate
// ---------------------------------------------------------------------------
export function ControlIllustration({
  rungs,
  usage,
}: {
  rungs: ReadonlyArray<{ label: string; icon: LucideIcon; locked?: boolean }>;
  usage: number;
}) {
  const id = useIxId("ct");
  const step = (i: number): P3 => [i * 66, -i * 66, i * 24];
  const vessel: P3 = [rungs.length * 66 + 40, -rungs.length * 66 - 40, 0];
  const H = 128;
  const fill = Math.max(0, Math.min(1, usage)) * (H - 12);
  const [vx] = iso(vessel);
  const ceilingY = iso(add(vessel, [0, 0, H - 8]))[1];
  return (
    <svg
      viewBox="-90 -250 820 330"
      role="img"
      aria-label="Four rising steps for read, draft, propose and act externally; the last step is locked behind your approval. Beside them a glass vessel fills toward a ceiling ring that stops further billable work."
    >
      <IsoDefs id={id} />
      {rungs.map((r, i) => {
        const at = step(i);
        const [lx] = iso(at);
        const ly = iso(add(at, [36, 36, -(18 + i * 24)]))[1];
        return (
          <g key={r.label} className="ix-rung" data-locked={r.locked || undefined}>
            <Plate
              id={id}
              at={at}
              size={36}
              height={18 + i * 24}
              radius={10}
              glow={!r.locked && i === rungs.length - 2}
            />
            <FloatIcon at={add(at, [0, 0, 6])} icon={r.icon} size={18} />
            <text
              x={lx}
              y={ly + 22}
              className="ix-label"
              fontSize={11}
              textAnchor="middle"
              data-tone={r.locked ? "accent" : "strong"}
            >
              {r.label}
            </text>
          </g>
        );
      })}
      <g className="ix-usage">
        <Plate id={id} at={vessel} size={52} height={14} radius={16} />
        <Glass id={id} at={vessel} r={38} h={H}>
          <UsageFill at={vessel} r={34} h={fill} />
        </Glass>
        <path
          d={pathOf(
            Array.from({ length: 49 }, (_, i) =>
              iso([
                vessel[0] + Math.cos((i / 48) * Math.PI * 2) * 42,
                vessel[1] + Math.sin((i / 48) * Math.PI * 2) * 42,
                H - 8,
              ]),
            ),
          )}
          className="ix-ceiling"
        />
        <text
          x={vx}
          y={ceilingY - 42}
          className="ix-label"
          data-tone="accent"
          fontSize={11}
          textAnchor="middle"
        >
          Ceiling · hard stop
        </text>
        <text
          x={vx}
          y={iso(add(vessel, [52, 52, -14]))[1] + 22}
          className="ix-label"
          fontSize={11}
          textAnchor="middle"
        >
          Usage {Math.round(usage * 100)}%
        </text>
      </g>
    </svg>
  );
}

function UsageFill({ at, r, h }: { at: P3; r: number; h: number }) {
  const ring = Array.from({ length: 48 }, (_, i) => {
    const a = (i / 48) * Math.PI * 2;
    return [at[0] + Math.cos(a) * r, at[1] + Math.sin(a) * r] as [number, number];
  });
  const top = ring.map(([x, y]) => iso([x, y, at[2] + 2 + h]));
  const bottom = ring.map(([x, y]) => iso([x, y, at[2] + 2]));
  const side = [...top, ...bottom];
  const minX = Math.min(...side.map((p) => p[0]));
  const maxX = Math.max(...side.map((p) => p[0]));
  const cy0 = iso([at[0], at[1], at[2] + 2])[1];
  const cyt = iso([at[0], at[1], at[2] + 2 + h])[1];
  const ry = r * 0.5 * Math.SQRT2;
  return (
    <g className="ix-usage-fill">
      <path
        d={`M${minX} ${cyt} L${minX} ${cy0} A${(maxX - minX) / 2} ${ry} 0 0 0 ${maxX} ${cy0} L${maxX} ${cyt} Z`}
      />
      <path d={pathOf(top)} className="ix-usage-top" />
    </g>
  );
}

// ---------------------------------------------------------------------------
// Learning: a builder at the centre, specialists around, contributions recorded
// ---------------------------------------------------------------------------
export function LearningIllustration() {
  const id = useIxId("ln");
  const centre: P3 = [0, 0, 0];
  const around: P3[] = [
    [-120, -40, 0],
    [-40, -130, 0],
    [110, -60, 0],
    [60, 110, 0],
  ];
  return (
    <svg
      viewBox="-260 -190 520 320"
      role="img"
      aria-label="A builder stands on a central pedestal surrounded by four specialist agents. Cards pass between them and settle into a shared record on the builder's pedestal."
    >
      <IsoDefs id={id} />
      {around.map((p, i) => (
        <path
          key={`f${i}`}
          d={pathOf([iso(add(p, [0, 0, 2])), iso(add(centre, [0, 0, 2]))], false)}
          className="ix-wf-link"
        />
      ))}
      {[...around.slice(0, 3)].map((p, i) => (
        <g key={i}>
          <Plate id={id} at={p} size={28} height={10} radius={9} />
          <Agent id={id} at={add(p, [0, 0, 1])} scale={0.85} />
        </g>
      ))}
      <Plate id={id} at={centre} size={56} height={14} radius={16} glow />
      <g className="ix-learner">
        <Agent id={id} at={add(centre, [-4, 8, 1])} scale={1.35} lit />
      </g>
      <g className="ix-float">
        <Card at={add(centre, [-20, -34, 30])} w={24} d={16} lines={2} />
      </g>
      <g className="ix-float" data-delay="2">
        <Card at={add(centre, [24, -20, 44])} w={24} d={16} lines={2} />
      </g>
      <Plate id={id} at={around[3]!} size={28} height={10} radius={9} />
      <Agent id={id} at={add(around[3]!, [0, 0, 1])} scale={0.85} />
    </svg>
  );
}
