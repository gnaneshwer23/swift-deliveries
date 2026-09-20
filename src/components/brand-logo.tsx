import { Link } from "@tanstack/react-router";

export function BrandMark({ className = "brand-mark" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" role="img" aria-label="DeliverX">
      <rect width="32" height="32" rx="6" fill="currentColor" />
      <path d="M8 8l16 16M24 8L8 24" fill="none" stroke="var(--brand-mark-stroke, #fff)" strokeWidth="3.25" strokeLinecap="square" />
      <rect x="13" y="13" width="6" height="6" rx="1" fill="var(--brand-mark-signal, #C98A12)" />
    </svg>
  );
}

export function BrandLogo({
  to = "/",
  inverse = false,
  className = "brand-logo",
}: {
  to?: string;
  inverse?: boolean;
  className?: string;
}) {
  return (
    <Link to={to} className={className} aria-label="DeliverX home">
      <BrandMark className="brand-logo-mark" />
      <span className={inverse ? "brand-logo-word brand-logo-word-inverse" : "brand-logo-word"}>
        Deliver<span>X</span>
      </span>
    </Link>
  );
}