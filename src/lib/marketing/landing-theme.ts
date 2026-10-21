/** Light marketing landing palette — soft, airy DeliverX green system */
export const mkt = {
  ink: "#F6F8F6",
  s1: "#FFFFFF",
  s2: "#F0F3F1",
  s3: "#E4EAE6",
  s4: "#D0D7D2",
  border: "#E2E8E4",
  borderL: "#CED6D1",
  text1: "#0D0D0B",
  text2: "#3F4A43",
  text3: "#7A857E",
  green: "#1C4A2E",
  greenM: "#2D7048",
  greenL: "#3D9660",
  greenBright: "#3D9660",
  cream: "#F2F5F2",
  mist: "#EAF1EC",
  red: "#C0392B",
  amber: "#B7620A",
  blue: "#1A3F6B",
  purple: "#5B21B6",
  teal: "#0F766E",
  accentPurple: "#7C3AED",
  accentGreen: "#3D9660",
  accentBlue: "#2563EB",
  navH: 68,
  maxW: 1120,
  radiusPanel: "1.75rem",
  radiusCard: "1.5rem",
  radiusBtn: "9999px",
} as const;

export const mktStat = {
  value: mkt.text1,
  accent: mkt.green,
  up: mkt.greenL,
  down: mkt.red,
  warn: mkt.amber,
  muted: mkt.text2,
} as const;

export const mktClass = {
  serif: "font-serif",
  sans: "font-sans",
  mono: "font-mono",
  label:
    "font-mono text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-[var(--mkt-green-m)]",
  sectionTitle:
    "font-serif text-[clamp(1.875rem,4.2vw,2.875rem)] leading-[1.06] tracking-[-0.025em] text-[var(--mkt-text1)]",
  sectionSub:
    "mt-4 max-w-[36rem] text-[clamp(0.9375rem,1.4vw,1.0625rem)] font-light leading-[1.7] text-[var(--mkt-text2)]",
  softPanel:
    "rounded-[var(--mkt-radius-panel)] border border-[var(--mkt-border)] bg-[var(--mkt-s2)]",
  softPanelLight:
    "rounded-[var(--mkt-radius-panel)] border border-[var(--mkt-border)] bg-[var(--mkt-s1)]",
  softPanelHighlight:
    "rounded-[var(--mkt-radius-panel)] border border-transparent bg-[var(--mkt-green)] text-white",
  statNumber:
    "font-serif text-[clamp(2.5rem,4vw,3.5rem)] tracking-[-0.04em] text-[var(--mkt-stat-accent)]",
  kpiValue:
    "font-serif text-xl leading-none tracking-[-0.02em] text-[var(--mkt-stat-value)]",
} as const;

export const mktCssVars = {
  "--mkt-ink": mkt.ink,
  "--mkt-s1": mkt.s1,
  "--mkt-s2": mkt.s2,
  "--mkt-s3": mkt.s3,
  "--mkt-border": mkt.border,
  "--mkt-border-l": mkt.borderL,
  "--mkt-text1": mkt.text1,
  "--mkt-text2": mkt.text2,
  "--mkt-text3": mkt.text3,
  "--mkt-green": mkt.green,
  "--mkt-green-m": mkt.greenM,
  "--mkt-green-l": mkt.greenL,
  "--mkt-green-bright": mkt.greenBright,
  "--mkt-cream": mkt.cream,
  "--mkt-mist": mkt.mist,
  "--mkt-accent-purple": mkt.accentPurple,
  "--mkt-accent-green": mkt.accentGreen,
  "--mkt-accent-blue": mkt.accentBlue,
  "--mkt-red": mkt.red,
  "--mkt-amber": mkt.amber,
  "--mkt-stat-value": mktStat.value,
  "--mkt-stat-accent": mktStat.accent,
  "--mkt-stat-up": mktStat.up,
  "--mkt-stat-down": mktStat.down,
  "--mkt-stat-warn": mktStat.warn,
  "--mkt-navh": `${mkt.navH}px`,
  "--mkt-radius-panel": mkt.radiusPanel,
  "--mkt-radius-card": mkt.radiusCard,
  "--mkt-radius-btn": mkt.radiusBtn,
} as const;
