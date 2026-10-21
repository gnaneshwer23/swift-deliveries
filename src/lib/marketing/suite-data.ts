/** Shared suite marketing — DeliverX as an AI Product Experience Company. */

export const PRIMARY_NAV = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/experience", label: "Experience" },
  { href: "/launchpad", label: "Launchpad" },
  { href: "/professional-workspace", label: "Professional Workspace" },
] as const;

export const PRODUCT_LINKS = [
  { href: "/experience", label: "Experience", stage: "Build the experience" },
  { href: "/launchpad", label: "Launchpad", stage: "Land the opportunity" },
  {
    href: "/professional-workspace",
    label: "Professional Workspace",
    stage: "Succeed in the role",
  },
] as const;

export const SITE_NAV = {
  products: PRODUCT_LINKS,
  links: PRIMARY_NAV,
} as const;

export const SUITE_PRODUCTS = [
  {
    id: "xperience",
    name: "Experience",
    stage: "Build the experience",
    href: "/experience",
    promise:
      "Work inside companies with AI colleagues as a Product Manager. Build judgement, delivery craft and a portfolio of evidence employers can evaluate.",
    detail: "Pilot access. Living organisations, projects and an Experience Record.",
    cta: "Explore Experience",
  },
  {
    id: "launchpad",
    name: "Launchpad",
    stage: "Land the opportunity",
    href: "/launchpad",
    promise:
      "Turn your experience into interviews with Career Intelligence: labelled readiness, evidence CV packaging, interview lab and application tracking.",
    detail: "Pilot access. Readiness, packaging and interview prep.",
    cta: "Explore Launchpad",
  },
  {
    id: "team-copilot",
    name: "Professional Workspace",
    stage: "Succeed in the role",
    href: "/professional-workspace",
    promise:
      "Collaborate with role-based AI teammates in one Professional Workspace: meetings, stakeholders, artefacts, decisions and evidence.",
    detail: "Pilot access. AI drafts; humans decide and submit.",
    cta: "Explore Professional Workspace",
  },
] as const;

export const SUITE_LIFECYCLE = [
  { name: "Experience", line: "Build the experience", outcome: "Practical PM capability and evidence" },
  { name: "Launchpad", line: "Land the opportunity", outcome: "Interviews, offers and readiness" },
  { name: "Professional Workspace", line: "Succeed in the role", outcome: "Confident delivery with AI teammates" },
] as const;

export const SUITE_DIFFERENCE = [
  {
    title: "Experience before employment",
    body: "Build real product judgement inside living organisations before you apply, so employers see work, not just ambition.",
  },
  {
    title: "Career intelligence",
    body: "A continuous picture of your skills, stories and readiness, so every project compounds into a clearer career path.",
  },
  {
    title: "Better delivery",
    body: "Once you are in the role, the same ecosystem helps you plan, align and ship with your real team.",
  },
  {
    title: "Continuous growth",
    body: "From first experience through opportunity and delivery: one connected path, not three disconnected tools.",
  },
] as const;

export const SUITE_TAGLINE = "Professional Intelligence for Product People";
