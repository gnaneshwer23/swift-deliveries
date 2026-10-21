import { Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/brand-logo";

export function MarketingFooter() {
  return (
    <footer className="footer">
      <div className="flex w-full flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <BrandLogo />
          <span className="footer-right">© 2026 DeliverX · Supervised AI Workforce</span>
        </div>
        <div className="footer-links" aria-label="Footer navigation">
          <Link to="/how-it-works">How it works</Link>
          <Link to="/signup">Open Command Centre</Link>
          <Link to="/pricing">Pricing</Link>
          <Link to="/resources">Resources</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
        </div>
        <div className="border-t pt-4" style={{ borderColor: "var(--x-border)" }}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--x-slate-light)" }}>
            Existing career products
          </p>
          <div className="footer-links">
            <Link to="/experience">Experience</Link>
            <Link to="/launchpad">Launchpad</Link>
            <Link to="/prove">Prove</Link>
            <Link to="/professional-workspace">Career workspace</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
