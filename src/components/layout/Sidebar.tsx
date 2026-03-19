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
  Clock,
  LogOut,
  ChevronDown,
  BookOpen,
  Calculator,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  description: string;
  children?: { label: string; href: string; icon: React.ElementType }[];
}

const NAV_ITEMS: NavItem[] = [
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
    children: [
      { label: "Log Session", href: "/range", icon: Package },
      { label: "Session History", href: "/range/history", icon: Clock },
      { label: "Drill Library", href: "/range/drills", icon: BookOpen },
      { label: "Hit Factor Calc", href: "/range/hit-factor", icon: Calculator },
    ],
  },
  {
    label: "Documents",
    href: "/documents",
    icon: FileText,
    description: "Recipes & tax stamps",
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    description: "Configuration",
  },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [rangeExpanded, setRangeExpanded] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Auto-expand Range if on a range path
  useEffect(() => {
    if (pathname.startsWith("/range")) {
      setRangeExpanded(true);
    }
  }, [pathname]);

  // Close mobile menu on route change
  useEffect(() => {
    onMobileClose?.();
  }, [pathname, onMobileClose]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch {
      setLoggingOut(false);
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
              : pathname === item.href || (item.href !== "/range" && pathname.startsWith(item.href));
          const isRangeParent = item.href === "/range";
          const isRangeActive = pathname.startsWith("/range");

          if (isRangeParent && item.children) {
            return (
              <div key={item.href}>
                <button
                  onClick={() => !collapsed && setRangeExpanded((v) => !v)}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "w-full flex items-center gap-3 px-2.5 py-2 rounded-md text-sm transition-all duration-150 group relative",
                    isRangeActive
                      ? "bg-[#00C2FF]/10 text-[#00C2FF] border border-[#00C2FF]/20"
                      : "text-vault-text-muted hover:text-vault-text hover:bg-vault-border"
                  )}
                >
                  {isRangeActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#00C2FF] rounded-r-full" />
                  )}
                  <Icon
                    className={cn(
                      "shrink-0 transition-colors",
                      collapsed ? "w-5 h-5" : "w-4 h-4",
                      isRangeActive ? "text-[#00C2FF]" : "text-vault-text-faint group-hover:text-vault-text-muted"
                    )}
                  />
                  {!collapsed && (
                    <>
                      <span className="font-medium tracking-wide truncate flex-1 text-left">
                        {item.label}
                      </span>
                      <ChevronDown
                        className={cn(
                          "w-3 h-3 shrink-0 transition-transform",
                          rangeExpanded ? "rotate-180" : ""
                        )}
                      />
                    </>
                  )}
                </button>
                {!collapsed && rangeExpanded && (
                  <div className="ml-3 mt-0.5 space-y-0.5 border-l border-vault-border pl-3">
                    {item.children.map((child) => {
                      const ChildIcon = child.icon;
                      const childActive = pathname === child.href;
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            "flex items-center gap-2.5 px-2 py-1.5 rounded-md text-xs transition-all",
                            childActive
                              ? "text-[#00C2FF] bg-[#00C2FF]/5"
                              : "text-vault-text-faint hover:text-vault-text-muted hover:bg-vault-border"
                          )}
                        >
                          <ChildIcon className="w-3.5 h-3.5 shrink-0" />
                          <span>{child.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

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

      {/* Bottom: logout + collapse */}
      <div className="px-2 pb-3 shrink-0 border-t border-vault-border pt-2 space-y-1">
        {/* Logout button */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          title={collapsed ? "Logout" : undefined}
          className="w-full flex items-center gap-3 px-2.5 py-2 rounded-md text-sm text-vault-text-faint hover:text-[#E53935] hover:bg-[#E53935]/5 transition-colors"
        >
          <LogOut className={cn("shrink-0", collapsed ? "w-5 h-5" : "w-4 h-4")} />
          {!collapsed && <span className="tracking-wide">Logout</span>}
        </button>

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
      <aside
        className={cn(
          "hidden md:flex flex-col h-screen border-r border-vault-border bg-vault-surface transition-all duration-300 ease-in-out shrink-0",
          collapsed ? "w-16" : "w-56"
        )}
      >
        {navContent}
      </aside>

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
