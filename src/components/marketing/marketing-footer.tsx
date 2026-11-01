import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { PRODUCT_LINKS, EXPLORE_LINKS } from "./marketing-navigation";
import { BrandLogo } from "@/components/brand-logo";

const FOOTER_GROUPS = [
  {
    label: "Product",
    links: [
      { to: "/how-it-works", label: "How it works" },
      PRODUCT_LINKS[0],
      PRODUCT_LINKS[1],
      { to: "/learn", label: "Learn" },
    ],
  },
  {
    label: "Explore",
    links: [PRODUCT_LINKS[2], ...EXPLORE_LINKS],
  },
  {
    label: "Get started",
    links: [
      { to: "/pricing", label: "Pricing & Pilot" },
      { to: "/resources", label: "Prepare your brief", hash: "brief-builder" },
      { to: "/login", label: "Sign in" },
    ],
  },
] as const;
export function MarketingFooter() {
  return (
    <footer className="marketing-footer">
      <div className="dxl-wrap">
        <div className="marketing-footer-main">
          <div className="marketing-footer-brand">
            <BrandLogo tagline="Product Super Intelligence" />
            <p className="marketing-footer-tagline">
              From product idea
              <br />
              to continuous intelligence.
            </p>
            <p className="marketing-footer-description">
              Evidence, specialist contributions and human decisions connected in one product
              workspace.
            </p>
            <Link to="/how-it-works" className="marketing-footer-example">
              Explore an example mission
              <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
          </div>
          <nav className="marketing-footer-navigation" aria-label="Footer">
            {FOOTER_GROUPS.map((group) => (
              <div key={group.label} role="group" aria-label={group.label}>
                <h2>{group.label}</h2>
                {group.links.map((link) => (
                  <Link
                    key={link.label}
                    to={link.to}
                    {...("hash" in link ? { hash: link.hash } : {})}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            ))}
          </nav>
        </div>
        <div className="marketing-footer-bottom">
          <p>© {new Date().getFullYear()} DeliverX</p>
          <nav aria-label="Legal">
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/cookies">Cookies</Link>
          </nav>
          <a
            href="#top"
            onClick={(event) => {
              event.preventDefault();
              window.scrollTo({
                top: 0,
                behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
                  ? "auto"
                  : "smooth",
              });
            }}
          >
            Back to top ↑
          </a>
        </div>
      </div>
    </footer>
  );
}
