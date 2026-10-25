/** One destination inventory for public navigation and footer. */
export const PRODUCT_LINKS = [
  { to: "/psi", label: "PSI Platform", description: "How the intelligence layers connect" },
  { to: "/ai-agents", label: "Specialists", description: "Roles, contributions and availability" },
  {
    to: "/psi",
    hash: "product-brain",
    label: "Product Brain",
    description: "Evidence, decisions and traceability",
  },
  { to: "/solutions", label: "Use cases", description: "Find a starting point for your product" },
] as const;
export const EXPLORE_LINKS = [
  { to: "/security", label: "Security & Trust" },
  { to: "/resources", label: "Resources" },
  { to: "/about", label: "About DeliverX" },
] as const;
