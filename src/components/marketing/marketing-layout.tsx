import { MarketingNav } from "./marketing-nav";
import { MarketingFooter } from "./marketing-footer";

export function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dxs marketing-page" id="top">
      <a className="public-skip-link" href="#marketing-content">
        Skip to content
      </a>
      <MarketingNav />
      <main id="marketing-content" tabIndex={-1}>
        {children}
      </main>
      <MarketingFooter />
    </div>
  );
}
