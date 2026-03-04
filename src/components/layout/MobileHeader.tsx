"use client";

import { useState } from "react";
import { Shield, Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";

export function MobileHeader() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="md:hidden flex items-center gap-3 h-14 px-4 border-b border-[#21262D] bg-[#0D1117] shrink-0">
        <button
          onClick={() => setOpen(true)}
          className="p-1.5 text-[#5C6E82] hover:text-[#9AA5B4] transition-colors"
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#00C2FF]/10 border border-[#00C2FF]/30 flex items-center justify-center">
            <Shield className="w-3.5 h-3.5 text-[#00C2FF]" />
          </div>
          <p className="text-xs font-bold text-[#F7F9FC] tracking-widest uppercase">
            BlackVault
          </p>
        </div>
      </header>
      <Sidebar mobileOpen={open} onMobileClose={() => setOpen(false)} />
    </>
  );
}
