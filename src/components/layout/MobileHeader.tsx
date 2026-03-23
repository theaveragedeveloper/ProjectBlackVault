"use client";

import { useState } from "react";
import { Shield, Menu, LogOut } from "lucide-react";
import { Sidebar } from "./Sidebar";

interface MobileHeaderProps {
  passwordModeEnabled?: boolean;
}

export function MobileHeader({ passwordModeEnabled = false }: MobileHeaderProps) {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      await fetch("/api/session/logout", {
        method: "POST",
        cache: "no-store",
      });
    } finally {
      sessionStorage.clear();
      sessionStorage.removeItem("blackvault-unlocked");
      localStorage.removeItem("blackvault-unlocked");
      window.location.href = "/";
    }
  }

  return (
    <>
      <header className="md:hidden flex items-center gap-3 h-14 px-4 border-b border-vault-border bg-vault-surface shrink-0">
        <button
          onClick={() => setOpen(true)}
          className="p-1.5 text-vault-text-faint hover:text-vault-text-muted transition-colors"
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#00C2FF]/10 border border-[#00C2FF]/30 flex items-center justify-center">
            <Shield className="w-3.5 h-3.5 text-[#00C2FF]" />
          </div>
          <p className="text-xs font-bold text-vault-text tracking-widest uppercase">
            BlackVault
          </p>
        </div>
        {passwordModeEnabled && (
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="ml-auto p-1.5 text-vault-text-faint hover:text-vault-text-muted transition-colors disabled:opacity-60"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </header>
      <Sidebar
        mobileOnly
        mobileOpen={open}
        onMobileClose={() => setOpen(false)}
        passwordModeEnabled={passwordModeEnabled}
      />
    </>
  );
}
