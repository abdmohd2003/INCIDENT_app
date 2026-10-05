"use client";

import {
  Bell,
  LayoutDashboard,
  ListTodo,
  Settings,
  ShieldAlert,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const navigation = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Incidents",
    href: "/incidents",
    icon: ShieldAlert,
  },
  {
    label: "Notifications",
    href: "/notifications",
    icon: Bell,
  },
  {
    label: "Team",
    href: "/settings/team",
    icon: Users,
  },
];

type SidebarProps = {
  mobileOpen?: boolean;
  onNavigate?: () => void;
};

export function Sidebar({
  mobileOpen = true,
  onNavigate,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex w-16 flex-col border-r border-border bg-background",
        "transition-transform duration-200",
        "lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div className="flex h-14 items-center justify-center border-b border-border">
        <Link
          href="/dashboard"
          aria-label="Incident Management Platform"
          onClick={onNavigate}
          className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground transition-ui hover:opacity-90"
        >
          <ShieldAlert className="size-5" />
        </Link>
      </div>

      <nav
        aria-label="Main navigation"
        className="flex flex-1 flex-col items-center gap-2 py-4"
      >
        {navigation.map((item) => {
          const Icon = item.icon;

          const isActive =
            pathname === item.href ||
            pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-label={item.label}
              className={cn(
                "flex size-10 items-center justify-center rounded-md",
                "transition-ui",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-5" />
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center justify-center border-t border-border py-3">
        <Link
          href="/settings/team"
          aria-label="Settings"
          onClick={onNavigate}
          className="flex size-10 items-center justify-center rounded-md text-muted-foreground transition-ui hover:bg-muted hover:text-foreground"
        >
          <Settings className="size-5" />
        </Link>
      </div>
    </aside>
  );
}