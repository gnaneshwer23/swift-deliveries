import { Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/brand-logo";

export function MarketingFooter() {
  return (
    <footer className="footer">
      <BrandLogo />
      <div className="footer-links">
        <Link to="/how-it-works">How it works</Link>
        <Link to="/experience">Experience</Link>
        <Link to="/launchpad">Launchpad</Link>
        <Link to="/professional-workspace">Workspace</Link>
        <Link to="/pricing">Pricing</Link>
        <Link to="/privacy">Privacy</Link>
        <Link to="/terms">Terms</Link>
      </div>
      <span className="footer-right">© 2026 DeliverX</span>
    </footer>
  );
}
