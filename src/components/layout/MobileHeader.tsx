"use client";

import { useCallback, useEffect, useState } from "react";
import { Shield, Menu, Search } from "lucide-react";
import { Sidebar } from "./Sidebar";

export function MobileHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    const previousOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
    return () => {
      document.body.style.overflow = previous;
      document.body.style.overscrollBehavior = previousOverscroll;
    };
  }, [open]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) {
        setOpen(false);
      }
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleClose = useCallback(() => setOpen(false), []);

  return (
    <>
      <header className="md:hidden sticky top-0 z-[450] flex items-center gap-3 h-14 px-4 border-b border-vault-border bg-vault-surface/95 backdrop-blur shrink-0">
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="inline-flex min-h-10 items-center gap-1.5 px-2 py-1.5 rounded-md border border-vault-border text-vault-text-faint hover:text-vault-text-muted hover:bg-vault-border/60 transition-colors"
          aria-label="Open navigation"
          aria-expanded={open}
          aria-controls="mobile-navigation"
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
        <div className="ml-auto">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("bv:search:open"))}
            className="inline-flex min-h-10 items-center gap-1.5 px-2 py-1.5 rounded-md border border-vault-border text-vault-text-faint hover:text-vault-text-muted hover:bg-vault-border/60 transition-colors"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      </header>
      <Sidebar
        mobileOnly
        mobileOpen={open}
        onMobileClose={handleClose}
      />
    </>
  );
}
