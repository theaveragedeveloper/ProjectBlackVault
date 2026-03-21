"use client";

import { useCallback, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { MobileHeader } from "./MobileHeader";

export function NavShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const hideNavigation = pathname === "/login";
  const closeMobileMenu = useCallback(() => setMobileOpen(false), []);
  const openMobileMenu = useCallback(() => setMobileOpen(true), []);

  if (hideNavigation) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={closeMobileMenu} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <MobileHeader onMenuOpen={openMobileMenu} />
        <main className="flex-1 overflow-y-auto min-w-0">{children}</main>
      </div>
    </div>
  );
}
