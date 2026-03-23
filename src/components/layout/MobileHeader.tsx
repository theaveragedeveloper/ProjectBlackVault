"use client";

import { useState } from "react";
import { Shield, Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";

export function MobileHeader() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="md:hidden flex items-center gap-3 h-14 px-4 border-b border-vault-border bg-vault-surface shrink-0">
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-md border border-vault-border text-vault-text-faint hover:text-vault-text-muted hover:bg-vault-border/60 transition-colors"
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[11px] font-medium tracking-wider uppercase">
            Menu
          </span>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#00C2FF]/10 border border-[#00C2FF]/30 flex items-center justify-center">
            <Shield className="w-3.5 h-3.5 text-[#00C2FF]" />
          </div>
          <p className="text-xs font-bold text-vault-text tracking-widest uppercase">
            BlackVault
          </p>
        </div>
      </header>
      <Sidebar
        mobileOnly
        mobileOpen={open}
        onMobileClose={() => setOpen(false)}
      />
    </>
  );
}
