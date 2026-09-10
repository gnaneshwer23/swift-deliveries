export const FOOTER_PRODUCT_LINKS = [
  { href: "/experience", label: "Experience" },
  { href: "/launchpad", label: "Launchpad" },
  { href: "/professional-workspace", label: "Professional Workspace" },
  { href: "/how-it-works", label: "How it works" },
] as const;

export const FOOTER_PLATFORM_LINKS = [
  { href: "/", label: "Professional Intelligence" },
  { href: "/pricing", label: "Pilot access" },
  { href: "/resources", label: "Resources" },
  { href: "/professional-workspace", label: "Team Copilot" },
] as const;

export const FOOTER_COMPANY_LINKS = [
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/cookies", label: "Cookies" },
] as const;

export const FOOTER_ACCOUNT_LINKS = [
  { href: "/login", label: "Sign in" },
  { href: "/signup", label: "Start" },
] as const;

export const FOOTER_COLUMNS = [
  { id: "product", title: "Product", links: FOOTER_PRODUCT_LINKS },
  { id: "platform", title: "Platform", links: FOOTER_PLATFORM_LINKS },
  { id: "company", title: "Company", links: FOOTER_COMPANY_LINKS },
  { id: "account", title: "Account", links: FOOTER_ACCOUNT_LINKS },
] as const;

export const DEFAULT_FOOTER_CTA = {
  title: "Start with DeliverX",
  subtitle:
    "Experience, Launchpad or Professional Workspace: open pilot access, or create an account.",
  href: "/signup",
  label: "Start",
} as const;
