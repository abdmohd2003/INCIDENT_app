"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, LogOut, Plus } from "lucide-react";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useLogout } from "@/lib/auth/use-logout";



type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CommandPalette({
  open,
  onOpenChange,
}: CommandPaletteProps) {
  const router = useRouter();
  const logout = useLogout();

  const navigate = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search"
      description="Search incidents, pages, and actions."
    >
      <Command>
        <CommandInput placeholder="Search incidents, pages, and actions..." />

        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => navigate("/incidents")}>
              <ArrowRight />
              Go to Incidents
            </CommandItem>
            <CommandItem onSelect={() => navigate("/incidents?create=1")}>
              <Plus />
              Create Incident
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Account">
            <CommandItem
              onSelect={() => {
                onOpenChange(false);
                logout();
              }}
            >
              <LogOut />
              Log out
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}