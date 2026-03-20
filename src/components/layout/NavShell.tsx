"use client";

import { useState, useCallback } from "react";
import { Sidebar } from "./Sidebar";
import { MobileHeader } from "./MobileHeader";

export function NavShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const handleMobileClose = useCallback(() => setMobileOpen(false), []);
  const handleMenuOpen = useCallback(() => setMobileOpen(true), []);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={handleMobileClose} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <MobileHeader onMenuOpen={handleMenuOpen} />
        <main className="flex-1 overflow-y-auto min-w-0">{children}</main>
      </div>
    </div>
  );
}
