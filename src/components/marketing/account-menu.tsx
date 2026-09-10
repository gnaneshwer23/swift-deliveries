import { Link } from "@tanstack/react-router";
import { LayoutDashboard, LogOut, User as UserIcon } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSignOut } from "@/hooks/use-sign-out";

export function displayNameFor(user: User) {
  const meta = user.user_metadata as { full_name?: string; name?: string } | undefined;
  return meta?.full_name || meta?.name || user.email || "Account";
}

function initialsFor(name: string) {
  return name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function AccountMenu({ user }: { user: User }) {
  const signOut = useSignOut();
  const name = displayNameFor(user);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-xl border border-[var(--mkt-border)] bg-[var(--mkt-s1)] py-1.5 pl-1.5 pr-3 text-sm font-medium text-[var(--mkt-text1)] transition-colors hover:bg-[var(--mkt-s2)]"
        >
          <span className="grid size-7 place-items-center rounded-lg bg-[var(--mkt-green)] text-xs font-semibold text-[var(--mkt-on-dark)]">
            {initialsFor(name) || "DX"}
          </span>
          <span className="max-w-[9rem] truncate">{name}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
          {user.email}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/workspace" className="flex items-center gap-2">
            <LayoutDashboard className="size-4" /> Workspace
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/workspace/profile" className="flex items-center gap-2">
            <UserIcon className="size-4" /> Your profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void signOut()} className="flex items-center gap-2">
          <LogOut className="size-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
