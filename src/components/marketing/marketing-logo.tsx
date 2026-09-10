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
    >
      <span
        className={`flex size-[30px] shrink-0 items-center justify-center rounded-[7px] ${
          light ? "bg-white/15" : "bg-[var(--mkt-green)]"
        }`}
        aria-hidden
      >
        <svg
          viewBox="0 0 14 14"
          className="size-3.5 stroke-white fill-none stroke-2 [stroke-linecap:round]"
        >
          <path d="M1 7h12M7 1v12M2 2l10 10M12 2L2 12" />
        </svg>
      </span>
      <span
        className={`font-serif text-lg tracking-[-0.01em] ${
          light ? "text-white" : "text-[var(--mkt-text1)]"
        }`}
      >
        DeliverX
      </span>
    </Link>
  );
}
