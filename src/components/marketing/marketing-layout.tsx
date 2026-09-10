import { MarketingNav } from "./marketing-nav";
import { MarketingFooter } from "./marketing-footer";

export function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="marketing-page min-h-screen bg-[var(--mkt-ink)] text-[var(--mkt-text1)]">
      <MarketingNav />
      <main className="pt-[calc(var(--mkt-navh)+1rem)]">{children}</main>
      <MarketingFooter />
    </div>
  );
}
