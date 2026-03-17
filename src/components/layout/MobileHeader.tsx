"use client";

import { Menu } from "lucide-react";

interface MobileHeaderProps {
  onMenuOpen: () => void;
}

export function MobileHeader({ onMenuOpen }: MobileHeaderProps) {
  return (
    <header className="md:hidden sticky top-0 z-30 flex items-center gap-3 h-16 px-3 border-b border-vault-border/80 bg-vault-surface/95 backdrop-blur-sm shrink-0">
      <button
        onClick={onMenuOpen}
        className="p-2 rounded-md text-vault-text-faint hover:text-vault-text-muted hover:bg-vault-border transition-colors"
        aria-label="Open navigation"
      >
        <Menu className="w-5 h-5" />
      </button>
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-8 h-8 rounded bg-[#00C2FF]/10 border border-[#00C2FF]/30 flex items-center justify-center p-1">
          <img src="/blackvault-logo.svg" alt="BlackVault logo" width={20} height={20} className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-vault-text tracking-widest uppercase truncate">BlackVault</p>
          <p className="text-[10px] text-vault-text-faint uppercase tracking-wider truncate">Armory Platform</p>
        </div>
      </div>
    </header>
  );
}
