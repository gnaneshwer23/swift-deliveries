/** One destination inventory for public navigation and footer. */
export const PRODUCT_LINKS = [
  {
    to: "/ai-agents",
    label: "Specialists",
    description: "Who does the work, and what is available now",
  },
  {
    to: "/psi",
    label: "Platform",
    description: "Every capability, marked live, opt-in or planned",
  },
  { to: "/solutions", label: "Use cases", description: "Start from a situation like yours" },
] as const;
export const EXPLORE_LINKS = [
  { to: "/security", label: "Security & Trust" },
  { to: "/resources", label: "Resources" },
  { to: "/about", label: "About DeliverX" },
] as const;
