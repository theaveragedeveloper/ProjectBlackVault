"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  Crosshair,
  Package,
  Layers,
  Target,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  X,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

const NAV_ITEMS = [
  {
    label: "Command",
    href: "/",
    icon: Zap,
    description: "Overview & stats",
  },
  {
    label: "Vault",
    href: "/vault",
    icon: Shield,
    description: "Firearms inventory",
  },
  {
    label: "Loadouts",
    href: "/builds",
    icon: Layers,
    description: "Build configurations",
  },
  {
    label: "Accessories",
    href: "/accessories",
    icon: Crosshair,
    description: "Parts & attachments",
  },
  {
    label: "Ammo",
    href: "/ammo",
    icon: Target,
    description: "Ammunition storage",
  },
  {
    label: "Range",
    href: "/range",
    icon: Package,
    description: "Log range sessions",
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    description: "Configuration",
  },
];

interface SidebarProps {
  mobileOnly?: boolean;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  passwordModeEnabled?: boolean;
}

export function Sidebar({
  mobileOnly = false,
  mobileOpen = false,
  onMobileClose,
  passwordModeEnabled = false,
}: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    onMobileClose?.();
  }, [pathname, onMobileClose]);

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

  const navContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-vault-border shrink-0">
        <div className="w-7 h-7 rounded bg-[#00C2FF]/10 border border-[#00C2FF]/30 flex items-center justify-center shrink-0">
          <Shield className="w-4 h-4 text-[#00C2FF]" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden flex-1 min-w-0">
            <p className="text-xs font-bold text-vault-text tracking-widest uppercase leading-none">
              BlackVault
            </p>
            <p className="text-[10px] text-vault-text-faint tracking-wider uppercase mt-0.5">
              Armory Platform
            </p>
          </div>
        )}
        {/* Mobile close button */}
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="md:hidden ml-auto p-1 text-vault-text-faint hover:text-vault-text-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 px-2.5 py-2 rounded-md text-sm transition-all duration-150 group relative",
                isActive
                  ? "bg-[#00C2FF]/10 text-[#00C2FF] border border-[#00C2FF]/20"
                  : "text-vault-text-muted hover:text-vault-text hover:bg-vault-border"
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#00C2FF] rounded-r-full" />
              )}
              <Icon
                className={cn(
                  "shrink-0 transition-colors",
                  collapsed ? "w-5 h-5" : "w-4 h-4",
                  isActive ? "text-[#00C2FF]" : "text-vault-text-faint group-hover:text-vault-text-muted"
                )}
              />
              {!collapsed && (
                <span className="font-medium tracking-wide truncate">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-2 pb-3 shrink-0 border-t border-vault-border pt-2 space-y-1.5">
        {passwordModeEnabled && (
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-vault-text-faint hover:text-vault-text-muted hover:bg-vault-border transition-colors disabled:opacity-60"
            title={collapsed ? "Logout" : undefined}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && (
              <span className="text-xs tracking-wider uppercase">
                {loggingOut ? "Logging Out..." : "Logout"}
              </span>
            )}
          </button>
        )}

        {/* Collapse toggle — desktop only */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex w-full items-center justify-center gap-2 px-2.5 py-2 rounded-md text-vault-text-faint hover:text-vault-text-muted hover:bg-vault-border transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span className="text-xs tracking-wider uppercase">Collapse</span>
            </>
          )}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      {!mobileOnly && (
        <aside
          className={cn(
            "hidden md:flex flex-col h-screen border-r border-vault-border bg-vault-surface transition-all duration-300 ease-in-out shrink-0",
            collapsed ? "w-16" : "w-56"
          )}
        >
          {navContent}
        </aside>
      )}

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={onMobileClose}
          />
          {/* Drawer */}
          <aside className="fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-vault-surface border-r border-vault-border md:hidden animate-slide-up">
            {navContent}
          </aside>
        </>
      )}
    </>
  );
}
