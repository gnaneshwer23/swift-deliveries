import { Link } from "@tanstack/react-router";

export function MarketingFooter() {
  return (
    <footer className="footer">
      <span className="footer-logo">DeliverX</span>
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
