import { Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/brand-logo";
import { MARKETING_LINKS } from "./marketing-nav";
import { CAREER_SUITE_ENABLED } from "@/lib/features";

export function MarketingFooter() {
  return (
    <footer className="dxf">
      <div className="dxf-inner">
        <div className="dxf-brand">
          <BrandLogo />
          <p>Your idea, run like a product company.</p>
        </div>
        <nav className="dxf-cols" aria-label="Footer navigation">
          <div>
            <h2>Product</h2>
            {MARKETING_LINKS.map((l) => (
              <Link key={l.to} to={l.to}>
                {l.label}
              </Link>
            ))}
            <Link to="/login">Sign in</Link>
          </div>
          <div>
            <h2>Company</h2>
            <Link to="/about">About</Link>
            <Link to="/resources">Resources</Link>
            {CAREER_SUITE_ENABLED ? <Link to="/experience">Career suite</Link> : null}
          </div>
          <div>
            <h2>Legal</h2>
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/cookies">Cookies</Link>
          </div>
        </nav>
      </div>
      <div className="dxf-base">© {new Date().getFullYear()} DeliverX</div>
    </footer>
  );
}
