/**
 * Illustrated agent portraits: one family, each named role with its own colour and tool badge.
 * Pure SVG (no assets), so it renders the same in the app, in exports and on the server.
 */
type Persona = { hue: number; skin: string; hair: string; tool: keyof typeof TOOLS };

const PERSONAS: Record<string, Persona> = {
  Aria: { hue: 248, skin: "#dfd2a0", hair: "#2b2721", tool: "spark" },
  Iris: { hue: 275, skin: "#dbcd9a", hair: "#251e04", tool: "spark" },
  Scout: { hue: 190, skin: "#bfaf72", hair: "#27210e", tool: "search" },
  Rex: { hue: 14, skin: "#68591c", hair: "#0d0b05", tool: "chart" },
  Maya: { hue: 330, skin: "#dbcd9a", hair: "#4f4100", tool: "people" },
  Atlas: { hue: 38, skin: "#ae9c56", hair: "#2e2a25", tool: "compass" },
  Lumen: { hue: 285, skin: "#e5daaf", hair: "#af9739", tool: "flow" },
  Pixel: { hue: 312, skin: "#cbbc83", hair: "#161411", tool: "pen" },
  Keystone: { hue: 215, skin: "#7e6c25", hair: "#252320", tool: "blocks" },
  Forge: { hue: 22, skin: "#dacb94", hair: "#302702", tool: "code" },
  Relay: { hue: 165, skin: "#58490d", hair: "#110f0c", tool: "server" },
  Nova: { hue: 140, skin: "#e4d8a9", hair: "#744103", tool: "check" },
  Harbor: { hue: 200, skin: "#baa866", hair: "#181507", tool: "flag" },
  Quill: { hue: 52, skin: "#d2c38e", hair: "#6d6b67", tool: "doc" },
};

const TOOLS = {
  spark: <path d="M0-6 1.6-1.6 6 0 1.6 1.6 0 6-1.6 1.6-6 0-1.6-1.6Z" fill="#fff" />,
  search: (
    <>
      <circle cx="-1" cy="-1" r="3.6" fill="none" stroke="#fff" strokeWidth="1.8" />
      <path d="m1.8 1.8 3 3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  chart: (
    <path
      d="M-4.5 4V1M-1.5 4V-2M1.5 4V-.5M4.5 4V-4"
      stroke="#fff"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  ),
  people: (
    <>
      <circle cx="-2" cy="-2" r="1.9" fill="#fff" />
      <circle cx="2.6" cy="-1.4" r="1.6" fill="#fff" />
      <path d="M-5 4c0-2.6 6-2.6 6 0M.5 4c.4-2.2 5-2.2 5 0" fill="#fff" />
    </>
  ),
  compass: (
    <>
      <circle r="4.6" fill="none" stroke="#fff" strokeWidth="1.5" />
      <path d="m2.2-2.2-1.4 3-3 1.4 1.4-3Z" fill="#fff" />
    </>
  ),
  flow: (
    <>
      <rect x="-5" y="-4.5" width="4" height="3" rx="1" fill="#fff" />
      <rect x="1" y="1.5" width="4" height="3" rx="1" fill="#fff" />
      <path d="M-1-3h2.5v4.5" fill="none" stroke="#fff" strokeWidth="1.3" />
    </>
  ),
  pen: <path d="m-4 4 1-3.4 5.6-5.6 2.4 2.4-5.6 5.6Z" fill="#fff" />,
  blocks: (
    <>
      <rect x="-5" y="-1" width="4" height="4" rx=".8" fill="#fff" />
      <rect x="1" y="-1" width="4" height="4" rx=".8" fill="#fff" />
      <rect x="-2" y="-5.5" width="4" height="4" rx=".8" fill="#fff" />
    </>
  ),
  code: (
    <path
      d="m-2-3.5-3.5 3.5 3.5 3.5M2-3.5l3.5 3.5L2 3.5"
      fill="none"
      stroke="#fff"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  server: (
    <>
      <rect x="-4.5" y="-4.5" width="9" height="4" rx="1" fill="#fff" />
      <rect x="-4.5" y=".8" width="9" height="4" rx="1" fill="#fff" opacity=".8" />
    </>
  ),
  check: (
    <path
      d="m-4 0 2.6 2.8L4.2-3"
      fill="none"
      stroke="#fff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  flag: (
    <path
      d="M-3.5 5V-5M-3.5-4.5h7l-2 2.5 2 2.5h-7"
      fill="#fff"
      stroke="#fff"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
  ),
  doc: <path d="M-3.5-5h5l2.5 2.5V5h-7.5Z" fill="#fff" />,
};

const FALLBACK: Persona = { hue: 225, skin: "#cdbf88", hair: "#2c2a27", tool: "spark" };

export function AgentAvatar({
  name,
  role,
  size = 40,
  className,
}: {
  name: string;
  role?: string;
  size?: number;
  className?: string;
}) {
  const p = PERSONAS[name] ?? FALLBACK;
  const id = `av-${name.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      role="img"
      aria-label={role ? `${name}, ${role}` : name}
      className={className}
    >
      <circle cx="32" cy="32" r="31" fill={`hsl(${p.hue} 55% 86%)`} />
      <clipPath id={`${id}-clip`}>
        <circle cx="32" cy="32" r="31" />
      </clipPath>
      <g clipPath={`url(#${id}-clip)`}>
        <path d="M10 66c2-14 11-21 22-21s20 7 22 21Z" fill={`hsl(${p.hue} 35% 28%)`} />
        <path d="M27 40h10v7a5 5 0 0 1-10 0Z" fill={p.skin} />
        <ellipse cx="32" cy="29" rx="10.5" ry="12" fill={p.skin} />
        <path
          d="M21 28c0-9 5-14 11-14s11.5 5 11.5 13c-3-4-7-6-12-6-4 0-7 3-10.5 7Z"
          fill={p.hair}
        />
        <circle cx="28" cy="30" r="1.2" fill="#29251f" />
        <circle cx="36" cy="30" r="1.2" fill="#29251f" />
        <path
          d="M29.5 35c1.5 1.2 3.5 1.2 5 0"
          stroke="#29251f"
          strokeWidth="1.2"
          fill="none"
          strokeLinecap="round"
        />
      </g>
      <g transform="translate(51 51)">
        <circle r="9" fill={`hsl(${p.hue} 45% 38%)`} stroke="#fff" strokeWidth="2" />
        {TOOLS[p.tool]}
      </g>
    </svg>
  );
}
