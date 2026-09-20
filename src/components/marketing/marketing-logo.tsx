import { BrandLogo } from "@/components/brand-logo";

export function MarketingLogo({
  href = "/",
  light = false,
}: {
  href?: string;
  light?: boolean;
}) {
  return <BrandLogo to={href} inverse={light} className="brand-logo mr-auto" />;
}
