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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

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

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex flex-col h-screen border-r border-[#1C2530] bg-[#0E1318] transition-all duration-300 ease-in-out shrink-0",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-[#1C2530] shrink-0">
        <div className="w-7 h-7 rounded bg-[#00C2FF]/10 border border-[#00C2FF]/30 flex items-center justify-center shrink-0">
          <Shield className="w-4 h-4 text-[#00C2FF]" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-[#E8EDF2] tracking-widest uppercase leading-none">
              BlackVault
            </p>
            <p className="text-[10px] text-[#4A5A6B] tracking-wider uppercase mt-0.5">
              Armory Platform
            </p>
          </div>
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
                  : "text-[#8B9DB0] hover:text-[#E8EDF2] hover:bg-[#1C2530]"
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#00C2FF] rounded-r-full" />
              )}
              <Icon
                className={cn(
                  "shrink-0 transition-colors",
                  collapsed ? "w-5 h-5" : "w-4 h-4",
                  isActive ? "text-[#00C2FF]" : "text-[#4A5A6B] group-hover:text-[#8B9DB0]"
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

      {/* Collapse toggle */}
      <div className="px-2 pb-3 shrink-0 border-t border-[#1C2530] pt-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-2.5 py-2 rounded-md text-[#4A5A6B] hover:text-[#8B9DB0] hover:bg-[#1C2530] transition-colors"
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
    </aside>
  );
}
