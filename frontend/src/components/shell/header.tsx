"use client";

import { LogOut, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth/auth-context";
import { useLogout } from "@/lib/auth/use-logout";

type HeaderProps = {
  onMenuClick: () => void;
  onSearchClick: () => void;
};

export function Header({
  onMenuClick,
  onSearchClick,
}: HeaderProps) {
  const { user } = useAuth();
  const logout = useLogout();
  const displayName = user?.name || user?.email || "Account";

  return (
    <header className="glass sticky top-0 z-30 flex h-14 items-center justify-between px-4 lg:ml-16">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
          aria-label="Open navigation"
        >
          <Menu className="size-5" />
        </Button>

        <button
          type="button"
          onClick={onSearchClick}
          className="flex h-9 items-center gap-2 rounded-md border border-border bg-background/50 px-3 text-sm text-muted-foreground transition-ui hover:text-foreground"
        >
          <Search className="size-4" />

          <span className="hidden sm:inline">
            Search
          </span>

          <kbd className="ml-2 hidden rounded border border-border px-1.5 py-0.5 font-mono text-[10px] sm:inline">
            ⌘K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-xs text-muted-foreground sm:block">
          Incident Management
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon" aria-label="Account menu" />}
          >
            <span className="flex size-8 items-center justify-center rounded-full border border-border bg-muted font-mono text-xs font-semibold text-foreground">
              {displayName.slice(0, 1).toUpperCase()}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <span className="block truncate">{displayName}</span>
              <span className="mt-1 block text-xs font-normal text-muted-foreground">
                {user?.role ?? ""}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} variant="destructive">
              <LogOut />Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}