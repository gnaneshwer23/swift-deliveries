import { Link } from "@tanstack/react-router";

export function MarketingLogo({
  href = "/",
  light = false,
}: {
  href?: string;
  light?: boolean;
}) {
  return (
    <Link
      to={href}
      className="mr-auto flex items-center gap-3 no-underline"
      aria-label="DeliverX home"
    >
      <span
        className={`flex size-8 shrink-0 items-center justify-center ${
          light ? "bg-[var(--mkt-on-dark-muted)]" : "bg-[var(--mkt-text1)]"
        }`}
        aria-hidden
      >
        <svg
          viewBox="0 0 16 16"
          className="size-4 fill-none stroke-[var(--mkt-on-dark)] stroke-[2.25] [stroke-linecap:square]"
        >
          <path d="M3 3l10 10M13 3L3 13" />
        </svg>
      </span>
      <span
        className={`text-lg font-black uppercase ${
          light ? "text-[var(--mkt-on-dark)]" : "text-[var(--mkt-text1)]"
        }`}
      >
        Deliver<span className="text-[var(--mkt-green-l)]">X</span>
      </span>
    </Link>
  );
}
