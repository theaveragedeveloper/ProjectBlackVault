"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  Crosshair,
  Layers,
  Target,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  X,
  FileText,
  ChevronDown,
  Timer,
  History,
  Calculator,
  Library,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

const PRIMARY_NAV_ITEMS = [
  { label: "Command", href: "/", icon: Zap, description: "Overview & stats" },
  { label: "Vault", href: "/vault", icon: Shield, description: "Firearms inventory" },
  { label: "Builds", href: "/builds", icon: Layers, description: "Build configurations" },
  { label: "Accessories", href: "/accessories", icon: Crosshair, description: "Parts & attachments" },
  { label: "Ammo", href: "/ammo", icon: Target, description: "Ammunition storage" },
] as const;

const RANGE_CHILD_ITEMS = [
  { label: "Log Range Session", href: "/range/log-session", icon: Target },
  { label: "Range Session History", href: "/range/session-history", icon: History },
  { label: "Log a Drill", href: "/range/log-drill", icon: Timer },
  { label: "Drill Performance", href: "/range/drill-performance", icon: Timer },
  { label: "Drill Library", href: "/range/drill-library", icon: Library },
  { label: "Hit Factor Calculator", href: "/range/hit-factor", icon: Calculator },
] as const;

const BOTTOM_NAV_ITEMS = [
  { label: "Documents", href: "/documents", icon: FileText, description: "Document library" },
  { label: "Settings", href: "/settings", icon: Settings, description: "Configuration" },
] as const;

interface SidebarProps {
  mobileOnly?: boolean;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOnly = false, mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [rangeOpen, setRangeOpen] = useState(pathname.startsWith("/range"));
  const isRangeRoute = pathname.startsWith("/range");
  const rangeSectionOpen = isRangeRoute || rangeOpen;

  useEffect(() => {
    onMobileClose?.();
  }, [pathname, onMobileClose]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onMobileClose?.();
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [mobileOpen, onMobileClose]);

  const navContent = (
    <>
      <div className="flex items-center gap-3 px-4 h-14 border-b border-vault-border shrink-0">
        <div className="w-7 h-7 rounded bg-[#00C2FF]/10 border border-[#00C2FF]/30 flex items-center justify-center shrink-0">
          <Shield className="w-4 h-4 text-[#00C2FF]" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden flex-1 min-w-0">
            <p className="text-xs font-bold text-vault-text tracking-widest uppercase leading-none">BlackVault</p>
            <p className="text-[10px] text-vault-text-faint tracking-wider uppercase mt-0.5">Armory Platform</p>
          </div>
        )}
        {onMobileClose && (
          <button onClick={onMobileClose} className="md:hidden ml-auto p-1 text-vault-text-faint hover:text-vault-text-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto overscroll-contain py-3 space-y-0.5 px-2 pb-6">
        {!collapsed && <p className="px-2.5 pb-2 text-[10px] tracking-[0.18em] uppercase text-vault-text-faint">Navigation</p>}

        {PRIMARY_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} onClick={() => onMobileClose?.()} title={collapsed ? item.label : undefined} className={cn("flex items-center gap-3 px-2.5 py-2 rounded-md text-sm transition-all duration-150 group relative", isActive ? "bg-[#00C2FF]/10 text-[#00C2FF] border border-[#00C2FF]/20" : "text-vault-text-muted hover:text-vault-text hover:bg-vault-border")}>
              {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#00C2FF] rounded-r-full" />}
              <Icon className={cn("shrink-0 transition-colors", collapsed ? "w-5 h-5" : "w-4 h-4", isActive ? "text-[#00C2FF]" : "text-vault-text-faint group-hover:text-vault-text-muted")} />
              {!collapsed && (
                <span className="min-w-0">
                  <span className="block font-medium tracking-wide truncate">{item.label}</span>
                  <span className="block text-[11px] text-vault-text-faint truncate">{item.description}</span>
                </span>
              )}
            </Link>
          );
        })}

        <div>
          <button
            onClick={() => setRangeOpen((prev) => !prev)}
            className={cn(
              "w-full flex items-center gap-3 px-2.5 py-2 rounded-md text-sm transition-all duration-150 group relative",
              isRangeRoute ? "bg-[#00C2FF]/10 text-[#00C2FF] border border-[#00C2FF]/20" : "text-vault-text-muted hover:text-vault-text hover:bg-vault-border"
            )}
            title={collapsed ? "Range" : undefined}
          >
            {isRangeRoute && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#00C2FF] rounded-r-full" />}
            <Target className={cn("shrink-0 transition-colors", collapsed ? "w-5 h-5" : "w-4 h-4", isRangeRoute ? "text-[#00C2FF]" : "text-vault-text-faint group-hover:text-vault-text-muted")} />
            {!collapsed && (
              <>
                <span className="min-w-0 text-left">
                  <span className="block font-medium tracking-wide truncate">Range</span>
                  <span className="block text-[11px] text-vault-text-faint truncate">Sessions & drills</span>
                </span>
                <ChevronDown className={cn("w-4 h-4 ml-auto transition-transform", rangeSectionOpen ? "rotate-180" : "rotate-0")} />
              </>
            )}
          </button>

          {!collapsed && rangeSectionOpen && (
            <div className="mt-1 ml-4 border-l border-vault-border pl-2 space-y-0.5">
              {RANGE_CHILD_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} onClick={() => onMobileClose?.()} className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-vault-text-muted hover:text-vault-text hover:bg-vault-border transition-colors">
                    <Icon className="w-3.5 h-3.5 text-vault-text-faint" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="pt-2 mt-2 border-t border-vault-border/70">
          {BOTTOM_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} onClick={() => onMobileClose?.()} title={collapsed ? item.label : undefined} className={cn("flex items-center gap-3 px-2.5 py-2 rounded-md text-sm transition-all duration-150 group relative", isActive ? "bg-[#00C2FF]/10 text-[#00C2FF] border border-[#00C2FF]/20" : "text-vault-text-muted hover:text-vault-text hover:bg-vault-border")}>
                {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#00C2FF] rounded-r-full" />}
                <Icon className={cn("shrink-0 transition-colors", collapsed ? "w-5 h-5" : "w-4 h-4", isActive ? "text-[#00C2FF]" : "text-vault-text-faint group-hover:text-vault-text-muted")} />
                {!collapsed && (
                  <span className="min-w-0">
                    <span className="block font-medium tracking-wide truncate">{item.label}</span>
                    <span className="block text-[11px] text-vault-text-faint truncate">{item.description}</span>
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="px-2 pb-3 shrink-0 border-t border-vault-border pt-2 space-y-1.5">
        <button onClick={() => setCollapsed(!collapsed)} className="hidden md:flex w-full items-center justify-center gap-2 px-2.5 py-2 rounded-md text-vault-text-faint hover:text-vault-text-muted hover:bg-vault-border transition-colors">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span className="text-xs tracking-wider uppercase">Collapse</span></>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {!mobileOnly && (
        <aside className={cn("hidden md:flex flex-col h-svh border-r border-vault-border bg-vault-surface transition-all duration-300 ease-in-out shrink-0", collapsed ? "w-16" : "w-56")}>
          {navContent}
        </aside>
      )}

      <div className={cn("fixed inset-0 z-[420] md:hidden transition-opacity", mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0")} aria-hidden={!mobileOpen}>
        <div className="absolute inset-0 bg-black/60" onClick={onMobileClose} />
        <aside
          id="mobile-navigation"
          className={cn(
            "absolute inset-y-0 left-0 flex h-svh max-h-svh w-72 max-w-[88vw] flex-col overflow-hidden border-r border-vault-border bg-vault-surface shadow-2xl transition-transform duration-200",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {navContent}
        </aside>
      </div>
    </>
  );
}
