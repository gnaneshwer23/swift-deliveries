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
      className="mr-auto flex items-center gap-2.5 no-underline"
      aria-label="DeliverX home"
    >
      <span
        className={`flex size-8 shrink-0 items-center justify-center rounded-[0.65rem] ${
          light ? "bg-[var(--mkt-green-l)]" : "bg-[var(--mkt-green)]"
        }`}
        aria-hidden
      >
        <svg
          viewBox="0 0 16 16"
          className="size-4 fill-none stroke-[var(--mkt-on-dark)] stroke-[2.25] [stroke-linecap:round]"
        >
          <path d="M3 3l10 10M13 3L3 13" />
        </svg>
      </span>
      <span
        className={`text-lg font-bold ${
          light ? "text-[var(--mkt-on-dark)]" : "text-[var(--mkt-text1)]"
        }`}
      >
        Deliver<span className="text-[var(--mkt-green-bright)]">X</span>
      </span>
    </Link>
  );
}
