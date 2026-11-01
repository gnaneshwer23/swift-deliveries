import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LayoutDashboard, LogOut, Radar, User as UserIcon } from "lucide-react";
import type { AppUser as User } from "@/lib/auth/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSignOut } from "@/hooks/use-sign-out";
import { myProfileQuery } from "@/lib/profile-queries";
import { initialsOf } from "@/lib/profile-summary";

function displayNameFor(user: User) {
  const meta = user.user_metadata as { full_name?: string; name?: string } | undefined;
  return meta?.full_name || meta?.name || user.email || "Account";
}

export function AccountMenu({ user }: { user: User }) {
  const signOut = useSignOut();
  const profile = useQuery({ ...myProfileQuery, retry: false });
  const name = profile.data?.fullName || displayNameFor(user);
  const role = profile.data?.role;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-full border border-[var(--mkt-border)] bg-[var(--mkt-s2)] py-1.5 pl-1.5 pr-3 text-sm font-medium text-[var(--mkt-text1)] transition-colors hover:bg-[var(--mkt-s3)]"
        >
          <span className="grid size-7 place-items-center rounded-full bg-[var(--mkt-green)] text-xs font-semibold text-white">
            {initialsOf(name)}
          </span>
          <span className="max-w-[9rem] truncate">{name}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="dx-account-menu w-64 p-1.5">
        <DropdownMenuLabel className="flex items-center gap-3 px-2 py-2.5 font-normal">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#1c1b19] text-sm font-semibold text-[#d9b47a]">
            {initialsOf(name)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-foreground">{name}</span>
            {role ? (
              <span className="block truncate text-xs text-foreground/70">{role}</span>
            ) : null}
            <span className="block truncate text-xs text-muted-foreground" title={user.email ?? ""}>
              {user.email}
            </span>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/command" className="flex items-center gap-2.5">
            <Radar className="size-4" /> Studio
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/command/programmes" className="flex items-center gap-2.5">
            <LayoutDashboard className="size-4" /> Programmes
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/profile" className="flex items-center gap-2.5">
            <UserIcon className="size-4" /> Profile &amp; preferences
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void signOut()} className="flex items-center gap-2.5">
          <LogOut className="size-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
