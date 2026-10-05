"use client";

import { useEffect, useState } from "react";

import { AuthGuard } from "@/components/auth/auth-guard";
import { CommandPalette } from "@/components/shell/command-palette";
import { Header } from "@/components/shell/header";
import { Sidebar } from "@/components/shell/sidebar";

export default function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        setCommandOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        {sidebarOpen && (
          <button
            type="button"
            aria-label="Close navigation"
            className="fixed inset-0 z-30 bg-black/40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <Sidebar
          mobileOpen={sidebarOpen}
          onNavigate={() => setSidebarOpen(false)}
        />

        <Header
          onMenuClick={() => setSidebarOpen(true)}
          onSearchClick={() => setCommandOpen(true)}
        />

        <main className="min-h-[calc(100vh-3.5rem)] lg:ml-16">
          {children}
        </main>

        <CommandPalette
          open={commandOpen}
          onOpenChange={setCommandOpen}
        />
      </div>
    </AuthGuard>
  );
}