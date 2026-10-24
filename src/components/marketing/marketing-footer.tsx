import { Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/brand-logo";

const FOOTER_GROUPS = [
  {
    label: "Product",
    links: [
      { to: "/psi", label: "Product" },
      { to: "/how-it-works", label: "Example mission" },
      { to: "/pricing", label: "Pricing" },
      { to: "/ai-agents", label: "Specialists" },
    ],
  },
  {
    label: "Resources",
    links: [
      { to: "/resources", label: "Resources" },
      { to: "/about", label: "About" },
    ],
  },
  {
    label: "Legal",
    links: [
      { to: "/privacy", label: "Privacy" },
      { to: "/terms", label: "Terms" },
      { to: "/cookies", label: "Cookies" },
    ],
  },
] as const;

export function MarketingFooter() {
  return (
    <footer className="dxf">
      <div className="dxf-inner">
        <BrandLogo />
        <nav className="dxf-nav" aria-label="Footer">
          {FOOTER_GROUPS.map((group) => (
            <div key={group.label} role="group" aria-label={group.label}>
              {group.links.map((link) => (
                <Link key={link.to} to={link.to}>
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
      </div>
      <p className="dxf-base">© {new Date().getFullYear()} DeliverX</p>
    </footer>
  );
}
