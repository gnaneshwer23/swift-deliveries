import { MarketingNav } from "./marketing-nav";
import { MarketingFooter } from "./marketing-footer";

export function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dxs marketing-page">
      <MarketingNav />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  );
}
